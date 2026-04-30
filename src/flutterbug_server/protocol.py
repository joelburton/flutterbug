"""Wire-protocol constants for the GlkOte/RemGlk JSON dialect and the
flutterbug ``multiplayer`` envelope sent between server and browser.

Centralized here so the room dispatcher and the JS frontend agree on
exact names, and so future protocol additions don't fragment across
modules.
"""

from typing import Final

# GlkOte client -> server event types.
EVT_INIT: Final = 'init'
EVT_REFRESH: Final = 'refresh'
EVT_ARRANGE: Final = 'arrange'
EVT_LINE: Final = 'line'
EVT_SPECIALRESPONSE: Final = 'specialresponse'
EVT_CHAT: Final = 'chat'
EVT_TYPING: Final = 'typing'

# Non-input layout-related events. Used by the fileref-prompt lock so
# that a player who isn't holding the save/restore prompt can still
# resize their viewport while another player is mid-prompt.
LAYOUT_EVENTS: Final = (EVT_INIT, EVT_REFRESH, EVT_ARRANGE)

# Events that, when sent by an already-bootstrapped client, would re-init
# the shared VM. A late joiner sending one of these must be answered from
# the snapshot rather than forwarded. ``arrange`` is *not* in this list:
# it is a regular mid-game resize event and must reach the VM so the VM
# can re-emit window pixel sizes for the new char metrics. Without this
# Cmd-+ and the in-app font stepper would scale text but leave window
# frames at their old sizes, clipping content.
SNAPSHOT_REPLAY_EVENTS: Final = (EVT_INIT, EVT_REFRESH)

# specialresponse subtypes.
SPECIAL_FILEREF_PROMPT: Final = 'fileref_prompt'

# Display modes selecting how player viewports interact with the VM's
# notion of window sizes. ``flex`` lets each player wrap the buffer
# at their own width while the VM is locked to a fixed grid column
# count; ``fixed`` is the legacy behavior where every arrange event
# reaches the VM and grid pixel sizes are shared verbatim.
MODE_FLEX: Final = 'flex'
MODE_FIXED: Final = 'fixed'

# Flutterbug "multiplayer" envelope (server -> client).
MP_KEY: Final = 'multiplayer'
MP_CHAT: Final = 'chat'
MP_PLAYERS: Final = 'players'
MP_STATUS: Final = 'status'
MP_COMMAND: Final = 'command'
MP_TYPING: Final = 'typing'
MP_INFO: Final = 'info'
MP_ERROR: Final = 'error'
# Sent by the server in fixed mode to tell non-host clients to size their
# ``#gameport`` div to the host's locked metrics, so GlkOte's measured
# ``current_metrics`` matches the host's and window rects render
# pixel-identical across clients.
MP_LAYOUT: Final = 'layout'
