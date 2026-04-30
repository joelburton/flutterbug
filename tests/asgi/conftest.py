"""ASGI-tier fixtures: real FastAPI app driven through Starlette's TestClient.

The real ``create_app`` runs (including its lifespan), but ``settings``
carries a ``vm_factory`` pointing at the shared FakeVM so no real
interpreter subprocess is launched. Each test owns its own tmp launch
directory; ``/savefiles`` and the room's cwd both look there.
"""

import json
from contextlib import contextmanager
from types import SimpleNamespace

import pytest
from starlette.testclient import TestClient

from flutterbug_server.app import create_app

from tests._fakes import VMFactory, echo_responder


@pytest.fixture
def launch_dir(tmp_path, monkeypatch):
    # The lifespan captures ``os.getcwd()`` as launch_dir; /savefiles globs
    # the same directory. chdir into tmp_path so both line up.
    monkeypatch.chdir(tmp_path)
    return tmp_path


@pytest.fixture
def vm_factory():
    return VMFactory(echo_responder())


@pytest.fixture
def password():
    """No password gate by default. Override in tests that need one."""
    return None


@pytest.fixture
def settings(launch_dir, vm_factory, password):
    return SimpleNamespace(
        command='fake',          # never executed; FakeVM stands in
        secret='test-secret',
        jsondebug=False,
        gidebug=False,
        story_path=None,         # skip IFDB lookup + Blorb unpack
        password=password,
        vm_factory=vm_factory,
    )


@pytest.fixture
def app(settings):
    return create_app(settings)


@pytest.fixture
def client(app):
    with TestClient(app) as c:
        yield c


@pytest.fixture
def fake_story_metadata(monkeypatch):
    """Override the IFDB lookup before the lifespan runs.

    Tests using this fixture must list it BEFORE ``client`` in their
    signature so the monkeypatch is in place when ``TestClient(app)``
    enters its lifespan and calls ``lookup_story_metadata``.
    """
    meta = {
        'title': 'Curses',
        'author': 'Graham Nelson',
        'cover_art_url': 'https://example.invalid/curses.png',
    }
    monkeypatch.setattr(
        'flutterbug_server.app.lookup_story_metadata',
        lambda path, log: meta,
    )
    return meta


@pytest.fixture
def signed_in_client(client):
    """A TestClient that has already POSTed signin and holds the session cookie."""
    r = client.post('/', data={'signin': '1'})
    assert r.status_code == 200
    return client


@contextmanager
def connect_as(client: TestClient, name: str):
    """Sign in fresh on the shared TestClient, then open a websocket.

    Multi-client tests must share a single TestClient — each TestClient
    runs on its own anyio portal/event loop, and the room's broadcast
    fans out via ``await sock.send_text(...)`` against the loop the
    socket was *accepted* on. Sending across loops fails silently
    inside ``room.broadcast`` and the receiving client hangs forever
    on ``receive_text``.

    Cookies only matter at the moment of the WS handshake (the
    SessionMiddleware reads them once into ``scope['session']``).
    Clearing the jar and re-signing in between connects is enough to
    give each socket its own session identity.
    """
    client.cookies.clear()
    r = client.post('/', data={'signin': '1'})
    assert r.status_code == 200
    with client.websocket_connect(f'/websocket?name={name}') as ws:
        yield ws


# ---- helpers ----------------------------------------------------------

def init_frame(gen: int = 0) -> str:
    return json.dumps({'type': 'init', 'gen': gen,
                       'metrics': {'width': 800, 'height': 600}})


def line_frame(value: str, gen: int) -> str:
    return json.dumps({'type': 'line', 'gen': gen, 'window': 1, 'value': value})


def drain_until(ws, predicate, limit: int = 20):
    """Read frames until one matches ``predicate``; fail loudly if it never does."""
    for _ in range(limit):
        msg = json.loads(ws.receive_text())
        if predicate(msg):
            return msg
    raise AssertionError(f'never received a frame matching {predicate!r}')
