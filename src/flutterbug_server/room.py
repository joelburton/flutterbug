"""The shared multiplayer game room.

A single ``SharedRoom`` instance fronts one persistent RemGlk-protocol
interpreter subprocess. Every connected websocket client sends its input
through the room's queue; every output is broadcast to all clients.
"""

import asyncio
import copy
import json
import os.path
import shlex
from logging import Logger
from typing import Any, Awaitable, Callable, Optional, Protocol

from .protocol import (
    EVT_ARRANGE,
    EVT_CHAT,
    EVT_INIT,
    EVT_LINE,
    EVT_SPECIALRESPONSE,
    EVT_TYPING,
    LAYOUT_EVENTS,
    MODE_FIXED,
    MODE_FLEX,
    MP_CHAT,
    MP_COMMAND,
    MP_ERROR,
    MP_INFO,
    MP_KEY,
    MP_PLAYERS,
    MP_STATUS,
    MP_TYPING,
    SNAPSHOT_REPLAY_EVENTS,
    SPECIAL_FILEREF_PROMPT,
)
from .snapshot import SnapshotState

JsonDict = dict[str, Any]


# Palette used to label each player's chat/command lines. Hand-picked to be
# legible on a light background.
PLAYER_COLORS = [
    '#c0392b', '#2980b9', '#27ae60', '#8e44ad',
    '#d35400', '#16a085', '#c0392b', '#7f8c8d',
]

# Hard cap on chat message length. A misbehaving client could otherwise
# fan out arbitrarily large strings to every player on every keystroke.
CHAT_MAX_LENGTH = 1000


class VMProcess(Protocol):
    """Minimal subset of asyncio.subprocess.Process the room actually uses."""

    stdin: Any
    stdout: Any

    def terminate(self) -> None: ...


VMFactory = Callable[[str], Awaitable[VMProcess]]


async def _default_vm_factory(command: str, cwd: str) -> asyncio.subprocess.Process:
    args = shlex.split(command)
    if not args:
        raise ValueError('Empty --command value.')
    return await asyncio.create_subprocess_exec(
        *args,
        cwd=cwd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
    )


class PersistSession:
    """Holds the link to a long-running RemGlk-protocol subprocess."""

    # Read-side cap. If the VM stops writing for this long the room treats
    # it as dead rather than blocking forever.
    GAME_READ_TIMEOUT = 60.0

    def __init__(
        self,
        command: str,
        log: Logger,
        cwd: str,
        vm_factory: Optional[Callable[[str, str], Awaitable[VMProcess]]] = None,
    ) -> None:
        self.log = log
        self.command = command
        self.cwd = cwd
        self.vm_factory = vm_factory or _default_vm_factory
        self.proc: Optional[VMProcess] = None
        # ``None`` means "no live VM" — distinct from an empty buffer.
        # Raw bytes accumulated from the VM's stdout, parsed incrementally
        # by ``gameread`` via ``json.JSONDecoder.raw_decode``.
        self._readbuf: bytes | None = None

    def _require_proc(self) -> VMProcess:
        if self.proc is None:
            raise RuntimeError('Game process is not running.')
        return self.proc

    def _require_stdin(self):
        proc = self._require_proc()
        if proc.stdin is None:
            raise RuntimeError('Game process stdin is unavailable.')
        return proc.stdin

    def _require_stdout(self):
        proc = self._require_proc()
        if proc.stdout is None:
            raise RuntimeError('Game process stdout is unavailable.')
        return proc.stdout

    async def launch(self) -> None:
        """Start the interpreter subprocess (idempotent across relaunches)."""
        self.log.info('Launching game for %s', self)
        self.log.info('Game command: %s', self.command)
        self.proc = await self.vm_factory(self.command, self.cwd)
        # A fresh subprocess always means a fresh read buffer; otherwise a
        # prior close() would leave _readbuf=None and gameread() would
        # immediately report the new VM as dead.
        self._readbuf = b''

    def close(self) -> None:
        """Shut down the interpreter and reset everything VM-tied.

        After ``close()``, the room is structurally equivalent to a freshly
        constructed one (clients aside). The next inbound ``init`` will
        flow through the queue and bootstrap a brand-new VM.
        """
        if self.proc is not None:
            try:
                stdin = self.proc.stdin
                if stdin is not None:
                    stdin.close()
                # If the VM already exited (e.g. its pipe EOF'd and
                # gameread returned None), terminate() raises a bare
                # ProcessLookupError whose str() is empty — masking the
                # real story behind a mysterious blank warning.
                returncode = getattr(self.proc, 'returncode', None)
                if returncode is None:
                    self.proc.terminate()
                else:
                    self.log.info(
                        'Game process already exited (returncode=%s); skipping terminate.',
                        returncode)
            except Exception as ex:
                self.log.warning('Error terminating VM: %r', ex)
            self.proc = None
        self._readbuf = None

    async def input(self, msg: bytes) -> None:
        stdin = self._require_stdin()
        stdin.write(msg)
        await stdin.drain()

    async def gameread(self) -> bytes | None:
        """Await the next complete JSON message from the VM.

        Returns ``None`` if the VM closes its pipe or stalls past
        ``GAME_READ_TIMEOUT``. RemGlk emits one JSON object per turn,
        but the bytes can arrive split across multiple ``readline``
        chunks. We accumulate into a single buffer and call
        ``raw_decode``; on success we return the consumed prefix and
        keep any trailing bytes for the next call. Avoids the quadratic
        re-decode-from-zero of the prior line-list approach.
        """
        if self._readbuf is None:
            return None

        decoder = json.JSONDecoder()
        while True:
            if self._readbuf:
                try:
                    text = self._readbuf.decode('utf-8')
                except UnicodeDecodeError:
                    # Tail of the buffer is a partial multi-byte sequence;
                    # wait for more bytes before attempting to parse.
                    text = None
                if text is not None:
                    stripped = text.lstrip()
                    try:
                        _, end = decoder.raw_decode(stripped)
                    except json.JSONDecodeError:
                        # Either no complete JSON object yet, or genuine
                        # garbage. ``readline`` below will drive progress;
                        # if the VM never produces a parseable object the
                        # timeout path will eventually trip.
                        pass
                    else:
                        # raw_decode returns a character offset into
                        # ``stripped``. Leading whitespace dropped by
                        # ``lstrip`` is ASCII-by-definition, so we can
                        # recover the byte boundary by re-encoding the
                        # consumed prefix of ``text``.
                        leading = len(text) - len(stripped)
                        consumed = text[:leading + end].encode('utf-8')
                        self._readbuf = self._readbuf[len(consumed):]
                        return consumed

            stdout = self._require_stdout()
            try:
                chunk = await asyncio.wait_for(
                    stdout.readline(), timeout=self.GAME_READ_TIMEOUT)
            except asyncio.TimeoutError:
                self.log.warning(
                    'Timed out after %ss waiting for game output; treating VM as dead.',
                    self.GAME_READ_TIMEOUT)
                return None
            if not chunk:
                return None
            self._readbuf += chunk


class SharedRoom(PersistSession):
    """The single shared session — one VM seen by every connected client."""

    # Grace period after the last disconnect, so a refresh can rejoin
    # without losing state.
    CLOSE_DELAY = 60

    def __init__(
        self,
        command: str,
        log: Logger,
        cwd: str,
        jsondebug: bool = False,
        resource_dir: Optional[str] = None,
        resource_url_prefix: str = '/static/resource',
        vm_factory: Optional[Callable[[str, str], Awaitable[VMProcess]]] = None,
        mode: str = MODE_FLEX,
        status_cols: int = 60,
    ) -> None:
        super().__init__(command, log, cwd, vm_factory=vm_factory)
        if mode not in (MODE_FLEX, MODE_FIXED):
            raise ValueError(f'Unknown mode: {mode!r}')
        self.jsondebug = jsondebug
        self.resource_dir = resource_dir
        self.resource_url_prefix = resource_url_prefix.rstrip('/')
        self.mode = mode
        self.status_cols = status_cols
        self.clients: dict[int, dict] = {}
        self.next_clientid = 1
        self.next_color_index = 0
        self.player_roster: list[dict] = []
        self.snapshot = SnapshotState()
        self.input_queue: asyncio.Queue = asyncio.Queue()
        self.queue_task: asyncio.Task | None = None
        self.close_task: asyncio.Task | None = None
        self.specialinput_clientid: int | None = None
        self.status_message = ''
        # The metrics block currently driving the VM's layout. In flex
        # mode this is the host's first-init metrics with width rewritten
        # to status_cols cells; in fixed mode it tracks the host's latest
        # init/arrange. Non-host arranges (and, in flex, all arranges)
        # have their metrics substituted with this before forwarding, so
        # the VM sees "no change" and emits a no-op update — that update
        # advances ``generation`` on the client, which GlkOte requires to
        # unblock its next ``send_response`` (otherwise line input that
        # follows a browser zoom is silently dropped).
        self.locked_metrics: dict | None = None
        # Sessionid of the first client whose init reached the VM. In
        # fixed mode their arranges drive the layout for everyone else;
        # in flex mode this is informational. Tracked by sessionid (not
        # clientid) so a host browser refresh — same cookie, new
        # websocket — keeps the host role.
        self.host_sessionid: str | None = None

    def __repr__(self) -> str:
        return '<SharedRoom>'

    def close(self) -> None:
        super().close()
        # Reset everything tied to the now-dead VM so the room is reusable.
        self.snapshot.reset()
        self.specialinput_clientid = None
        self.status_message = ''
        self.player_roster.clear()
        self.next_color_index = 0
        self.locked_metrics = None
        self.host_sessionid = None

    # -----------------------------------------------------------------
    # Logging / image-URL synthesis
    # -----------------------------------------------------------------

    def _log_json(self, direction, payload, clientid=None):
        if not self.jsondebug:
            return

        if isinstance(payload, bytes):
            try:
                text = payload.decode('utf-8')
            except Exception:
                text = repr(payload)
        elif isinstance(payload, str):
            text = payload
        else:
            try:
                text = json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
            except Exception:
                text = repr(payload)

        if len(text) > 4000:
            text = text[:4000] + '... [truncated]'

        if clientid is None:
            self.log.info('[jsondebug] %s %s', direction, text)
        else:
            self.log.info('[jsondebug] %s client=%s %s', direction, clientid, text)

    def _build_resource_url_for_image(self, image_num) -> str | None:
        if not self.resource_dir:
            return None
        try:
            image_num = int(image_num)
        except Exception:
            return None

        for ext in ('png', 'jpeg'):
            filename = f'pict-{image_num}.{ext}'
            candidate = os.path.join(self.resource_dir, filename)
            if os.path.exists(candidate):
                return f'{self.resource_url_prefix}/{filename}'
        return None

    def _add_missing_image_urls(self, payload) -> int:
        inserted = 0

        def walk(node):
            nonlocal inserted
            if isinstance(node, dict):
                if node.get('special') == 'image' and not node.get('url'):
                    image_num = node.get('image')
                    url = self._build_resource_url_for_image(image_num)
                    if url:
                        node['url'] = url
                        inserted += 1
                for val in node.values():
                    walk(val)
            elif isinstance(node, list):
                for val in node:
                    walk(val)

        walk(payload)
        return inserted

    # -----------------------------------------------------------------
    # Client roster
    # -----------------------------------------------------------------

    def add_client(self, sock, playername, sessionid) -> int:
        if self.close_task:
            self.close_task.cancel()
            self.close_task = None
        clientid = self.next_clientid
        self.next_clientid += 1
        roster_entry = next((e for e in self.player_roster if e['name'] == playername), None)
        if roster_entry:
            color = roster_entry['color']
            roster_entry['connected'] = True
        else:
            color = PLAYER_COLORS[self.next_color_index % len(PLAYER_COLORS)]
            self.next_color_index += 1
            self.player_roster.append({'name': playername, 'color': color, 'connected': True})
        self.clients[clientid] = {
            'sock': sock,
            'playername': playername,
            'sessionid': sessionid,
            'color': color,
        }
        return clientid

    def remove_client(self, clientid: int) -> None:
        conn = self.clients.pop(clientid, None)
        if conn:
            for entry in self.player_roster:
                if entry['name'] == conn['playername']:
                    entry['connected'] = False
                    break

        # If the leaving client was holding a fileref-prompt lock, release it
        # so the remaining players aren't stuck. If anyone else is still here,
        # tell the VM to cancel the prompt; otherwise the imminent
        # _delayed_close will tear the VM down anyway.
        if self.specialinput_clientid == clientid:
            self.specialinput_clientid = None
            if self.clients:
                asyncio.create_task(self._cancel_fileref_prompt())
            else:
                self.status_message = ''

        if not self.clients:
            self.close_task = asyncio.create_task(self._delayed_close())

    async def _delayed_close(self) -> None:
        await asyncio.sleep(self.CLOSE_DELAY)
        if self.clients:
            return
        self.log.info('No clients for %ds; closing game process.', self.CLOSE_DELAY)
        self.close()

    def list_players(self) -> list[dict]:
        return [
            {'name': entry['name'], 'color': entry['color']}
            for entry in self.player_roster
            if entry['connected']
        ]

    # -----------------------------------------------------------------
    # Outbound
    # -----------------------------------------------------------------

    async def send_to_client(self, clientid, obj) -> None:
        conn = self.clients.get(clientid)
        if not conn:
            return
        try:
            self._log_json('ws_out', obj, clientid)
            await conn['sock'].send_text(json.dumps(obj))
        except Exception as ex:
            self.log.warning('Unable to write to client %s: %s', clientid, ex)

    async def broadcast(self, obj) -> None:
        if not self.clients:
            return
        text = json.dumps(obj)
        targets = list(self.clients.items())

        async def send_one(clientid, conn):
            try:
                self._log_json('ws_out', obj, clientid)
                await conn['sock'].send_text(text)
            except Exception as ex:
                self.log.warning('Unable to write to client %s: %s', clientid, ex)

        # ``return_exceptions=True`` is belt-and-braces: ``send_one`` already
        # swallows its own errors, but if that ever changes we don't want one
        # bad socket to cancel the rest of the broadcast.
        await asyncio.gather(
            *(send_one(cid, conn) for (cid, conn) in targets),
            return_exceptions=True,
        )

    async def broadcast_players(self) -> None:
        await self.broadcast({
            MP_KEY: MP_PLAYERS,
            'players': self.list_players(),
        })

    async def set_status(self, message: str) -> None:
        if message == self.status_message:
            return
        self.status_message = message
        await self.broadcast({
            MP_KEY: MP_STATUS,
            'message': message,
        })

    async def send_snapshot_to_client(self, clientid: int) -> None:
        if not self.snapshot.has_output:
            return
        outobj = self.snapshot.build_update()
        if outobj is None:
            return

        if self.specialinput_clientid is not None:
            if clientid == self.specialinput_clientid:
                special = (self.snapshot.latest_output or {}).get('specialinput')
                if special:
                    outobj['specialinput'] = copy.deepcopy(special)
            else:
                outobj['disable'] = True

        await self.send_to_client(clientid, outobj)

    # -----------------------------------------------------------------
    # Inbound
    # -----------------------------------------------------------------

    async def handle_client_message(self, clientid: int, msg: str) -> None:
        try:
            obj = json.loads(msg)
        except Exception:
            self._log_json('ws_in_invalid', msg, clientid)
            await self.send_to_client(clientid, {
                MP_KEY: MP_ERROR,
                'message': 'Malformed JSON payload.',
            })
            return

        self._log_json('ws_in', obj, clientid)
        evtype = obj.get('type')

        if evtype == EVT_CHAT:
            await self._handle_chat(clientid, obj)
            return

        if evtype == EVT_TYPING:
            await self._handle_typing(clientid, obj)
            return

        if not await self._allow_through_fileref_lock(clientid, evtype):
            return

        # Late joiners must sync from snapshot. Forwarding their init/refresh
        # would reset the shared VM.
        if evtype in SNAPSHOT_REPLAY_EVENTS and self.snapshot.has_output:
            await self.send_snapshot_to_client(clientid)
            return

        # The first init that reaches the VM claims this client's session
        # as the host — their arranges drive layout in fixed mode and their
        # gameport width seeds locked_metrics in both modes.
        if evtype == EVT_INIT and not self.snapshot.has_output:
            sender_sessionid = self.clients.get(clientid, {}).get('sessionid')
            if sender_sessionid is not None:
                self.host_sessionid = sender_sessionid
            if self.mode == MODE_FLEX:
                msg = self._rewrite_init_metrics_for_flex(obj, msg)
            else:
                self._record_locked_metrics(obj)

        # Arrange handling depends on mode and host status:
        #  - flex: every arrange's metrics are substituted with locked_metrics
        #    so the VM stays pinned to status_cols, regardless of sender.
        #  - fixed + host: forward unchanged and refresh locked_metrics, so
        #    a host font/viewport change propagates to non-host substitutions.
        #  - fixed + non-host: substitute with locked_metrics, so the host's
        #    layout is preserved for the VM (the no-op update still advances
        #    the non-host's generation, unsticking their next send_response).
        if evtype == EVT_ARRANGE and self.locked_metrics is not None:
            sender_sessionid = self.clients.get(clientid, {}).get('sessionid')
            is_host = (sender_sessionid is not None
                       and sender_sessionid == self.host_sessionid)
            if self.mode == MODE_FIXED and is_host:
                self._record_locked_metrics(obj)
            else:
                msg = self._substitute_arrange_metrics(obj, msg)

        if not await self._allow_through_gen_check(clientid, obj):
            return

        await self.input_queue.put((clientid, msg.encode('utf-8'), obj))
        if self.queue_task is None or self.queue_task.done():
            self.queue_task = asyncio.create_task(self.process_queue())

    def _rewrite_init_metrics_for_flex(self, obj: JsonDict, msg: str) -> str:
        """Pin metrics.width to ``status_cols`` cells for the host's first init.

        Mutates ``obj`` in place, snapshots the rewritten metrics into
        ``self.locked_metrics`` for later arrange substitution, and returns
        a re-serialized payload. If the metrics block is missing or malformed
        we leave it alone — the VM will report its own error and the room is
        no worse off than today.
        """
        metrics = obj.get('metrics')
        if not isinstance(metrics, dict):
            return msg
        cellwidth = metrics.get('gridcharwidth')
        if not isinstance(cellwidth, (int, float)) or cellwidth <= 0:
            return msg
        metrics['width'] = self.status_cols * cellwidth
        self.locked_metrics = dict(metrics)
        return json.dumps(obj)

    def _record_locked_metrics(self, obj: JsonDict) -> None:
        """Snapshot ``obj['metrics']`` into ``self.locked_metrics`` verbatim.

        Used in fixed mode for the host's first init and for subsequent
        host arranges. Silently ignores a missing/malformed metrics block.
        """
        metrics = obj.get('metrics')
        if isinstance(metrics, dict):
            self.locked_metrics = dict(metrics)

    def _substitute_arrange_metrics(self, obj: JsonDict, msg: str) -> str:
        """Replace the arrange's metrics block with ``self.locked_metrics``.

        Forwarded to the VM, this looks like "no change" — the VM emits a
        no-op update whose only purpose is the ``generation`` bump that
        unblocks GlkOte's next ``send_response``. Caller has already
        verified ``self.locked_metrics is not None``.
        """
        obj['metrics'] = dict(self.locked_metrics)
        return json.dumps(obj)

    async def _handle_chat(self, clientid: int, obj: JsonDict) -> None:
        text = str(obj.get('text', '')).strip()
        if not text:
            return
        if len(text) > CHAT_MAX_LENGTH:
            text = text[:CHAT_MAX_LENGTH]
        conn = self.clients.get(clientid)
        await self.broadcast({
            MP_KEY: MP_CHAT,
            'player': conn['playername'] if conn else 'Player',
            'color': conn['color'] if conn else '#888',
            'text': text,
        })

    async def _handle_typing(self, clientid: int, obj: JsonDict) -> None:
        mode = obj.get('mode')
        if mode not in ('chat', 'command', None):
            return
        conn = self.clients.get(clientid)
        payload = {
            MP_KEY: MP_TYPING,
            'player': conn['playername'] if conn else 'Player',
            'mode': mode,
        }
        for cid in list(self.clients):
            if cid != clientid:
                await self.send_to_client(cid, payload)

    async def _allow_through_fileref_lock(self, clientid: int, evtype: Any) -> bool:
        """Gate input while a fileref prompt is held by some client.

        Returns True when ``clientid``'s message may proceed, False when
        it has been answered or silently dropped.
        """
        if self.specialinput_clientid is None:
            return True

        if clientid != self.specialinput_clientid:
            # Non-holders: silent pass-through for layout events (they'll
            # be answered from snapshot below); info reply otherwise.
            if evtype not in LAYOUT_EVENTS:
                await self.send_to_client(clientid, {
                    MP_KEY: MP_INFO,
                    'message': 'Waiting for another player to finish save/restore.',
                })
            return False

        # Lock holder: only specialresponse + layout events may proceed.
        if evtype != EVT_SPECIALRESPONSE and evtype not in LAYOUT_EVENTS:
            await self.send_to_client(clientid, {
                MP_KEY: MP_INFO,
                'message': 'Please finish the save/restore prompt first.',
            })
            return False
        return True

    def _is_stale_gen(self, msggen: Any) -> bool:
        """True iff a client message's ``gen`` is older than the snapshot's."""
        return (self.snapshot.current_gen is not None
                and msggen is not None
                and msggen != self.snapshot.current_gen)

    async def _allow_through_gen_check(self, clientid: int, obj: JsonDict) -> bool:
        """Reject commands tagged with a stale generation; resync the sender."""
        if self._is_stale_gen(obj.get('gen')):
            await self.send_to_client(clientid, {
                MP_KEY: MP_INFO,
                'message': 'Ignored stale command; resyncing to current turn.',
            })
            await self.send_snapshot_to_client(clientid)
            return False
        return True

    async def _cancel_fileref_prompt(self) -> None:
        """Tell the VM to abandon a pending fileref prompt and resume."""
        if self.proc is None or self.snapshot.current_gen is None:
            return

        cancel = {
            'type': EVT_SPECIALRESPONSE,
            'gen': self.snapshot.current_gen,
            'response': SPECIAL_FILEREF_PROMPT,
            'value': None,
        }
        await self.input_queue.put(
            (None, (json.dumps(cancel) + '\n').encode('utf-8'), cancel))
        if self.queue_task is None or self.queue_task.done():
            self.queue_task = asyncio.create_task(self.process_queue())

    async def process_queue(self) -> None:
        while not self.input_queue.empty():
            (clientid, msgbytes, inobj) = await self.input_queue.get()
            try:
                # ``clientid is None`` is reserved for system-injected
                # messages (e.g. fileref-prompt cancellation on disconnect).
                if clientid is not None and clientid not in self.clients:
                    continue

                # Recheck staleness at dispatch time: gen may have advanced
                # between enqueue and dequeue. System messages (clientid=None)
                # carry their own current_gen and are exempt.
                if clientid is not None and self._is_stale_gen(inobj.get('gen')):
                    await self.send_to_client(clientid, {
                        MP_KEY: MP_INFO,
                        'message': 'Skipped stale queued command.',
                    })
                    await self.send_snapshot_to_client(clientid)
                    continue

                # If two clients connect simultaneously, both inits land in
                # the queue before either response arrives. The first one
                # bootstraps the VM; the second must resync from snapshot
                # rather than ship a duplicate init at the now-running VM.
                if (inobj.get('type') in SNAPSHOT_REPLAY_EVENTS
                        and self.snapshot.has_output
                        and clientid is not None):
                    await self.send_snapshot_to_client(clientid)
                    continue

                # System-injected fileref cancel is only meaningful while the
                # VM is still waiting on the prompt. If an earlier queue entry
                # already resolved it, drop the cancel.
                if (clientid is None
                        and inobj.get('type') == EVT_SPECIALRESPONSE
                        and inobj.get('response') == SPECIAL_FILEREF_PROMPT):
                    last = self.snapshot.latest_output or {}
                    special = last.get('specialinput') or {}
                    if special.get('type') != SPECIAL_FILEREF_PROMPT:
                        continue
                    # Use whatever gen is current at dispatch time, not at queue time.
                    if self.snapshot.current_gen is not None:
                        live = dict(inobj)
                        live['gen'] = self.snapshot.current_gen
                        msgbytes = (json.dumps(live) + '\n').encode('utf-8')

                if not self.proc:
                    await self.launch()

                self._log_json('game_in', msgbytes, clientid)
                await self.input(msgbytes)
                res = await self.gameread()
                if not res:
                    await self.broadcast({
                        MP_KEY: MP_ERROR,
                        'message': 'Game session closed unexpectedly.',
                    })
                    self.close()
                    return

                outobj = json.loads(res.decode('utf-8'))
                self._add_missing_image_urls(outobj)
                self._log_json('game_out', outobj, clientid)
                self.snapshot.apply(outobj)

                special = outobj.get('specialinput')
                if special and special.get('type') == SPECIAL_FILEREF_PROMPT:
                    # Anchor the lock to whoever provoked the prompt; system
                    # cancels (clientid=None) leave the lock unclaimed.
                    self.specialinput_clientid = clientid
                    if clientid is not None:
                        owner = self.clients.get(clientid)
                        ownername = owner['playername'] if owner else 'Another player'
                        await self.set_status(ownername + ' is choosing a save/restore file...')
                else:
                    self.specialinput_clientid = None
                    await self.set_status('')

                if inobj.get('type') == EVT_LINE and clientid is not None:
                    conn = self.clients.get(clientid)
                    playername = conn['playername'] if conn else 'Player'
                    await self.broadcast({
                        MP_KEY: MP_COMMAND,
                        'player': playername,
                        'command': inobj.get('value', ''),
                    })

                if special and special.get('type') == SPECIAL_FILEREF_PROMPT:
                    # Send the prompt only to the initiating player; everyone
                    # else gets the same state, minus the popup, plus a
                    # disable flag so they can't type.
                    for target_clientid in list(self.clients.keys()):
                        if target_clientid == clientid:
                            await self.send_to_client(target_clientid, outobj)
                        else:
                            otherobj = dict(outobj)
                            otherobj.pop('specialinput', None)
                            otherobj['disable'] = True
                            await self.send_to_client(target_clientid, otherobj)
                else:
                    await self.broadcast(outobj)

            except Exception as ex:
                self.log.exception('Queue processing error: %s', ex)
                await self.broadcast({
                    MP_KEY: MP_ERROR,
                    'message': 'Server error while processing a command.',
                })
                self.close()
                return
            finally:
                self.input_queue.task_done()
