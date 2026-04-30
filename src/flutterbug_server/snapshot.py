"""Replayable snapshot of the shared GlkOte/RemGlk game state.

The shared room receives a stream of ``update`` messages from a single VM.
Each update is incremental — it only mentions windows whose content has
changed, lines whose grid slots were rewritten, etc. Late joiners need a
*complete* picture, so we accumulate every update into ``SnapshotState``
and rebuild a synthetic ``update`` for them on demand.

The class also tracks the most recent ``current_gen`` and the raw
``latest_output``, since both are needed alongside the snapshot when
deciding whether and how to resync a client.
"""

import copy
from typing import Any

JsonDict = dict[str, Any]

# Cap per-buffer-window line history. Long sessions emit thousands of
# paragraphs; without a cap, the snapshot grows unboundedly and every
# late joiner pays the cost of replaying it. Matches the order of
# magnitude of GlkOte's own client-side scrollback.
BUFFER_LINE_CAP = 1000


class SnapshotState:
    """Accumulated GlkOte state, rebuildable into a synthetic update."""

    def __init__(self) -> None:
        self.windows: list[JsonDict] = []
        self.gridcontent: dict[int, list[JsonDict]] = {}
        self.bufcontent: dict[int, list[JsonDict]] = {}
        self.input: list[JsonDict] | None = None
        self.timer: Any = None
        self.current_gen: int | None = None
        self.latest_output: JsonDict | None = None

    def reset(self) -> None:
        """Forget everything. Called when the VM is closed/restarted."""
        self.windows = []
        self.gridcontent = {}
        self.bufcontent = {}
        self.input = None
        self.timer = None
        self.current_gen = None
        self.latest_output = None

    @property
    def has_output(self) -> bool:
        return self.latest_output is not None

    def apply(self, outobj: JsonDict) -> None:
        """Fold one VM ``update`` message into the snapshot."""
        self.latest_output = outobj
        if 'gen' in outobj:
            self.current_gen = outobj['gen']

        winls = outobj.get('windows')
        if winls is not None:
            self.windows = copy.deepcopy(winls)

            winset = {win['id'] for win in self.windows}

            for winid in [w for w in self.gridcontent if w not in winset]:
                del self.gridcontent[winid]
            for winid in [w for w in self.bufcontent if w not in winset]:
                del self.bufcontent[winid]

            for win in self.windows:
                if win['type'] == 'grid':
                    winid = win['id']
                    newheight = win['gridheight']
                    if winid in self.gridcontent and len(self.gridcontent[winid]) > newheight:
                        del self.gridcontent[winid][newheight:]

        contls = outobj.get('content')
        if contls is not None:
            wintypes = {win['id']: win['type'] for win in self.windows}

            for cont in contls:
                winid = cont['id']
                wintype = wintypes.get(winid)
                if not wintype:
                    continue

                if wintype == 'buffer':
                    if cont.get('clear'):
                        self.bufcontent.pop(winid, None)
                    textls = cont.get('text')
                    if textls:
                        buf = self.bufcontent.setdefault(winid, [])
                        buf.extend(copy.deepcopy(textls))
                        if len(buf) > BUFFER_LINE_CAP:
                            del buf[:len(buf) - BUFFER_LINE_CAP]

                elif wintype == 'grid':
                    linels = cont.get('lines')
                    if linels:
                        slot = self.gridcontent.setdefault(winid, [])
                        for line in linels:
                            linenum = line['line']
                            while len(slot) < linenum + 1:
                                slot.append({'line': len(slot)})
                            slot[linenum] = copy.deepcopy(line)

        if 'input' in outobj:
            self.input = copy.deepcopy(outobj.get('input'))

        if 'timer' in outobj:
            self.timer = outobj.get('timer')

    def build_update(self) -> JsonDict | None:
        """Synthesize a complete ``update`` reflecting all accumulated state."""
        if self.latest_output is None:
            return None

        # Pre-gen messages (the very first update) are passed through as-is —
        # the room hasn't been able to track per-window deltas yet.
        if self.current_gen is None:
            return copy.deepcopy(self.latest_output)

        outobj: JsonDict = {
            'type': 'update',
            'gen': self.current_gen,
        }

        if self.windows:
            outobj['windows'] = copy.deepcopy(self.windows)

        content: list[JsonDict] = []
        for (winid, textls) in self.bufcontent.items():
            if textls:
                content.append({'id': winid, 'text': copy.deepcopy(textls)})
        for (winid, linels) in self.gridcontent.items():
            if linels:
                content.append({'id': winid, 'lines': copy.deepcopy(linels)})
        if content:
            outobj['content'] = content

        if self.input is not None:
            outobj['input'] = copy.deepcopy(self.input)

        if self.timer is not None:
            outobj['timer'] = self.timer

        return outobj
