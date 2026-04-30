"""Direct unit tests for ``PersistSession.gameread``.

The integration suite exercises the happy path (one full message per
chunk), but the new ``raw_decode``-based parser also has to handle:
chunk boundaries that fall inside a JSON object, two complete objects
arriving in one chunk, and partial UTF-8 sequences split across reads.
"""

import asyncio
import json
import logging

import pytest

from flutterbug_server.room import PersistSession


class _StdoutQueue:
    def __init__(self) -> None:
        self._queue: asyncio.Queue[bytes] = asyncio.Queue()

    async def readline(self) -> bytes:
        return await self._queue.get()

    def push(self, data: bytes) -> None:
        self._queue.put_nowait(data)

    def eof(self) -> None:
        self._queue.put_nowait(b'')


class _FakeProc:
    def __init__(self) -> None:
        self.stdin = None
        self.stdout = _StdoutQueue()

    def terminate(self) -> None:  # pragma: no cover - unused here
        pass


@pytest.fixture
def session():
    sess = PersistSession('fake', logging.getLogger('test'), '/tmp')
    sess.proc = _FakeProc()
    sess._readbuf = b''
    return sess


async def test_gameread_returns_one_complete_object(session):
    session.proc.stdout.push(b'{"type": "update", "gen": 1}\n')
    res = await session.gameread()
    assert json.loads(res) == {'type': 'update', 'gen': 1}


async def test_gameread_assembles_object_split_across_chunks(session):
    session.proc.stdout.push(b'{"type": "upd')
    session.proc.stdout.push(b'ate", "gen":')
    session.proc.stdout.push(b' 7}\n')
    res = await session.gameread()
    assert json.loads(res) == {'type': 'update', 'gen': 7}


async def test_gameread_keeps_trailing_bytes_for_next_call(session):
    # Two complete objects + the start of a third arrive at once. First
    # gameread returns object #1, second returns #2, third must wait.
    session.proc.stdout.push(
        b'{"a": 1}\n{"b": 2}\n{"c":')
    first = await session.gameread()
    second = await session.gameread()
    assert json.loads(first) == {'a': 1}
    assert json.loads(second) == {'b': 2}

    third_task = asyncio.create_task(session.gameread())
    await asyncio.sleep(0)
    assert not third_task.done()
    session.proc.stdout.push(b' 3}\n')
    res = await third_task
    assert json.loads(res) == {'c': 3}


async def test_gameread_handles_partial_utf8_across_chunks(session):
    # The character 'é' is two UTF-8 bytes (0xc3 0xa9); split mid-codepoint.
    payload = '{"x": "é"}\n'.encode('utf-8')
    split = payload.index(b'\xa9')
    session.proc.stdout.push(payload[:split])
    session.proc.stdout.push(payload[split:])
    res = await session.gameread()
    assert json.loads(res) == {'x': 'é'}


async def test_gameread_returns_none_on_eof(session):
    session.proc.stdout.eof()
    res = await session.gameread()
    assert res is None


async def test_gameread_returns_none_when_no_proc(session):
    session._readbuf = None  # close() clears this; gameread short-circuits
    res = await session.gameread()
    assert res is None


async def test_gameread_times_out_when_vm_silent(session):
    session.GAME_READ_TIMEOUT = 0.05
    res = await session.gameread()
    assert res is None
