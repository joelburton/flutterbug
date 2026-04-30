"""End-to-end tests for SharedRoom against a fake VM.

Most tests follow the same shape: connect one or two FakeSocket
clients, push messages through ``room.handle_client_message``, drain
the room's queue task, and inspect what each socket received.
"""

import asyncio
import json
import logging

from flutterbug_server.room import SharedRoom

from .conftest import (
    connect,
    drain,
    init_msg,
    line_msg,
    specialresponse_msg,
)


def arrange_msg(gen: int = 0, width: int = 1000, height: int = 700) -> str:
    return json.dumps({'type': 'arrange', 'gen': gen,
                       'metrics': {'width': width, 'height': height}})


def init_msg_with_metrics(gen: int = 0, width: int = 800,
                          height: int = 600,
                          gridcharwidth: float = 10.0) -> str:
    """Like ``init_msg`` but exposes gridcharwidth so flex-mode tests can
    assert against the rewritten width = status_cols * gridcharwidth."""
    return json.dumps({
        'type': 'init', 'gen': gen,
        'metrics': {
            'width': width,
            'height': height,
            'gridcharwidth': gridcharwidth,
        },
    })


def _make_room(factory, mode: str, status_cols: int = 60) -> SharedRoom:
    return SharedRoom(
        command='fake',
        log=logging.getLogger('flutterbug.test'),
        cwd='/tmp',
        jsondebug=False,
        vm_factory=factory,
        mode=mode,
        status_cols=status_cols,
    )


# --------------------------------------------------------------------
# Init / snapshot replay
# --------------------------------------------------------------------

async def test_first_client_init_launches_vm_and_broadcasts_response(room, factory):
    clientid_a, sock_a = connect(room, 'A')
    await room.handle_client_message(clientid_a, init_msg(0))
    await drain(room)

    assert len(factory.instances) == 1
    vm = factory.instances[0]
    assert any(inp['type'] == 'init' for inp in vm.inputs)

    # Client got the VM's response.
    update = next(m for m in sock_a.messages if m.get('type') == 'update')
    assert update['gen'] == 1
    assert any(w['id'] == 1 for w in update.get('windows', []))


async def test_second_client_resyncs_from_snapshot_no_new_vm_init(room, factory):
    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    inputs_after_first = list(factory.instances[0].inputs)

    b, sock_b = connect(room, 'B')
    await room.handle_client_message(b, init_msg(0))
    await drain(room)

    # No second init reached the VM.
    assert factory.instances[0].inputs == inputs_after_first
    # B got an update (from snapshot replay), not a fresh VM response.
    assert any(m.get('type') == 'update' for m in sock_b.messages)


async def test_fixed_mode_arrange_from_established_client_reaches_vm(factory):
    """In fixed mode, mid-session resize / font scale change must reach the
    VM so it can re-emit window pixel sizes for the new char metrics.
    Otherwise window frames stay frozen and content clips."""
    room = _make_room(factory, mode='fixed')
    a, sock_a = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    sock_a.take_messages()
    inputs_before = list(factory.instances[0].inputs)

    await room.handle_client_message(a, arrange_msg(gen=1))
    await drain(room)

    new_inputs = factory.instances[0].inputs[len(inputs_before):]
    assert any(inp['type'] == 'arrange' for inp in new_inputs), (
        f'arrange did not reach VM; new inputs were {new_inputs}'
    )
    # And the VM's response (a fresh update) is broadcast back.
    assert any(m.get('type') == 'update' for m in sock_a.messages)


# --------------------------------------------------------------------
# Flex mode: VM is locked at the host's first init. After that, every
# arrange (host font stepper, browser resize, late joiner) is dropped.
# --------------------------------------------------------------------

async def test_flex_mode_first_init_rewrites_width_to_status_cols(factory):
    room = _make_room(factory, mode='flex', status_cols=60)
    a, _ = connect(room, 'A')

    await room.handle_client_message(
        a, init_msg_with_metrics(gen=0, width=1600, gridcharwidth=10.0))
    await drain(room)

    init_seen = next(
        inp for inp in factory.instances[0].inputs if inp['type'] == 'init')
    # 60 cols * 10px = 600. Host's actual 1600 is replaced.
    assert init_seen['metrics']['width'] == 600
    # Other metric fields are preserved.
    assert init_seen['metrics']['height'] == 600
    assert init_seen['metrics']['gridcharwidth'] == 10.0


async def test_flex_mode_first_init_without_gridcharwidth_passes_through(factory):
    """If the metrics block lacks gridcharwidth (older client, malformed
    payload), we leave width alone rather than crash. The VM will report
    its own complaint if it cares."""
    room = _make_room(factory, mode='flex', status_cols=60)
    a, _ = connect(room, 'A')

    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    init_seen = next(
        inp for inp in factory.instances[0].inputs if inp['type'] == 'init')
    # width unchanged from init_msg's default of 800.
    assert init_seen['metrics']['width'] == 800


async def test_flex_mode_drops_arrange_after_first_init(factory):
    room = _make_room(factory, mode='flex', status_cols=60)
    a, _ = connect(room, 'A')
    await room.handle_client_message(
        a, init_msg_with_metrics(gen=0, gridcharwidth=10.0))
    await drain(room)
    inputs_before = list(factory.instances[0].inputs)

    await room.handle_client_message(a, arrange_msg(gen=1))
    await drain(room)

    new_inputs = factory.instances[0].inputs[len(inputs_before):]
    assert not any(inp['type'] == 'arrange' for inp in new_inputs), (
        f'arrange leaked to VM in flex mode; new inputs were {new_inputs}'
    )


async def test_flex_mode_drops_arrange_from_late_joiner(factory):
    """A second client whose viewport differs from the host must not be
    able to perturb the VM's locked metrics by sending its own arrange."""
    room = _make_room(factory, mode='flex', status_cols=60)
    a, _ = connect(room, 'A')
    await room.handle_client_message(
        a, init_msg_with_metrics(gen=0, gridcharwidth=10.0))
    await drain(room)

    b, _ = connect(room, 'B')
    inputs_before = list(factory.instances[0].inputs)
    await room.handle_client_message(b, arrange_msg(gen=1))
    await drain(room)

    new_inputs = factory.instances[0].inputs[len(inputs_before):]
    assert not any(inp['type'] == 'arrange' for inp in new_inputs)


async def test_simultaneous_inits_do_not_double_init_vm(room, factory):
    """Bug-driven: two clients connecting before any VM response."""
    a, sock_a = connect(room, 'A')
    b, sock_b = connect(room, 'B')

    # Both clients put init on the queue before either response lands —
    # use create_task to truly interleave the puts.
    t1 = asyncio.create_task(room.handle_client_message(a, init_msg(0)))
    t2 = asyncio.create_task(room.handle_client_message(b, init_msg(0)))
    await asyncio.gather(t1, t2)
    await drain(room)

    vm = factory.instances[0]
    init_count = sum(1 for inp in vm.inputs if inp['type'] == 'init')
    assert init_count == 1, f'VM received {init_count} inits; expected 1'

    # Both clients got an update.
    assert any(m.get('type') == 'update' for m in sock_a.messages)
    assert any(m.get('type') == 'update' for m in sock_b.messages)


# --------------------------------------------------------------------
# Stale-gen protection
# --------------------------------------------------------------------

async def test_stale_gen_command_is_dropped_and_resyncs(room, factory):
    a, sock_a = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    sock_a.take_messages()
    inputs_before = list(factory.instances[0].inputs)

    # Snapshot is at gen=1. Send a line claiming gen=99.
    await room.handle_client_message(a, line_msg('look', gen=99))
    await drain(room)

    msgs = sock_a.messages
    assert any(m.get('multiplayer') == 'info' for m in msgs)
    # VM received nothing new.
    assert factory.instances[0].inputs == inputs_before


# --------------------------------------------------------------------
# fileref_prompt locking
# --------------------------------------------------------------------

def _fileref_responder(saved_filename: str | None = '/tmp/save.glksave'):
    """Responder that emits fileref_prompt on first 'line', then resolves."""
    state = {'gen': 0, 'in_prompt': False}

    def respond(inobj: dict) -> dict:
        state['gen'] += 1
        if inobj['type'] == 'init':
            return {
                'type': 'update', 'gen': state['gen'],
                'windows': [{'id': 1, 'type': 'buffer'}],
                'input': [{'id': 1, 'type': 'line'}],
            }
        if inobj['type'] == 'line' and not state['in_prompt']:
            state['in_prompt'] = True
            return {
                'type': 'update', 'gen': state['gen'],
                'specialinput': {'type': 'fileref_prompt', 'filemode': 'write',
                                 'filetype': 'save'},
            }
        if inobj['type'] == 'specialresponse':
            state['in_prompt'] = False
            return {
                'type': 'update', 'gen': state['gen'],
                'input': [{'id': 1, 'type': 'line'}],
            }
        return {'type': 'update', 'gen': state['gen']}
    return respond


async def test_fileref_prompt_locks_others_and_unblocks_holder(room, factory):
    factory.responder = _fileref_responder()

    a, sock_a = connect(room, 'A')
    b, sock_b = connect(room, 'B')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    sock_a.take_messages()
    sock_b.take_messages()

    # A triggers a save prompt.
    await room.handle_client_message(a, line_msg('save', gen=1))
    await drain(room)

    # A sees specialinput; B sees the same update with disable=True and no
    # specialinput; both see a 'status' broadcast that A is busy.
    a_updates = [m for m in sock_a.messages if m.get('type') == 'update']
    b_updates = [m for m in sock_b.messages if m.get('type') == 'update']
    assert any('specialinput' in m for m in a_updates)
    assert all('specialinput' not in m for m in b_updates)
    assert any(m.get('disable') for m in b_updates)

    statuses = [m for m in sock_a.messages if m.get('multiplayer') == 'status']
    assert any('A' in m['message'] and 'save/restore' in m['message'] for m in statuses)


async def test_non_holder_command_during_lock_is_rejected(room, factory):
    factory.responder = _fileref_responder()
    a, _ = connect(room, 'A')
    b, sock_b = connect(room, 'B')

    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('save', gen=1))
    await drain(room)
    sock_b.take_messages()

    inputs_before = list(factory.instances[0].inputs)
    await room.handle_client_message(b, line_msg('look', gen=2))
    await drain(room)

    # B got an info reply, VM was untouched.
    assert any(m.get('multiplayer') == 'info' for m in sock_b.messages)
    assert factory.instances[0].inputs == inputs_before


async def test_holder_disconnect_cancels_fileref_prompt(room, factory):
    """Bug-driven: holder leaves mid-prompt, others must be unblocked."""
    factory.responder = _fileref_responder()

    a, _ = connect(room, 'A')
    b, sock_b = connect(room, 'B')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('save', gen=1))
    await drain(room)
    assert room.specialinput_clientid == a

    # A walks away. The room must release the lock and tell the VM to cancel.
    room.remove_client(a)
    await drain(room)

    assert room.specialinput_clientid is None
    cancels = [
        inp for inp in factory.instances[0].inputs
        if inp.get('type') == 'specialresponse' and inp.get('value') is None
    ]
    assert len(cancels) == 1, f'expected 1 cancel; got {cancels!r}'

    # Status was cleared and B can now send commands again.
    sock_b.take_messages()
    await room.handle_client_message(b, line_msg('look', gen=3))
    await drain(room)
    assert any(m.get('type') == 'update' for m in sock_b.messages)


async def test_holder_specialresponse_releases_lock(room, factory):
    factory.responder = _fileref_responder()
    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('save', gen=1))
    await drain(room)
    assert room.specialinput_clientid == a

    await room.handle_client_message(a, specialresponse_msg('save.glksave', gen=2))
    await drain(room)
    assert room.specialinput_clientid is None
    assert room.status_message == ''


# --------------------------------------------------------------------
# Disconnect / revival lifecycle
# --------------------------------------------------------------------

async def test_room_revives_after_close_delay_shutdown(room, factory):
    """Bug-driven: after the idle timer closes the VM, a new client must
    cleanly bootstrap a fresh VM rather than receive a stale snapshot."""
    room.CLOSE_DELAY = 0  # close immediately when last client leaves

    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    assert factory.instances[0].terminated is False

    room.remove_client(a)
    # Run the close_task that remove_client scheduled.
    await asyncio.sleep(0.01)
    assert room.proc is None
    assert factory.instances[0].terminated is True
    # Snapshot was reset; the dead VM's state is gone.
    assert not room.snapshot.has_output
    assert room.snapshot.current_gen is None

    # New client connects after revival window. Their init should reach a
    # brand-new VM, not get short-circuited by stale snapshot data.
    b, sock_b = connect(room, 'B')
    await room.handle_client_message(b, init_msg(0))
    await drain(room)

    assert len(factory.instances) == 2
    assert factory.instances[1] is not factory.instances[0]
    assert any(inp['type'] == 'init' for inp in factory.instances[1].inputs)
    assert any(m.get('type') == 'update' for m in sock_b.messages)


async def test_reconnect_within_close_delay_keeps_same_vm(room, factory):
    room.CLOSE_DELAY = 5  # plenty of time to reconnect

    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    room.remove_client(a)
    # close_task is scheduled but hasn't fired yet.
    assert room.proc is not None

    b, sock_b = connect(room, 'B')
    # add_client cancels the pending close_task.
    assert room.close_task is None or room.close_task.cancelled()
    assert room.proc is not None

    await room.handle_client_message(b, init_msg(0))
    await drain(room)

    # Same VM instance; B got the snapshot, no new init went out.
    assert len(factory.instances) == 1
    init_count = sum(1 for inp in factory.instances[0].inputs if inp['type'] == 'init')
    assert init_count == 1
    assert any(m.get('type') == 'update' for m in sock_b.messages)


# --------------------------------------------------------------------
# Failure modes
# --------------------------------------------------------------------

async def test_gameread_timeout_marks_vm_dead(room, factory):
    """Bug-driven: a wedged VM must not block the room forever."""
    room.GAME_READ_TIMEOUT = 0.05

    def silent_responder(inobj):
        return None
    factory.responder = silent_responder

    a, sock_a = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    errors = [m for m in sock_a.messages
              if m.get('multiplayer') == 'error' and 'unexpectedly' in m.get('message', '')]
    assert errors, 'expected an error broadcast after the read timeout'
    assert room.proc is None
    assert not room.snapshot.has_output


async def test_vm_pipe_close_marks_vm_dead(room, factory):
    a, sock_a = connect(room, 'A')
    # First message gets a normal init response.
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    sock_a.take_messages()

    # Then the VM dies before the next response. Swap the *running* VM's
    # responder (factory.responder only affects newly-launched VMs).
    def crash(inobj):
        factory.instances[0].kill()
        return None
    factory.instances[0].responder = crash

    await room.handle_client_message(a, line_msg('look', gen=1))
    await drain(room)

    assert any(m.get('multiplayer') == 'error' for m in sock_a.messages)
    assert room.proc is None


async def test_malformed_json_from_client_returns_error(room, factory):
    a, sock_a = connect(room, 'A')
    await room.handle_client_message(a, '{not valid json')
    # No queue work was scheduled; assert directly.
    errors = [m for m in sock_a.messages
              if m.get('multiplayer') == 'error']
    assert errors


# --------------------------------------------------------------------
# Chat
# --------------------------------------------------------------------

async def test_chat_broadcasts_without_touching_vm(room, factory):
    a, sock_a = connect(room, 'A')
    b, sock_b = connect(room, 'B')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    inputs_before = list(factory.instances[0].inputs)

    import json as _json
    await room.handle_client_message(a, _json.dumps({'type': 'chat', 'text': 'hello'}))

    chats = [m for m in sock_a.messages if m.get('multiplayer') == 'chat']
    assert chats and chats[-1]['text'] == 'hello'
    chats_b = [m for m in sock_b.messages if m.get('multiplayer') == 'chat']
    assert chats_b and chats_b[-1]['text'] == 'hello'
    assert factory.instances[0].inputs == inputs_before


async def test_player_list_broadcast_after_connect(room, factory):
    a, sock_a = connect(room, 'A')
    await room.broadcast_players()
    rosters = [m for m in sock_a.messages if m.get('multiplayer') == 'players']
    assert rosters and any(p['name'] == 'A' for p in rosters[-1]['players'])


async def test_chat_with_empty_text_is_dropped(room):
    a, sock_a = connect(room, 'A')
    await room.handle_client_message(a, json.dumps({'type': 'chat', 'text': ''}))
    chats = [m for m in sock_a.messages if m.get('multiplayer') == 'chat']
    assert chats == []


async def test_chat_with_whitespace_only_is_dropped(room):
    a, sock_a = connect(room, 'A')
    await room.handle_client_message(
        a, json.dumps({'type': 'chat', 'text': '   \n\t  '}))
    chats = [m for m in sock_a.messages if m.get('multiplayer') == 'chat']
    assert chats == []


async def test_chat_truncates_overlong_text(room):
    """A misbehaving client could otherwise fan out arbitrarily large
    strings to every player on every keystroke."""
    from flutterbug_server.room import CHAT_MAX_LENGTH

    a, sock_a = connect(room, 'A')
    await room.handle_client_message(
        a, json.dumps({'type': 'chat', 'text': 'x' * (CHAT_MAX_LENGTH + 500)}))

    chats = [m for m in sock_a.messages if m.get('multiplayer') == 'chat']
    assert len(chats) == 1
    assert len(chats[0]['text']) == CHAT_MAX_LENGTH
    assert chats[0]['text'] == 'x' * CHAT_MAX_LENGTH


# --------------------------------------------------------------------
# Status broadcast dedup
# --------------------------------------------------------------------

async def test_set_status_does_not_rebroadcast_same_message(room):
    a, sock_a = connect(room, 'A')

    await room.set_status('working')
    await room.set_status('working')
    await room.set_status('working')

    statuses = [m for m in sock_a.messages if m.get('multiplayer') == 'status']
    assert len(statuses) == 1
    assert statuses[0]['message'] == 'working'


async def test_set_status_rebroadcasts_when_message_changes(room):
    a, sock_a = connect(room, 'A')

    await room.set_status('first')
    await room.set_status('second')
    # Setting back to a prior value still counts as a change vs the current.
    await room.set_status('first')

    statuses = [m['message'] for m in sock_a.messages
                if m.get('multiplayer') == 'status']
    assert statuses == ['first', 'second', 'first']


# --------------------------------------------------------------------
# Broadcast resilience
# --------------------------------------------------------------------

async def test_broadcast_continues_when_one_socket_raises(room):
    """If one client's send_text raises, the other clients must still
    receive the message. ``send_one`` is supposed to swallow per-socket
    errors, and ``gather(return_exceptions=True)`` is the second safety
    net — pin both."""
    a, sock_a = connect(room, 'A')
    b, sock_b = connect(room, 'B')
    c, sock_c = connect(room, 'C')

    async def boom(text: str) -> None:
        raise RuntimeError('socket dead')

    sock_b.send_text = boom

    # broadcast must not raise even though B blows up.
    await room.broadcast({'multiplayer': 'chat', 'player': 'X',
                          'color': '#000', 'text': 'hi'})

    a_chats = [m for m in sock_a.messages if m.get('multiplayer') == 'chat']
    c_chats = [m for m in sock_c.messages if m.get('multiplayer') == 'chat']
    assert any(m.get('text') == 'hi' for m in a_chats)
    assert any(m.get('text') == 'hi' for m in c_chats)
    # B's queue is empty (its send raised before append).
    assert sock_b.messages == []
