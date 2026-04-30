"""Fixtures for SharedRoom integration tests.

These tests exercise the room state machine end-to-end without a real
RemGlk subprocess or websocket. The seam is the ``vm_factory`` that
``SharedRoom`` accepts; tests pass a factory that hands out
``FakeVM`` instances driven by an inline responder callback.

Fakes themselves live in ``tests/_fakes.py`` so the asgi tier can
share them.
"""

import asyncio
import json
import logging
from typing import Any

import pytest

from flutterbug_server.room import SharedRoom

from tests._fakes import FakeSocket, VMFactory, echo_responder

# Re-exported so test modules can keep importing from .conftest.
__all__ = [
    'FakeSocket',
    'VMFactory',
    'connect',
    'drain',
    'echo_responder',
    'init_msg',
    'line_msg',
    'specialresponse_msg',
]


async def drain(room: SharedRoom) -> None:
    """Wait for the room's queue task to finish processing pending input.

    Yields once first so any ``asyncio.create_task`` scheduled in the
    triggering call (e.g. ``remove_client``'s fileref cancel) gets a
    chance to enqueue work before we wait on it.
    """
    await asyncio.sleep(0)
    if room.queue_task is not None:
        try:
            await room.queue_task
        except Exception:
            pass


def connect(room: SharedRoom, name: str = 'P') -> tuple[int, FakeSocket]:
    """Add a fake client to the room; return (clientid, sock)."""
    sock = FakeSocket()
    clientid = room.add_client(sock, name, sessionid=f'sess-{name}')
    return clientid, sock


@pytest.fixture
def log() -> logging.Logger:
    return logging.getLogger('flutterbug.test')


@pytest.fixture
def factory() -> VMFactory:
    return VMFactory(echo_responder())


@pytest.fixture
def room(factory, log) -> SharedRoom:
    return SharedRoom(
        command='fake',
        log=log,
        cwd='/tmp',
        jsondebug=False,
        vm_factory=factory,
    )


def init_msg(gen: int = 0) -> str:
    return json.dumps({'type': 'init', 'gen': gen,
                       'metrics': {'width': 800, 'height': 600}})


def line_msg(value: str, gen: int) -> str:
    return json.dumps({'type': 'line', 'gen': gen, 'window': 1, 'value': value})


def specialresponse_msg(value: Any, gen: int) -> str:
    return json.dumps({'type': 'specialresponse', 'gen': gen,
                       'response': 'fileref_prompt', 'value': value})
