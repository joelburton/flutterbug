/*
  AsyncGlk-based client for the /play2 route — the TypeScript replacement
  for static/playws-asyncglk.js.

  Bundled by esbuild into static/play2.bundle.js. The Plotkin-GlkOte path
  (/play, static/playws.js) is untouched.

  Originally derived from Plotkin's example-web-remglk-glkote demo and
  flutterbug's playws.js; ported to AsyncGlk in Phase 2 of the
  ASYNCGLK-POC-PLAN, then converted to TypeScript here.
*/

import WebGlkOte from 'asyncglk/dist/glkote/web/web.js'
import {Blorb} from 'asyncglk/dist/blorb/blorb.js'
import * as protocol from 'asyncglk/dist/common/protocol.js'

// jQuery is loaded as a separate <script> tag in play2.html (vendored at
// /static/jquery-3.7.1.min.js) and exposed as a global. We don't bundle it.
declare const $: JQueryStatic

// namedialog.js is loaded as a separate <script> tag in play2.html and
// exposes a Dialog global (Plotkin's simplified file-pick dialog).
// FlutterbugDialog below wraps it for AsyncGlk's async interface.
//
// namedialog's callback signature: it passes the bare filename STRING
// on accept, or null on cancel. (Not an object — that initially threw
// us; resolving as if it were `{filename, usage, gameid}` returned
// undefined and broke save/script/transcript.)
declare const Dialog: {
    classname: string
    init(iface?: {GlkOte?: unknown, dom_prefix?: string}): void
    inited(): boolean
    open(
        tosave: boolean,
        usage: string | null,
        gameid: string | null,
        callback: (filename: string | null) => void,
    ): void
}

// Filled in by play2.html's inline <script> before the bundle loads.
declare const multiplayer_playername: string

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let glkote: WebGlkOte | null = null
let websocket: WebSocket | null = null
let slash_chat_enabled = true

const SLASH_CHAT_KEY = 'flutterbug.slashChat'
const TYPING_STOP_DELAY = 3000

const typing_timers: {chat: number | null, command: number | null} = {
    chat: null,
    command: null,
}

const FONT_SCALE_KEY = 'flutterbug.gameFontScale'
const FONT_SCALE_MIN = 0.7
const FONT_SCALE_MAX = 2.0
const FONT_SCALE_STEP = 0.125

// Fallbacks if the active theme doesn't set a per-theme base. Themes
// override via --glkote-buffer-base-size / --glkote-grid-base-size /
// --glkote-grid-base-line-height. Defaults match asyncglk-css/core.css.
const ASYNCGLK_BUFFER_BASE_PX = 15
const ASYNCGLK_GRID_BASE_PX = 14
const ASYNCGLK_GRID_LINE_HEIGHT_BASE_PX = 18

function read_px_var(name: string, fallback: number): number {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    const val = parseFloat(raw)
    return isNaN(val) ? fallback : val
}

// ---------------------------------------------------------------------------
// Websocket round-trip
// ---------------------------------------------------------------------------

function accept(arg: protocol.Event): void {
    websocket?.send(JSON.stringify(arg))
}

function open_websocket(): void {
    try {
        const wsproto = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
        const url = wsproto + window.location.host + '/websocket'
            + '?name=' + encodeURIComponent(multiplayer_playername)
        glkote!.log('Creating websocket: ' + url)
        websocket = new WebSocket(url)
    }
    catch (ex) {
        glkote!.error('Unable to open websocket: ' + ex)
        return
    }
    websocket.onopen = callback_websocket_open
    websocket.onclose = callback_websocket_close
    websocket.onmessage = callback_websocket_message
}

/* AsyncGlk Dialog adapter that wraps Plotkin's namedialog.js
   (loaded from /static/namedialog.js as a separate <script>).
   namedialog.js is callback-based and Plotkin's-Dialog-shaped:
   `Dialog.open(tosave, usage, gameid, cb)` shows a styled modal in
   #windowport and calls cb(fileref) or cb(null) on cancel.
   AsyncGlk wants `async: true` + `prompt(extension, isWrite) →
   Promise<string|null>`. AsyncGlk gives us the file *extension*
   ("glksave", "txt", etc.) but namedialog needs the Glk *usage*
   ("save", "transcript", "command", "data") — and crucially, when
   usage is "save" namedialog calls /savefiles and renders a
   click-to-pick list of existing saves. Map back so the load dialog
   shows that list rather than just an input field. */
/* AsyncGlk's filetype_to_extension returns ".glksave" (with leading
   dot), not "glksave". Strip before lookup. */
const EXTENSION_TO_USAGE: Record<string, string> = {
    glksave: 'save',
    txt: 'transcript',  /* approximation; namedialog only treats
                            'save' specially anyway, so the others all
                            collapse to a plain input field. */
}

const FlutterbugDialog = {
    async: true as const,
    prompt(extension: string, is_write: boolean): Promise<string | null> {
        const ext = extension.replace(/^\./, '')
        const usage = EXTENSION_TO_USAGE[ext] ?? null
        return new Promise<string | null>(resolve => {
            Dialog.open(is_write, usage, null, filename => {
                /* namedialog passes the bare filename string (or null on
                   cancel). AsyncGlk's caller wraps `{filename}` around
                   whatever we resolve with. */
                resolve(filename)
            })
        })
    },
}

function callback_websocket_open(): void {
    // AsyncGlk's GlkOteOptions are partially typed; cast to any so
    // SimpleDialog passes the Dialog-shape check. The full Dialog interface
    // is in asyncglk/dist/dialog/common/interface.d.ts; SimpleDialog only
    // implements the subset AsyncGlk actually calls for a fileref prompt
    // (.async + .prompt), so we deliberately don't try to satisfy the
    // whole shape.
    glkote!.init({
        accept: accept,
        Dialog: FlutterbugDialog as any,
    } as any)
}

function callback_websocket_close(ev: CloseEvent): void {
    websocket = null
    glkote!.error('Websocket has closed: (' + ev.code + ',' + ev.reason + ')')
}

interface MultiplayerEnvelope {
    multiplayer?: string
    players?: PlayerInfo[]
    player?: string
    color_class?: string
    text?: string
    message?: string
    command?: string
    mode?: string | null
    width?: number
    height?: number
}

interface PlayerInfo {
    id?: number | string
    name?: string
    color_class?: string
}

function callback_websocket_message(ev: MessageEvent): void {
    const obj: MultiplayerEnvelope & protocol.Update = JSON.parse(ev.data)

    switch (obj.multiplayer) {
        case 'players':
            update_player_list(obj.players || [])
            return
        case 'chat':
            append_chat(obj.player, obj.color_class, obj.text)
            return
        case 'status':
            update_status(obj.message || '')
            return
        case 'command':
            append_command(obj.player, obj.command)
            return
        case 'typing':
            update_typing(obj.player, obj.mode || null)
            return
        case 'layout':
            apply_gameport_layout(obj.width, obj.height)
            return
        case 'error':
        case 'info':
            append_system_message(obj.message || 'Server message.')
            if (obj.multiplayer === 'error')
                glkote!.error(obj.message || 'Server error.')
            return
    }

    const chat_input = document.getElementById('chat-input')
    const chat_was_focused = document.activeElement === chat_input
    glkote!.update(obj as protocol.Update)
    if (chat_was_focused && chat_input) (chat_input as HTMLInputElement).focus()
    suppress_harmless_glkote_errors()
}

/* GlkOte surfaces some interpreter quirks as fatal red-box errors that are
   not actually fatal (e.g. content arriving for a window that is mid-save).
   Suppress the ones we know are harmless so players never see them. */
function suppress_harmless_glkote_errors(): void {
    const pane = document.getElementById('errorpane')
    const content = document.getElementById('errorcontent')
    if (!pane || !content || pane.style.display === 'none') return
    const msg = content.textContent || ''
    if (msg.indexOf('awaiting line input') !== -1) pane.style.display = 'none'
}

// ---------------------------------------------------------------------------
// Multiplayer overlay (chat / players / typing / commands)
// ---------------------------------------------------------------------------

function update_player_list(players: PlayerInfo[]): void {
    const list = $('#players-list')
    if (!list.length) return
    list.empty()
    for (const player of players) {
        const name = player.name || ('Player ' + player.id)
        const item = $('<span></span>')
        item.text(name)
        if (player.color_class) item.addClass(player.color_class)
        if (name === multiplayer_playername) item.addClass('me')
        list.append(item)
    }
}

function update_typing(player: string | undefined, mode: string | null): void {
    $('#players-list span').each(function () {
        if ($(this).text() === player) {
            $(this).removeClass('typing-chat typing-command')
            if (mode) $(this).addClass('typing-' + mode)
        }
    })
}

function send_typing(mode: 'chat' | 'command'): void {
    if (!websocket) return
    const existing = typing_timers[mode]
    if (existing !== null) clearTimeout(existing)
    websocket.send(JSON.stringify({type: 'typing', mode: mode}))
    typing_timers[mode] = window.setTimeout(() => {
        typing_timers[mode] = null
        websocket?.send(JSON.stringify({type: 'typing', mode: null}))
    }, TYPING_STOP_DELAY)
}

function append_command(player: string | undefined, command: string | undefined): void {
    /* Build the line ourselves rather than going through append_log_line
       so the command text lives in its own span. The download-commands
       button reads .cmd-text spans to emit just the commands, dropping
       the "PlayerName: " prefix. */
    const feed = $('#command-feed')
    if (!feed.length) return
    const line = $('<div class="feed-line"></div>')
    line.append(document.createTextNode((player || 'Player') + ': '))
    const cmd = $('<span class="cmd-text"></span>')
    cmd.text(command || '')
    line.append(cmd)
    feed.append(line)
    while (feed.children().length > 2000) feed.children().first().remove()
    feed.scrollTop(feed[0].scrollHeight)
}

function append_chat(player: string | undefined, color_class: string | undefined,
                     text: string | undefined): void {
    const feed = $('#chat-messages')
    if (!feed.length) return
    const line = $('<div class="feed-line"></div>')
    const author = $('<strong class="chat-author"></strong>')
    author.text((player || 'Player') + ': ')
    if (color_class) author.addClass(color_class)
    line.append(author)
    line.append(document.createTextNode(text || ''))
    feed.append(line)
    while (feed.children().length > 2000) feed.children().first().remove()
    feed.scrollTop(feed[0].scrollHeight)
}

function send_chat(): void {
    const input = $('#chat-input')
    const text = (input.val() as string || '').trim()
    if (!text || !websocket) return
    websocket.send(JSON.stringify({type: 'chat', text: text}))
    input.val('')
}

function append_system_message(message: string): void {
    append_log_line('[system] ' + message)
}

function append_log_line(text: string): void {
    const feed = $('#command-feed')
    if (!feed.length) return
    const line = $('<div class="feed-line"></div>')
    line.text(text)
    feed.append(line)
    while (feed.children().length > 2000) feed.children().first().remove()
    feed.scrollTop(feed[0].scrollHeight)
}

// ---------------------------------------------------------------------------
// Game-text size stepper
// ---------------------------------------------------------------------------

/* AsyncGlk's CSS exposes absolute px sizes (--glkote-buffer-size /
   --glkote-grid-size / --glkote-grid-line-height), not a multiplier, so we
   compute the scaled values in JS off each theme's --glkote-*-base-size
   vars. --fb-game-font-scale is also stored on documentElement so the
   stepper can read its own state back via getComputedStyle. */
function apply_font_scale(scale: number): number {
    if (isNaN(scale)) scale = 1
    scale = Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, scale))
    /* Snap to the step grid so persisted values stay tidy across reloads. */
    scale = Math.round(scale / FONT_SCALE_STEP) * FONT_SCALE_STEP
    const root = document.documentElement
    root.style.setProperty('--fb-game-font-scale', String(scale))
    /* Per-theme bases via CSS vars; fall back to AsyncGlk defaults so the
       page still works without a flutterbug theme loaded. */
    const buffer_base = read_px_var('--glkote-buffer-base-size', ASYNCGLK_BUFFER_BASE_PX)
    const grid_base = read_px_var('--glkote-grid-base-size', ASYNCGLK_GRID_BASE_PX)
    const grid_lh_base = read_px_var('--glkote-grid-base-line-height', ASYNCGLK_GRID_LINE_HEIGHT_BASE_PX)
    root.style.setProperty('--glkote-buffer-size', (buffer_base * scale) + 'px')
    root.style.setProperty('--glkote-grid-size', (grid_base * scale) + 'px')
    root.style.setProperty('--glkote-grid-line-height', (grid_lh_base * scale) + 'px')
    const label = document.getElementById('font-size-reset')
    if (label) label.textContent = Math.round(scale * 100) + '%'
    try { window.localStorage.setItem(FONT_SCALE_KEY, String(scale)) }
    catch (ex) { /* localStorage may be unavailable */ }
    window.dispatchEvent(new Event('resize'))
    return scale
}

function current_font_scale(): number {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--fb-game-font-scale')
    const val = parseFloat(raw)
    return isNaN(val) ? 1 : val
}

// ---------------------------------------------------------------------------
// Fixed-mode layout sync (host pixel size pushed via 'layout' envelope)
// ---------------------------------------------------------------------------

/* Fixed-mode only: server pushes the host's gameport pixel size so this
   client's #gameport matches and GlkOte's right-anchored window rects
   render pixel-identical to the host. Setting inline width/height also
   overrides the absolute left:0/right:sidebar/height:100% in
   theme-base.css. After resizing we dispatch a window resize so GlkOte
   re-measures current_metrics. */
function apply_gameport_layout(width: number | undefined, height: number | undefined): void {
    const gp = document.getElementById('gameport')
    if (!gp) return
    if (typeof width === 'number') {
        gp.style.width = width + 'px'
        gp.style.right = 'auto'
    }
    if (typeof height === 'number') gp.style.height = height + 'px'
    window.dispatchEvent(new Event('resize'))
}

// ---------------------------------------------------------------------------
// Download helpers
// ---------------------------------------------------------------------------

/* Trigger a browser download of `text` named `filename`. We build the blob
   ourselves rather than using a data: URL so very long transcripts don't hit
   URL-length limits. */
function download_text(filename: string, text: string): void {
    const blob = new Blob([text], {type: 'text/plain;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    /* Defer revocation so the click has definitely been picked up. */
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* "YYYY-MM-DD-HHMM" suffix in local time so users get a filename they can
   sort by session without timezone surprises. */
function timestamp_suffix(): string {
    const d = new Date()
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
        + '-' + pad(d.getHours()) + pad(d.getMinutes())
}

function download_commands(): void {
    const lines: string[] = []
    $('#command-feed .feed-line').each(function () {
        /* Skip lines without a .cmd-text span — those are system messages
           ("[system] ..."), not player commands. */
        const cmd = $(this).find('.cmd-text')
        if (cmd.length) lines.push(cmd.text())
    })
    download_text('flutterbug-commands-' + timestamp_suffix() + '.txt',
                  lines.join('\n') + (lines.length ? '\n' : ''))
}

function download_chat(): void {
    const lines: string[] = []
    $('#chat-messages .feed-line').each(function () {
        /* Each chat line is "<strong>Name: </strong>text"; .text() flattens
           that into "Name: text" which is the format we want for the file. */
        lines.push($(this).text())
    })
    download_text('flutterbug-chat-' + timestamp_suffix() + '.txt',
                  lines.join('\n') + (lines.length ? '\n' : ''))
}

function update_status(message: string): void {
    const el = $('#shared-status')
    if (!el.length) return
    if (!message) { el.text(''); el.hide(); return }
    el.text(message); el.show()
}

/* Find the game's currently-accepting input. AsyncGlk creates one
   <textarea class="Input"> per window (input.ts), parks it off-screen
   (input.css gives it left: -10000px, width: 5px), and toggles
   disabled=true between accepting prompts. .focus() is a no-op on a
   disabled element, so :not([disabled]) is what makes "go to the game
   input" actually work. The :visible filter would have matched the
   off-screen one too -- jQuery's :visible only checks dimensions and
   display, not viewport position. */
function active_game_input(): HTMLElement | null {
    const el = $('#windowport textarea:not([disabled]), #windowport input[type=text]:not([disabled])').first()
    return el.length ? (el[0] as HTMLElement) : null
}

function focus_game_input(): void {
    const el = active_game_input()
    if (el) el.focus()
}

// ---------------------------------------------------------------------------
// Page-ready bootstrap
// ---------------------------------------------------------------------------

$(document).ready(() => {
    /* AsyncGlk's WebGlkOte constructor needs #gameport in the DOM, so we
       create it here rather than at script load. The accept callback that
       Plotkin's playws.js exposed via a global Game={accept: ...} object
       is passed inline to init() in callback_websocket_open(). */
    glkote = new WebGlkOte()
    open_websocket()

    /* Restore the user's slash-chat preference. Default is on; some games
       (e.g. Hadean Lands) bind '/' as a real verb, so this can be turned off. */
    try {
        const stored = window.localStorage.getItem(SLASH_CHAT_KEY)
        if (stored === '0') slash_chat_enabled = false
    } catch (ex) { /* localStorage may be unavailable */ }
    $('#slash-chat-toggle').prop('checked', slash_chat_enabled)
    $('#slash-chat-toggle').on('change', function () {
        slash_chat_enabled = (this as HTMLInputElement).checked
        try {
            window.localStorage.setItem(SLASH_CHAT_KEY, slash_chat_enabled ? '1' : '0')
        } catch (ex) { /* ignore quota / private-mode failures */ }
    })

    /* Restore the saved game-text scale, if any, before the first arrange
       fires. apply_font_scale() also dispatches a resize so any in-flight
       GlkOte init picks up the right metrics. */
    let initial_scale = 1
    try {
        const stored_scale = parseFloat(window.localStorage.getItem(FONT_SCALE_KEY) || '')
        if (!isNaN(stored_scale)) initial_scale = stored_scale
    } catch (ex) { /* localStorage may be unavailable */ }
    apply_font_scale(initial_scale)

    $('#font-size-down').on('click', () => apply_font_scale(current_font_scale() - FONT_SCALE_STEP))
    $('#font-size-up').on('click', () => apply_font_scale(current_font_scale() + FONT_SCALE_STEP))
    $('#font-size-reset').on('click', () => apply_font_scale(1))

    $('#download-commands').on('click', download_commands)
    $('#download-chat').on('click', download_chat)
    $('#chat-input').on('keydown', function (ev) {
        /* Plain Enter sends; Shift+Enter falls through to the textarea's
           default newline insertion. preventDefault is required because
           the input is now a <textarea> -- without it the message would
           also get a trailing \n. */
        if (ev.key === 'Enter' && !ev.shiftKey) {
            ev.preventDefault()
            send_chat()
        } else if (ev.key === 'Escape') {
            focus_game_input()
        } else if (ev.key !== 'Backspace' && ev.key !== 'Delete') {
            send_typing('chat')
        }
    })

    /* Slash-chat shortcut: when the user presses '/' as the very first
       keystroke in an empty game input field, steal focus to the chat box.
       AsyncGlk's input handler at asyncglk/src/glkote/web/input.ts calls
       ev.stopPropagation() on keydown to keep document-level handlers
       quiet, which kills jQuery's bubble-based delegation that
       Plotkin-path playws.js uses. So we listen in the *capture* phase on
       document, which fires top-down (before AsyncGlk's per-textarea
       handler can stop it). */
    document.addEventListener('keydown', ev => {
        const target = ev.target as HTMLElement | null
        const windowport = document.getElementById('windowport')
        if (!target || !windowport || !windowport.contains(target)) return
        const tag = target.tagName
        const is_text = (tag === 'INPUT' && (target as HTMLInputElement).type === 'text')
            || tag === 'TEXTAREA'
        if (!is_text) return

        const value = (target as HTMLInputElement | HTMLTextAreaElement).value || ''
        if (slash_chat_enabled && ev.key === '/' && value === '') {
            ev.preventDefault()
            ev.stopPropagation()
            document.getElementById('chat-input')?.focus()
        } else if (ev.key !== 'Enter' && ev.key !== 'Backspace' && ev.key !== 'Delete') {
            send_typing('command')
        }
    }, /* useCapture = */ true)

    /* Used when chat input is escaped and the user wants to return to
       typing in the game window. Defined out here as a function rather
       than inline so #chat-input's keydown handler can call it. */
    void focus_game_input  // keep linters from flagging it as unused

    /* Tab toggles between the game's active input and the chat input.
       The page has other focusable controls (download buttons,
       font-size buttons, slash-chat toggle) but the user wanted Tab to
       cycle only the two text fields they're actually likely to be
       typing into. Implementing it as a focus-swap rather than a
       tabindex/-1 sweep gives wrap-around (Tab from chat goes to game
       and vice versa) and is robust to AsyncGlk's dynamic input
       elements that come and go as windows open/close. Capture phase
       so AsyncGlk's per-input keydown handlers (which stopPropagation
       on Tab) don't swallow it before we see it. */
    document.addEventListener('keydown', ev => {
        if (ev.key !== 'Tab' || ev.altKey || ev.ctrlKey || ev.metaKey) return
        const chat = document.getElementById('chat-input')
        const game = active_game_input()
        if (!chat || !game) return
        const active = document.activeElement
        if (active === chat) {
            ev.preventDefault()
            ev.stopPropagation()
            game.focus()
        } else if (active === game) {
            ev.preventDefault()
            ev.stopPropagation()
            chat.focus()
        }
    }, /* useCapture = */ true)
})
