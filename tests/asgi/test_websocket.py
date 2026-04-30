"""WebSocket tests driven through Starlette's TestClient.

These cover authentication, the snapshot/init handshake, and multi-client
fan-out via the real FastAPI app + a FakeVM behind the room.
"""

import json

import pytest
from starlette.testclient import WebSocketDisconnect

from .conftest import connect_as, drain_until, init_frame, line_frame


def test_websocket_rejects_unauthenticated_with_1008(client):
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect('/websocket'):
            pass
    assert exc_info.value.code == 1008


def test_websocket_handshake_broadcasts_player_roster(client):
    with connect_as(client, 'Alice') as ws:
        roster = drain_until(ws, lambda m: m.get('multiplayer') == 'players')
        assert any(p['name'] == 'Alice' for p in roster['players'])


def test_init_drives_vm_and_returns_update(client, vm_factory):
    with connect_as(client, 'Alice') as ws:
        ws.send_text(init_frame(0))
        update = drain_until(ws, lambda m: m.get('type') == 'update')
        assert update['gen'] == 1
        assert any(inp['type'] == 'init' for inp in vm_factory.instances[0].inputs)


def test_late_joiner_resyncs_from_snapshot_without_re_init(client, vm_factory):
    with connect_as(client, 'Alice') as a:
        a.send_text(init_frame(0))
        drain_until(a, lambda m: m.get('type') == 'update')
        inputs_before = list(vm_factory.instances[0].inputs)

        with connect_as(client, 'Bob') as b:
            # Bob's init should be intercepted; the VM must not see a second init.
            b.send_text(init_frame(0))
            drain_until(b, lambda m: m.get('type') == 'update')
            assert vm_factory.instances[0].inputs == inputs_before


def test_two_clients_see_each_others_commands(client):
    with connect_as(client, 'Alice') as a, connect_as(client, 'Bob') as b:
        a.send_text(init_frame(0))
        drain_until(a, lambda m: m.get('type') == 'update')
        drain_until(b, lambda m: m.get('type') == 'update')

        a.send_text(line_frame('look', gen=1))
        cmd = drain_until(b, lambda m: m.get('multiplayer') == 'command')
        assert cmd['player'] == 'Alice'
        assert cmd['command'] == 'look'


def test_malformed_json_from_client_returns_error_frame(client):
    with connect_as(client, 'Alice') as ws:
        ws.send_text('{not json')
        err = drain_until(ws, lambda m: m.get('multiplayer') == 'error')
        assert 'Malformed' in err['message']


def test_roster_excludes_disconnected_player(client):
    # Alice connects + leaves; Charlie's roster on join should not list Alice.
    with connect_as(client, 'Alice'):
        pass

    with connect_as(client, 'Charlie') as ws:
        roster = drain_until(ws, lambda m: m.get('multiplayer') == 'players')
        names = {p['name'] for p in roster['players']}
        assert names == {'Charlie'}


def test_websocket_falls_back_to_player_prefix_when_name_blank(client):
    with connect_as(client, '   ') as ws:
        roster = drain_until(ws, lambda m: m.get('multiplayer') == 'players')
        names = [p['name'] for p in roster['players']]
        assert len(names) == 1
        assert names[0].startswith('Player-')


def test_chat_fans_out_without_touching_vm(client, vm_factory):
    with connect_as(client, 'Alice') as a, connect_as(client, 'Bob') as b:
        a.send_text(init_frame(0))
        drain_until(a, lambda m: m.get('type') == 'update')
        drain_until(b, lambda m: m.get('type') == 'update')
        inputs_before = list(vm_factory.instances[0].inputs)

        a.send_text(json.dumps({'type': 'chat', 'text': 'hello'}))
        chat = drain_until(b, lambda m: m.get('multiplayer') == 'chat')
        assert chat['text'] == 'hello'
        assert chat['player'] == 'Alice'
        assert vm_factory.instances[0].inputs == inputs_before
