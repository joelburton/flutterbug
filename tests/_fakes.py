"""Shared fakes for room/asgi tests.

These stand in for the RemGlk subprocess and websocket client so tests
can drive ``SharedRoom`` (and the FastAPI app that wraps it) without
real I/O. Both the integration tier and the asgi tier import from here.
"""

import asyncio
import json
from typing import Callable, Optional


class _FakeStdin:
    def __init__(self, on_write: Callable[[bytes], None]) -> None:
        self._on_write = on_write
        self.closed = False

    def write(self, data: bytes) -> None:
        self._on_write(data)

    async def drain(self) -> None:
        return None

    def close(self) -> None:
        self.closed = True


class _FakeStdout:
    def __init__(self) -> None:
        self._queue: asyncio.Queue[bytes] = asyncio.Queue()
        self._eof = False

    async def readline(self) -> bytes:
        return await self._queue.get()

    def push(self, data: bytes) -> None:
        self._queue.put_nowait(data)

    def close(self) -> None:
        if not self._eof:
            self._eof = True
            self._queue.put_nowait(b'')


Responder = Callable[[dict], Optional[dict]]


class FakeVM:
    """Stand-in for an asyncio subprocess running a RemGlk interpreter.

    Each write to ``stdin`` is decoded as JSON and passed to a
    ``responder`` callback; the callback's return value (if any) is
    pushed back on ``stdout`` and the room reads it via ``gameread``.
    """

    def __init__(self, responder: Responder) -> None:
        self.responder = responder
        self.inputs: list[dict] = []
        self.stdin = _FakeStdin(self._handle_write)
        self.stdout = _FakeStdout()
        self.terminated = False

    def _handle_write(self, data: bytes) -> None:
        for raw_line in data.split(b'\n'):
            if not raw_line.strip():
                continue
            try:
                obj = json.loads(raw_line.decode())
            except Exception:
                continue
            self.inputs.append(obj)
            reply = self.responder(obj)
            if reply is not None:
                self.stdout.push(json.dumps(reply).encode() + b'\n')

    def push_response(self, payload: dict) -> None:
        """Inject a response unprompted (e.g. simulate an unsolicited update)."""
        self.stdout.push(json.dumps(payload).encode() + b'\n')

    def kill(self) -> None:
        """Simulate the VM dropping its pipe (gameread will return None)."""
        self.stdout.close()

    def terminate(self) -> None:
        self.terminated = True
        self.stdout.close()


class VMFactory:
    """Hands out a fresh FakeVM per launch; tests can swap the responder."""

    def __init__(self, responder: Responder) -> None:
        self.responder = responder
        self.instances: list[FakeVM] = []

    async def __call__(self, command: str, cwd: str) -> FakeVM:
        vm = FakeVM(self.responder)
        self.instances.append(vm)
        return vm


class FakeSocket:
    """Records every text frame that the room would send to a client."""

    def __init__(self) -> None:
        self.messages: list[dict] = []
        self.closed = False

    async def send_text(self, text: str) -> None:
        if self.closed:
            return
        self.messages.append(json.loads(text))

    def take_messages(self) -> list[dict]:
        """Return + clear messages in one step (eases per-step assertions)."""
        out, self.messages = self.messages, []
        return out


def echo_responder(starting_gen: int = 0) -> Responder:
    """Default responder: bumps ``gen`` per input and emits a minimal update.

    Includes one buffer window with ``input: line`` so the room treats
    each turn as a normal play state. Tests override per-message via
    ``vm_factory.responder = ...`` for special cases.
    """
    state = {'gen': starting_gen}

    def respond(inobj: dict) -> dict:
        state['gen'] += 1
        return {
            'type': 'update',
            'gen': state['gen'],
            'windows': [{'id': 1, 'type': 'buffer'}],
            'input': [{'id': 1, 'type': 'line'}],
        }
    return respond
