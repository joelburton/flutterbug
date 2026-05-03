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


async def test_fixed_mode_host_arrange_reaches_vm_unchanged(factory):
    """In fixed mode, the host's resize / font change must reach the VM
    with their actual metrics so the VM re-emits window pixel sizes for
    the new char metrics. Otherwise window frames stay frozen and content
    clips."""
    room = _make_room(factory, mode='fixed')
    a, sock_a = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    sock_a.take_messages()
    inputs_before = list(factory.instances[0].inputs)

    await room.handle_client_message(
        a, arrange_msg(gen=1, width=1000, height=700))
    await drain(room)

    new_inputs = factory.instances[0].inputs[len(inputs_before):]
    arranges = [inp for inp in new_inputs if inp['type'] == 'arrange']
    assert len(arranges) == 1, f'expected one arrange, got {arranges}'
    # Host's metrics passed through unchanged (not substituted with the
    # init's 800x600).
    assert arranges[0]['metrics']['width'] == 1000
    assert arranges[0]['metrics']['height'] == 700
    # And the VM's response (a fresh update) is broadcast back.
    assert any(m.get('type') == 'update' for m in sock_a.messages)


async def test_fixed_mode_first_init_claims_host_sessionid(factory):
    room = _make_room(factory, mode='fixed')
    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    assert room.host_sessionid == 'sess-A'
    # locked_metrics seeded from the init so non-host arranges have
    # something to substitute against.
    assert room.locked_metrics == {'width': 800, 'height': 600}


async def test_fixed_mode_non_host_arrange_uses_locked_metrics(factory):
    """Late joiner with a smaller viewport must not be able to perturb
    the VM's layout: their arrange is forwarded with the host's metrics."""
    room = _make_room(factory, mode='fixed')
    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    b, _ = connect(room, 'B')
    inputs_before = list(factory.instances[0].inputs)
    await room.handle_client_message(
        b, arrange_msg(gen=1, width=400, height=300))
    await drain(room)

    new_inputs = factory.instances[0].inputs[len(inputs_before):]
    arranges = [inp for inp in new_inputs if inp['type'] == 'arrange']
    assert len(arranges) == 1
    # Host's init metrics are used, not B's 400x300.
    assert arranges[0]['metrics']['width'] == 800
    assert arranges[0]['metrics']['height'] == 600


async def test_fixed_mode_host_arrange_updates_locked_metrics(factory):
    """A later non-host arrange substitutes against the host's *latest*
    metrics, not the original init's — so a host font/viewport change
    propagates."""
    room = _make_room(factory, mode='fixed')
    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    # Host changes their viewport / font.
    await room.handle_client_message(
        a, arrange_msg(gen=1, width=1200, height=800))
    await drain(room)

    # Non-host arrives, sends their own arrange.
    b, _ = connect(room, 'B')
    inputs_before = list(factory.instances[0].inputs)
    await room.handle_client_message(
        b, arrange_msg(gen=2, width=400, height=300))
    await drain(room)

    new_inputs = factory.instances[0].inputs[len(inputs_before):]
    sub_arranges = [inp for inp in new_inputs if inp['type'] == 'arrange']
    assert len(sub_arranges) == 1
    # Substituted with the host's UPDATED metrics, not the init's 800x600.
    assert sub_arranges[0]['metrics']['width'] == 1200
    assert sub_arranges[0]['metrics']['height'] == 800


async def test_fixed_mode_late_joiner_receives_layout_before_snapshot(factory):
    """In fixed mode the non-host's gameport must be pixel-resized to the
    host's metrics *before* GlkOte applies the snapshot, otherwise the
    right-anchored window rects render against the wrong current_metrics."""
    room = _make_room(factory, mode='fixed')
    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    b, sock_b = connect(room, 'B')
    await room.handle_client_message(b, init_msg(0))
    await drain(room)

    layout_idx = next(
        (i for i, m in enumerate(sock_b.messages)
         if m.get('multiplayer') == 'layout'), None)
    update_idx = next(
        (i for i, m in enumerate(sock_b.messages)
         if m.get('type') == 'update'), None)
    assert layout_idx is not None, 'non-host should receive an MP_LAYOUT'
    assert update_idx is not None, 'non-host should receive a snapshot update'
    assert layout_idx < update_idx, 'layout must precede the update'

    layout = sock_b.messages[layout_idx]
    assert layout['width'] == 800
    assert layout['height'] == 600


async def test_fixed_mode_host_arrange_broadcasts_layout_to_non_hosts(factory):
    """When the host resizes / changes font the non-hosts must learn the
    new gameport size before the VM's follow-up update lands, so their
    gameport is sized correctly when GlkOte renders the new window rects."""
    room = _make_room(factory, mode='fixed')
    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    b, sock_b = connect(room, 'B')
    await room.handle_client_message(b, init_msg(0))
    await drain(room)
    sock_b.take_messages()

    await room.handle_client_message(
        a, arrange_msg(gen=1, width=1200, height=800))
    await drain(room)

    layouts = [m for m in sock_b.messages if m.get('multiplayer') == 'layout']
    assert layouts, 'non-host should receive an MP_LAYOUT after host arrange'
    assert layouts[-1]['width'] == 1200
    assert layouts[-1]['height'] == 800


async def test_fixed_mode_host_does_not_receive_layout(factory):
    """The host already has the gameport size they want; sending them an
    MP_LAYOUT would just thrash their inline styles."""
    room = _make_room(factory, mode='fixed')
    a, sock_a = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    sock_a.take_messages()

    await room.handle_client_message(
        a, arrange_msg(gen=1, width=1200, height=800))
    await drain(room)

    layouts = [m for m in sock_a.messages if m.get('multiplayer') == 'layout']
    assert layouts == []


async def test_flex_mode_never_sends_layout(factory):
    """Flex mode lets each client size their own gameport; pushing layout
    would defeat that. Verify no MP_LAYOUT envelope is ever sent in flex
    mode, even on late-joiner snapshot replay or host arrange."""
    room = _make_room(factory, mode='flex', status_cols=60)
    a, sock_a = connect(room, 'A')
    await room.handle_client_message(
        a, init_msg_with_metrics(gen=0, gridcharwidth=10.0))
    await drain(room)

    b, sock_b = connect(room, 'B')
    await room.handle_client_message(b, init_msg(0))
    await drain(room)

    await room.handle_client_message(
        a, arrange_msg(gen=1, width=2000, height=1500))
    await drain(room)

    for sock in (sock_a, sock_b):
        layouts = [m for m in sock.messages if m.get('multiplayer') == 'layout']
        assert layouts == []


async def test_fixed_mode_host_identity_persists_across_refresh(factory):
    """Host refreshes their browser: same cookie/sessionid, new clientid.
    Their arranges must still be treated as host arranges (forwarded
    unchanged), not substituted as a non-host's would be."""
    room = _make_room(factory, mode='fixed')
    a1, _ = connect(room, 'A')
    await room.handle_client_message(a1, init_msg(0))
    await drain(room)
    room.remove_client(a1)

    # Reconnect with same name → same sessionid='sess-A' (the test's
    # connect helper derives sessionid from the player name).
    a2, _ = connect(room, 'A')
    assert a1 != a2
    inputs_before = list(factory.instances[0].inputs)
    await room.handle_client_message(
        a2, arrange_msg(gen=1, width=1200, height=800))
    await drain(room)

    new_inputs = factory.instances[0].inputs[len(inputs_before):]
    arranges = [inp for inp in new_inputs if inp['type'] == 'arrange']
    assert len(arranges) == 1
    # Host's metrics passed through, proving the new clientid is still
    # recognized as the host via sessionid.
    assert arranges[0]['metrics']['width'] == 1200
    assert arranges[0]['metrics']['height'] == 800


async def test_host_sessionid_persists_after_vm_close(factory):
    """If the host disconnects long enough that the VM tears down and a
    different player is the first to reconnect, the friend's init bootstraps
    a new VM but does NOT promote them to host. The original host's
    sessionid is sticky for the room's lifetime."""
    room = _make_room(factory, mode='fixed')
    room.CLOSE_DELAY = 0  # tear down immediately when last client leaves

    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    assert room.host_sessionid == 'sess-A'

    # Host walks away; nobody is connected. VM tears down.
    room.remove_client(a)
    await asyncio.sleep(0.01)
    assert room.proc is None
    # host_sessionid survives the close.
    assert room.host_sessionid == 'sess-A'

    # Friend (different sessionid) is the first to reconnect.
    b, _ = connect(room, 'B')
    await room.handle_client_message(b, init_msg(0))
    await drain(room)

    # A new VM was launched (friend's init bootstrapped it) — but the host
    # role was not handed over to the friend.
    assert len(factory.instances) == 2
    assert room.host_sessionid == 'sess-A'


async def test_friend_who_relaunched_vm_is_treated_as_non_host(factory):
    """Follow-up to the previous test: the friend who happened to bootstrap
    the relaunched VM sends an arrange. Because they are not the host,
    their metrics must be substituted with locked_metrics rather than
    forwarded unchanged."""
    room = _make_room(factory, mode='fixed')
    room.CLOSE_DELAY = 0

    a, _ = connect(room, 'A')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    room.remove_client(a)
    await asyncio.sleep(0.01)
    assert room.proc is None

    b, _ = connect(room, 'B')
    await room.handle_client_message(b, init_msg(0))
    await drain(room)
    inputs_before = list(factory.instances[1].inputs)

    await room.handle_client_message(
        b, arrange_msg(gen=2, width=400, height=300))
    await drain(room)

    new_inputs = factory.instances[1].inputs[len(inputs_before):]
    arranges = [inp for inp in new_inputs if inp['type'] == 'arrange']
    assert len(arranges) == 1
    # Substituted with locked_metrics (seeded by B's init at 800x600 since
    # there's no host present to seed, but the point is B's 400x300 was
    # NOT forwarded as a host arrange would be).
    assert arranges[0]['metrics']['width'] == 800
    assert arranges[0]['metrics']['height'] == 600


async def test_host_reclaims_role_when_returning_after_friend_relaunch(factory):
    """After a friend bootstraps a relaunched VM, the original host
    eventually returns. Their arranges must still be recognized as host
    arranges and forwarded unchanged."""
    room = _make_room(factory, mode='fixed')
    room.CLOSE_DELAY = 0

    a1, _ = connect(room, 'A')
    await room.handle_client_message(a1, init_msg(0))
    await drain(room)
    room.remove_client(a1)
    await asyncio.sleep(0.01)

    b, _ = connect(room, 'B')
    await room.handle_client_message(b, init_msg(0))
    await drain(room)

    # Host comes back (same sessionid since 'connect' derives it from name).
    a2, _ = connect(room, 'A')
    inputs_before = list(factory.instances[1].inputs)
    await room.handle_client_message(
        a2, arrange_msg(gen=2, width=1200, height=800))
    await drain(room)

    new_inputs = factory.instances[1].inputs[len(inputs_before):]
    arranges = [inp for inp in new_inputs if inp['type'] == 'arrange']
    assert len(arranges) == 1
    # Forwarded unchanged — host role was preserved across the VM teardown.
    assert arranges[0]['metrics']['width'] == 1200
    assert arranges[0]['metrics']['height'] == 800


# --------------------------------------------------------------------
# Flex mode: VM is locked at the host's first init. Subsequent arranges
# from any client still reach the VM but with their metrics replaced by
# the locked-init metrics, so the VM emits a benign no-op update — that
# generation bump is what unsticks GlkOte's send_response gate after a
# browser-zoom arrange.
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


async def test_flex_mode_arrange_after_first_init_uses_locked_metrics(factory):
    """Arrange still reaches the VM (so the generation can advance and
    GlkOte's next send_response unblocks), but its metrics block is
    replaced with the locked init metrics — the VM sees no change and
    emits a no-op update."""
    room = _make_room(factory, mode='flex', status_cols=60)
    a, _ = connect(room, 'A')
    await room.handle_client_message(
        a, init_msg_with_metrics(gen=0, gridcharwidth=10.0))
    await drain(room)
    inputs_before = list(factory.instances[0].inputs)

    # Player resizes / zooms — would normally send their own width/height.
    await room.handle_client_message(
        a, arrange_msg(gen=1, width=2000, height=1500))
    await drain(room)

    new_inputs = factory.instances[0].inputs[len(inputs_before):]
    arranges = [inp for inp in new_inputs if inp['type'] == 'arrange']
    assert len(arranges) == 1, f'expected one arrange, got {arranges}'
    # Locked metrics: width = 60 * 10.0 = 600 from the init rewrite.
    assert arranges[0]['metrics']['width'] == 600
    assert arranges[0]['metrics']['height'] == 600
    assert arranges[0]['metrics']['gridcharwidth'] == 10.0


async def test_flex_mode_arrange_from_late_joiner_uses_locked_metrics(factory):
    """A second client whose viewport differs from the host must not be
    able to perturb the VM's locked metrics by sending its own arrange."""
    room = _make_room(factory, mode='flex', status_cols=60)
    a, _ = connect(room, 'A')
    await room.handle_client_message(
        a, init_msg_with_metrics(gen=0, gridcharwidth=10.0))
    await drain(room)

    b, _ = connect(room, 'B')
    inputs_before = list(factory.instances[0].inputs)
    await room.handle_client_message(
        b, arrange_msg(gen=1, width=400, height=300))
    await drain(room)

    new_inputs = factory.instances[0].inputs[len(inputs_before):]
    arranges = [inp for inp in new_inputs if inp['type'] == 'arrange']
    assert len(arranges) == 1
    assert arranges[0]['metrics']['width'] == 600
    assert arranges[0]['metrics']['height'] == 600


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

    # A sees specialinput; B sees the same update with no specialinput
    # (and crucially NO `disable: true`, which AsyncGlk treats as
    # "game exited" and would destroy B's windows). Both see a 'status'
    # broadcast that A is busy.
    a_updates = [m for m in sock_a.messages if m.get('type') == 'update']
    b_updates = [m for m in sock_b.messages if m.get('type') == 'update']
    assert any('specialinput' in m for m in a_updates)
    assert all('specialinput' not in m for m in b_updates)
    assert all(not m.get('disable') for m in b_updates)

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
                          'color_class': 'player-color-1', 'text': 'hi'})

    a_chats = [m for m in sock_a.messages if m.get('multiplayer') == 'chat']
    c_chats = [m for m in sock_c.messages if m.get('multiplayer') == 'chat']
    assert any(m.get('text') == 'hi' for m in a_chats)
    assert any(m.get('text') == 'hi' for m in c_chats)
    # B's queue is empty (its send raised before append).
    assert sock_b.messages == []


# --------------------------------------------------------------------
# Roster cap
# --------------------------------------------------------------------

async def test_roster_cap_evicts_oldest_disconnected_entry(room, monkeypatch):
    """A signed-in client reconnecting under fresh names must not grow
    the roster without bound."""
    from flutterbug_server import room as room_module
    monkeypatch.setattr(room_module, 'PLAYER_ROSTER_MAX', 5)

    # Fill the cap and disconnect each in order, oldest first.
    ids = []
    for i in range(5):
        cid, _ = connect(room, f'P{i}')
        ids.append(cid)
    for cid in ids:
        room.remove_client(cid)

    assert [e['name'] for e in room.player_roster] == [
        'P0', 'P1', 'P2', 'P3', 'P4']

    # New name pushes the oldest disconnected entry out.
    connect(room, 'P5')
    assert [e['name'] for e in room.player_roster] == [
        'P1', 'P2', 'P3', 'P4', 'P5']


async def test_roster_cap_overflows_rather_than_refuse_when_all_connected(
        room, monkeypatch):
    """If every slot is currently connected, we'd rather let the roster
    overflow than refuse a real player to enforce the cap."""
    from flutterbug_server import room as room_module
    monkeypatch.setattr(room_module, 'PLAYER_ROSTER_MAX', 3)

    for i in range(3):
        connect(room, f'P{i}')
    assert all(e['connected'] for e in room.player_roster)

    connect(room, 'P3')
    # Cap exceeded; nobody got evicted because nobody was disconnectable.
    assert len(room.player_roster) == 4
    assert [e['name'] for e in room.player_roster] == [
        'P0', 'P1', 'P2', 'P3']


# --------------------------------------------------------------------
# --transcript / --recording session-log files
# --------------------------------------------------------------------

def _transcript_responder():
    """Responder that emits buffer text per turn so transcripts have content.

    Init emits an intro paragraph; each subsequent line input gets a
    brief response. Mimics the shape of a real RemGlk update, including
    nested ``content[].text[].content[]`` structure.
    """
    state = {'gen': 0, 'turn': 0}

    def respond(inobj):
        state['gen'] += 1
        if inobj['type'] == 'init':
            return {
                'type': 'update', 'gen': state['gen'],
                'windows': [{'id': 1, 'type': 'buffer'}],
                'content': [{'id': 1, 'text': [
                    {'content': [{'style': 'normal',
                                  'text': 'You are in a small room.'}]},
                ]}],
                'input': [{'id': 1, 'type': 'line'}],
            }
        if inobj['type'] == 'line':
            state['turn'] += 1
            return {
                'type': 'update', 'gen': state['gen'],
                'content': [{'id': 1, 'text': [
                    {'content': [{'style': 'normal',
                                  'text': f'Response {state["turn"]}.'}]},
                ]}],
                'input': [{'id': 1, 'type': 'line'}],
            }
        return {'type': 'update', 'gen': state['gen']}
    return respond


def _make_logged_room(factory, tmp_path, *, transcript=True, recording=True):
    return SharedRoom(
        command='fake', log=logging.getLogger('flutterbug.test'),
        cwd='/tmp', jsondebug=False, vm_factory=factory,
        transcript_path=str(tmp_path / 'transcript.txt') if transcript else None,
        recording_path=str(tmp_path / 'recording.txt') if recording else None,
    )


async def test_transcript_captures_intro_then_command_then_output(
        factory, tmp_path):
    factory.responder = _transcript_responder()
    room = _make_logged_room(factory, tmp_path)

    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('look', gen=1))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    assert 'You are in a small room.' in text
    # No "> " prefix from us -- the VM emits its own prompt; we just
    # write the bare command (or "Player: command" in multiplayer).
    assert 'look' in text
    assert '> look' not in text
    assert 'Response 1.' in text
    # Single-player: no "Alice:" prefix on the command line.
    assert 'Alice:' not in text
    # Order: intro before command, command before its response.
    assert text.index('You are in') < text.index('look') < text.index('Response 1.')


async def test_transcript_includes_player_name_in_multiplayer(
        factory, tmp_path):
    factory.responder = _transcript_responder()
    room = _make_logged_room(factory, tmp_path)

    a, _ = connect(room, 'Alice')
    connect(room, 'Bob')  # second player → multiplayer attribution kicks in
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('look', gen=1))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    assert 'Alice: look' in text
    # No "> " prefix -- the prompt belongs to the VM.
    assert '> Alice:' not in text


async def test_recording_writes_one_command_per_line_no_init_or_intro(
        factory, tmp_path):
    factory.responder = _transcript_responder()
    room = _make_logged_room(factory, tmp_path)

    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('look', gen=1))
    await drain(room)
    await room.handle_client_message(a, line_msg('north', gen=2))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'recording.txt').read_text()
    # No init, no intro, no prefix -- just commands, REPLAY-ready.
    assert text == 'look\nnorth\n'


async def test_transcript_is_flushed_continuously_not_only_at_shutdown(
        factory, tmp_path):
    """The whole point of doing this server-side: no buffering surprises.
    File must be readable mid-game without QUIT/shutdown."""
    factory.responder = _transcript_responder()
    room = _make_logged_room(factory, tmp_path, recording=False)

    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    # No shutdown() yet — but the file should already have the intro.
    text = (tmp_path / 'transcript.txt').read_text()
    assert 'You are in a small room.' in text

    await room.handle_client_message(a, line_msg('look', gen=1))
    await drain(room)
    text = (tmp_path / 'transcript.txt').read_text()
    assert 'Response 1.' in text

    room.shutdown()


async def test_recording_omits_specialresponse_filename(factory, tmp_path):
    """Save/restore filenames are specialresponses, not line inputs.
    They should not pollute the recording (REPLAY would choke)."""
    factory.responder = _fileref_responder()
    room = _make_logged_room(factory, tmp_path, transcript=False)

    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('save', gen=1))
    await drain(room)
    await room.handle_client_message(
        a, specialresponse_msg('mygame.glksave', gen=2))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'recording.txt').read_text()
    assert text == 'save\n'
    assert 'glksave' not in text


async def test_log_files_survive_vm_restart_within_one_invocation(
        factory, tmp_path):
    """A VM crash + relaunch should keep appending to the same files,
    with a visible separator marking where one game ended."""
    factory.responder = _transcript_responder()
    room = _make_logged_room(factory, tmp_path, recording=False)
    room.CLOSE_DELAY = 0

    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('look', gen=1))
    await drain(room)

    # Simulate VM dying.
    room.close()
    text_after_close = (tmp_path / 'transcript.txt').read_text()
    assert 'Game session ended' in text_after_close

    # New VM session starts; transcript continues in the same file.
    factory.responder = _transcript_responder()  # fresh state, gen restarts
    await room.handle_client_message(a, init_msg(0))
    await drain(room)

    text = (tmp_path / 'transcript.txt').read_text()
    # The intro from the first session AND the second are both present.
    assert text.count('You are in a small room.') == 2
    assert text.index('Game session ended') < text.rindex('You are in')

    room.shutdown()


async def test_transcript_strips_vm_echo_of_player_command(factory, tmp_path):
    """Real VMs echo the typed command into the buffer with style 'input'.
    Since we already write "> command" ourselves, the echo would produce
    a duplicate line ("> s\\ns"). The echo paragraph must be dropped."""
    state = {'gen': 0}

    def respond(inobj):
        state['gen'] += 1
        if inobj['type'] == 'init':
            return {
                'type': 'update', 'gen': state['gen'],
                'windows': [{'id': 1, 'type': 'buffer'}],
                'content': [{'id': 1, 'text': [
                    {'content': [{'style': 'normal', 'text': 'Intro.'}]},
                ]}],
                'input': [{'id': 1, 'type': 'line'}],
            }
        # Real-game shape: first paragraph is the echoed input, then
        # the actual response.
        return {
            'type': 'update', 'gen': state['gen'],
            'content': [{'id': 1, 'text': [
                {'content': [{'style': 'input', 'text': inobj['value']}]},
                {'content': [{'style': 'normal', 'text': 'You did the thing.'}]},
            ]}],
            'input': [{'id': 1, 'type': 'line'}],
        }
    factory.responder = respond

    room = _make_logged_room(factory, tmp_path, recording=False)
    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('look', gen=1))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    assert 'look' in text
    assert 'You did the thing.' in text
    # The VM's input-styled echo must be stripped so "look" appears
    # exactly once (our written command), not twice.
    assert text.count('look') == 1


async def test_transcript_command_joins_vm_prompt_line(factory, tmp_path):
    """The VM's natural prompt (whatever string it uses) ends without a
    trailing newline; the command we write should join that line, not
    sit on its own. Produces canonical-transcript ">look" instead of
    a doubled ">\\n>look" or detached ">\\nlook"."""
    state = {'gen': 0}

    def respond(inobj):
        state['gen'] += 1
        if inobj['type'] == 'init':
            return {
                'type': 'update', 'gen': state['gen'],
                'windows': [{'id': 1, 'type': 'buffer'}],
                'content': [{'id': 1, 'text': [
                    {'content': [{'style': 'normal', 'text': 'Intro.'}]},
                    # Trailing prompt paragraph with no newline -- this
                    # is what real VMs do at end-of-turn.
                    {'content': [{'style': 'normal', 'text': '>'}]},
                ]}],
                'input': [{'id': 1, 'type': 'line'}],
            }
        return {
            'type': 'update', 'gen': state['gen'],
            'content': [{'id': 1, 'text': [
                {'content': [{'style': 'input', 'text': inobj['value']}]},
                {'content': [{'style': 'normal', 'text': 'Response.'}]},
                {'content': [{'style': 'normal', 'text': '>'}]},
            ]}],
            'input': [{'id': 1, 'type': 'line'}],
        }
    factory.responder = respond

    room = _make_logged_room(factory, tmp_path, recording=False)
    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('look', gen=1))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    # Canonical form: prompt and command joined on one line.
    assert '>look\n' in text
    # And NOT the broken forms.
    assert '>\nlook' not in text       # detached
    assert '>\n>look' not in text      # doubled
    # The response sits on the line right after the command -- no
    # blank line, since we don't pad and the fixture's response
    # paragraph isn't separated from the prompt by a blank-text
    # paragraph.
    assert '>look\nResponse.\n>' in text


async def test_transcript_consecutive_paragraphs_run_together(factory, tmp_path):
    """Two non-empty paragraphs with no empty paragraph between them
    render on consecutive lines (single '\\n' separator), never with
    a blank line. Blank lines come only from the VM emitting empty
    paragraphs, which is the protocol's signal for vertical spacing."""
    state = {'gen': 0}

    def respond(inobj):
        state['gen'] += 1
        if inobj['type'] == 'init':
            return {
                'type': 'update', 'gen': state['gen'],
                'windows': [{'id': 1, 'type': 'buffer'}],
                'content': [{'id': 1, 'text': [
                    {'content': [{'style': 'normal', 'text': 'First.'}]},
                    {'content': [{'style': 'normal', 'text': 'Second.'}]},
                    {'content': [{'style': 'normal', 'text': '>'}]},
                ]}],
                'input': [{'id': 1, 'type': 'line'}],
            }
        return {'type': 'update', 'gen': state['gen']}
    factory.responder = respond

    room = _make_logged_room(factory, tmp_path, recording=False)
    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    # One '\n' between paragraphs, no blank lines.
    assert 'First.\nSecond.\n>' in text
    # No leading blank line at file start.
    assert text.startswith('First.')


async def test_transcript_empty_paragraph_creates_blank_line(factory, tmp_path):
    """An empty paragraph object ({}) is the protocol's signal for a
    blank line. The transcript must surface that as an actual blank
    line, not silently swallow it."""
    state = {'gen': 0}

    def respond(inobj):
        state['gen'] += 1
        return {
            'type': 'update', 'gen': state['gen'],
            'windows': [{'id': 1, 'type': 'buffer'}],
            'content': [{'id': 1, 'text': [
                {'content': [{'style': 'normal', 'text': 'First.'}]},
                {},  # blank line
                {'content': [{'style': 'normal', 'text': 'Second.'}]},
            ]}],
            'input': [{'id': 1, 'type': 'line'}],
        }
    factory.responder = respond

    room = _make_logged_room(factory, tmp_path, recording=False)
    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    # Two '\n's = one blank line between First. and Second.
    assert 'First.\n\nSecond.' in text


async def test_transcript_consecutive_empty_paragraphs_stack(factory, tmp_path):
    """Three consecutive empty paragraphs (as Inform games emit before
    block-quoted text) must produce three blank lines, not just one."""
    state = {'gen': 0}

    def respond(inobj):
        state['gen'] += 1
        return {
            'type': 'update', 'gen': state['gen'],
            'windows': [{'id': 1, 'type': 'buffer'}],
            'content': [{'id': 1, 'text': [
                {'content': [{'style': 'normal', 'text': 'Foo'}]},
                {}, {}, {},
                {'content': [{'style': 'normal', 'text': 'Bar'}]},
            ]}],
            'input': [{'id': 1, 'type': 'line'}],
        }
    factory.responder = respond

    room = _make_logged_room(factory, tmp_path, recording=False)
    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    # Four '\n's = three blank lines between Foo and Bar.
    assert 'Foo\n\n\n\nBar' in text


async def test_transcript_clear_resets_to_new_line_for_append_paragraph(
        factory, tmp_path):
    """When the VM clears the buffer, the next paragraph -- even one
    with append=True -- must start on a new line in the transcript.
    Otherwise it would run into the previous turn's command, e.g.
    '...y/n)? nAFTER' instead of '...y/n)? n\\nAFTER'."""
    state = {'gen': 0}

    def respond(inobj):
        state['gen'] += 1
        if inobj['type'] == 'init':
            return {
                'type': 'update', 'gen': state['gen'],
                'windows': [{'id': 1, 'type': 'buffer'}],
                'content': [{'id': 1, 'text': [
                    {'content': [{'style': 'normal', 'text': 'Pick (y/n)? '}]},
                ]}],
                'input': [{'id': 1, 'type': 'line'}],
            }
        return {
            'type': 'update', 'gen': state['gen'],
            'content': [{'id': 1, 'clear': True, 'text': [
                {'append': True,
                 'content': [{'style': 'normal', 'text': 'AFTER'}]},
            ]}],
            'input': [{'id': 1, 'type': 'line'}],
        }
    factory.responder = respond

    room = _make_logged_room(factory, tmp_path, recording=False)
    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('n', gen=1))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    # Without the clear-handling, this would read "...(y/n)? nAFTER".
    assert 'Pick (y/n)? n\nAFTER' in text


async def test_transcript_one_blank_line_between_command_and_response(
        factory, tmp_path):
    """When the VM emits an empty paragraph between the command echo
    and its response (the typical Inform pattern), the transcript
    shows exactly one blank line between command and response -- not
    zero, not two."""
    state = {'gen': 0}

    def respond(inobj):
        state['gen'] += 1
        if inobj['type'] == 'init':
            return {
                'type': 'update', 'gen': state['gen'],
                'windows': [{'id': 1, 'type': 'buffer'}],
                'content': [{'id': 1, 'text': [
                    {'content': [{'style': 'normal', 'text': 'Intro.'}]},
                    {'content': [{'style': 'normal', 'text': '> '}]},
                ]}],
                'input': [{'id': 1, 'type': 'line'}],
            }
        return {
            'type': 'update', 'gen': state['gen'],
            'content': [{'id': 1, 'text': [
                {'append': True,
                 'content': [{'style': 'input', 'text': inobj['value']}]},
                {},  # the blank-line signal
                {'content': [{'style': 'normal', 'text': 'Response.'}]},
            ]}],
            'input': [{'id': 1, 'type': 'line'}],
        }
    factory.responder = respond

    room = _make_logged_room(factory, tmp_path, recording=False)
    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('look', gen=1))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    # Canonical: prompt joined with command, then exactly one blank
    # line, then response.
    assert '> look\n\nResponse.' in text


async def test_transcript_respects_append_paragraphs(factory, tmp_path):
    """append=True paragraphs should run together with no separator,
    even though the VM modeled them as multiple paragraphs in the
    update."""
    state = {'gen': 0}

    def respond(inobj):
        state['gen'] += 1
        return {
            'type': 'update', 'gen': state['gen'],
            'windows': [{'id': 1, 'type': 'buffer'}],
            'content': [{'id': 1, 'text': [
                {'content': [{'style': 'normal', 'text': 'Part1'}]},
                {'append': True,
                 'content': [{'style': 'normal', 'text': 'Part2'}]},
            ]}],
            'input': [{'id': 1, 'type': 'line'}],
        }
    factory.responder = respond

    room = _make_logged_room(factory, tmp_path, recording=False)
    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    assert 'Part1Part2' in text


async def test_transcript_works_with_unusual_prompt_string(factory, tmp_path):
    """Same join behavior must work for VMs that use a non-">" prompt."""
    state = {'gen': 0}

    def respond(inobj):
        state['gen'] += 1
        if inobj['type'] == 'init':
            return {
                'type': 'update', 'gen': state['gen'],
                'windows': [{'id': 1, 'type': 'buffer'}],
                'content': [{'id': 1, 'text': [
                    {'content': [{'style': 'normal',
                                  'text': 'What now? '}]},
                ]}],
                'input': [{'id': 1, 'type': 'line'}],
            }
        return {
            'type': 'update', 'gen': state['gen'],
            'content': [{'id': 1, 'text': [
                {'content': [{'style': 'input', 'text': inobj['value']}]},
                {'content': [{'style': 'normal', 'text': 'OK.'}]},
            ]}],
            'input': [{'id': 1, 'type': 'line'}],
        }
    factory.responder = respond

    room = _make_logged_room(factory, tmp_path, recording=False)
    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)
    await room.handle_client_message(a, line_msg('go', gen=1))
    await drain(room)
    room.shutdown()

    text = (tmp_path / 'transcript.txt').read_text()
    # Prompt joins regardless of what it looks like.
    assert 'What now? go\n' in text


async def test_unwritable_transcript_path_logs_warning_does_not_crash(
        factory, tmp_path, caplog):
    """A bad path must not take the room down -- log and continue."""
    factory.responder = _transcript_responder()
    bad = tmp_path / 'nonexistent-dir' / 'transcript.txt'
    with caplog.at_level(logging.ERROR):
        room = SharedRoom(
            command='fake', log=logging.getLogger('flutterbug.test'),
            cwd='/tmp', jsondebug=False, vm_factory=factory,
            transcript_path=str(bad), recording_path=None,
        )
    assert room._transcript_file is None
    assert any('transcript' in r.message.lower() for r in caplog.records)

    a, _ = connect(room, 'Alice')
    await room.handle_client_message(a, init_msg(0))
    await drain(room)  # would crash if write path mishandled None handle
    room.shutdown()
