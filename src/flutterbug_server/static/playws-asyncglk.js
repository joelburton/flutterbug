/*
  AsyncGlk variant of playws.js for the Phase 2 PoC of /play2.

  Same protocol logic as playws.js (which is based on Plotkin's
  example-web-remglk-glkote demo). The only changes from that file
  are the GlkOte initialization shim and the call sites that go
  through AsyncGlk.WebGlkOte instead of Plotkin's GlkOte global:

    GlkOte.init()       → glkote.init({...options including accept...})
    glkote.update(obj)  → glkote.update(obj)
    GlkOte.log/error    → glkote.log/error

  AsyncGlk's WebGlkOte instance is constructed once at script load and
  initialized when the websocket opens, with the accept callback passed
  in directly (Plotkin's GlkOte instead reads a `Game = {accept: ...}`
  global). All other code paths — chat, players, snapshot, layout,
  font-scale, slash-chat — are unchanged from playws.js.
 */

/* AsyncGlk's WebGlkOte constructor immediately attaches a ResizeObserver
   to #gameport, so it can't be instantiated until the DOM is parsed.
   `glkote` is filled in inside $(document).ready below; nothing in this
   file references it before then. */
var glkote = null;
var websocket = null;
var slash_chat_enabled = true;
var SLASH_CHAT_KEY = 'flutterbug.slashChat';

var TYPING_STOP_DELAY = 3000;
var typing_timers = { chat: null, command: null };

var FONT_SCALE_KEY = 'flutterbug.gameFontScale';
var FONT_SCALE_MIN = 0.7;
var FONT_SCALE_MAX = 2.0;
var FONT_SCALE_STEP = 0.125;

function accept(arg) {
    var val = JSON.stringify(arg);
    websocket.send(val);
}

function open_websocket() {
    try {
        var wsproto = (window.location.protocol === 'https:') ? 'wss://' : 'ws://';
        var url = wsproto + window.location.host + '/websocket'
            + '?name=' + encodeURIComponent(multiplayer_playername);
        glkote.log('Creating websocket: ' + url);
        websocket = new WebSocket(url);
    }
    catch (ex) {
        glkote.error('Unable to open websocket: ' + ex);
        return;
    }

    websocket.onopen = callback_websocket_open;
    websocket.onclose = callback_websocket_close;
    websocket.onmessage = callback_websocket_message;
}

/* Minimal Dialog impl for the PoC. AsyncGlk's full ProviderBasedBrowserDialog
   drags in Svelte UI components that need esbuild-svelte to bundle (deferred);
   this stub gets save/restore working with a plain window.prompt(). Good enough
   to confirm the fileref-prompt path round-trips end to end. Polished UI is
   a phase-3 (or later) item. */
var SimpleDialog = {
    async: true,
    prompt: function (extension, is_write) {
        return new Promise(function (resolve) {
            var action = is_write ? 'Save as' : 'Load from';
            var hint = '(.' + extension + ' will be appended)';
            var name = window.prompt(action + ' ' + hint + ':');
            if (!name) { resolve(null); return; }
            resolve(name + '.' + extension);
        });
    },
};

function callback_websocket_open() {
    glkote.init({
        accept: accept,
        Dialog: SimpleDialog,
    });
}

function callback_websocket_close(ev) {
    websocket = null;
    glkote.error('Websocket has closed: (' + ev.code + ',' + ev.reason + ')');
}

function callback_websocket_message(ev) {
    var obj = JSON.parse(ev.data);

    if (obj.multiplayer == 'players') {
        update_player_list(obj.players || []);
        return;
    }

    if (obj.multiplayer == 'chat') {
        append_chat(obj.player, obj.color_class, obj.text);
        return;
    }
    if (obj.multiplayer == 'status') {
        update_status(obj.message || '');
        return;
    }
    if (obj.multiplayer == 'command') {
        append_command(obj.player, obj.command);
        return;
    }

    if (obj.multiplayer == 'typing') {
        update_typing(obj.player, obj.mode || null);
        return;
    }

    if (obj.multiplayer == 'layout') {
        apply_gameport_layout(obj.width, obj.height);
        return;
    }

    if (obj.multiplayer == 'error' || obj.multiplayer == 'info') {
        append_system_message(obj.message || 'Server message.');
        if (obj.multiplayer == 'error')
            glkote.error(obj.message || 'Server error.');
        return;
    }

    var chat_was_focused = document.activeElement === document.getElementById('chat-input');
    glkote.update(obj);
    if (chat_was_focused)
        document.getElementById('chat-input').focus();
    suppress_harmless_glkote_errors();
}

/* GlkOte surfaces some interpreter quirks as fatal red-box errors that are
   not actually fatal (e.g. content arriving for a window that is mid-save).
   Suppress the ones we know are harmless so players never see them. */
function suppress_harmless_glkote_errors() {
    var pane = document.getElementById('errorpane');
    var content = document.getElementById('errorcontent');
    if (!pane || !content || pane.style.display === 'none') return;
    var msg = content.textContent || '';
    if (msg.indexOf('awaiting line input') !== -1)
        pane.style.display = 'none';
}

function update_player_list(players) {
    var list = $('#players-list');
    if (!list.length)
        return;
    list.empty();
    for (var ix = 0; ix < players.length; ix++) {
        var player = players[ix];
        var name = player.name || ('Player ' + player.id);
        var item = $('<span></span>');
        item.text(name);
        if (player.color_class)
            item.addClass(player.color_class);
        if (name === multiplayer_playername)
            item.addClass('me');
        list.append(item);
    }
}

function update_typing(player, mode) {
    $('#players-list span').each(function() {
        if ($(this).text() === player) {
            $(this).removeClass('typing-chat typing-command');
            if (mode)
                $(this).addClass('typing-' + mode);
        }
    });
}

function send_typing(mode) {
    if (!websocket)
        return;
    if (typing_timers[mode])
        clearTimeout(typing_timers[mode]);
    websocket.send(JSON.stringify({ type: 'typing', mode: mode }));
    typing_timers[mode] = setTimeout(function() {
        typing_timers[mode] = null;
        if (websocket)
            websocket.send(JSON.stringify({ type: 'typing', mode: null }));
    }, TYPING_STOP_DELAY);
}

function append_command(player, command) {
    /* Build the line ourselves rather than going through append_log_line
       so the command text lives in its own span. The download-commands
       button reads .cmd-text spans to emit just the commands, dropping
       the "PlayerName: " prefix. */
    var feed = $('#command-feed');
    if (!feed.length)
        return;
    var line = $('<div class="feed-line"></div>');
    line.append(document.createTextNode((player || 'Player') + ': '));
    var cmd = $('<span class="cmd-text"></span>');
    cmd.text(command || '');
    line.append(cmd);
    feed.append(line);
    while (feed.children().length > 30) {
        feed.children().first().remove();
    }
    feed.scrollTop(feed[0].scrollHeight);
}

function append_chat(player, color_class, text) {
    var feed = $('#chat-messages');
    if (!feed.length)
        return;
    var line = $('<div class="feed-line"></div>');
    var author = $('<strong class="chat-author"></strong>');
    author.text((player || 'Player') + ': ');
    if (color_class)
        author.addClass(color_class);
    line.append(author);
    line.append(document.createTextNode(text || ''));
    feed.append(line);
    while (feed.children().length > 100) {
        feed.children().first().remove();
    }
    feed.scrollTop(feed[0].scrollHeight);
}

function send_chat() {
    var input = $('#chat-input');
    var text = input.val().trim();
    if (!text || !websocket)
        return;
    websocket.send(JSON.stringify({ type: 'chat', text: text }));
    input.val('');
}

function append_system_message(message) {
    append_log_line('[system] ' + message);
}

function append_log_line(text) {
    var feed = $('#command-feed');
    if (!feed.length)
        return;
    var line = $('<div class="feed-line"></div>');
    line.text(text);
    feed.append(line);

    while (feed.children().length > 30) {
        feed.children().first().remove();
    }
    feed.scrollTop(feed[0].scrollHeight);
}

/* Game-text size stepper. flutterbug's themes use --glk-game-font-scale to
   multiply --glk-buffer-font-size / --glk-grid-font-size — those names are
   from Plotkin's GlkOte CSS. AsyncGlk's CSS uses different var names
   (--glkote-buffer-size / --glkote-grid-size) so we additionally drive
   *its* vars off the same scale here. The default AsyncGlk sizes from
   asyncglk-css/core.css are 15px buffer / 14px grid; the themes can
   override the bases via --glk-buffer-base-size etc. if they want a
   different starting size. */
var ASYNCGLK_BUFFER_BASE_PX = 15;
var ASYNCGLK_GRID_BASE_PX = 14;
var ASYNCGLK_GRID_LINE_HEIGHT_BASE_PX = 18;  /* matches asyncglk-css/core.css default */

function apply_font_scale(scale) {
    if (isNaN(scale)) scale = 1;
    scale = Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, scale));
    /* Snap to the step grid so persisted values stay tidy across reloads. */
    scale = Math.round(scale / FONT_SCALE_STEP) * FONT_SCALE_STEP;
    var root = document.documentElement;
    root.style.setProperty('--glk-game-font-scale', scale);
    /* AsyncGlk's CSS reads --glkote-buffer-size and --glkote-grid-size; bump
       them so the buffer/grid windows resize alongside flutterbug's
       --glk-game-font-scale. We also scale --glkote-grid-line-height (an
       absolute px value, not a multiplier) so the status grid's row height
       grows with the text rather than clipping a row to its old 18px. */
    root.style.setProperty('--glkote-buffer-size', (ASYNCGLK_BUFFER_BASE_PX * scale) + 'px');
    root.style.setProperty('--glkote-grid-size', (ASYNCGLK_GRID_BASE_PX * scale) + 'px');
    root.style.setProperty('--glkote-grid-line-height', (ASYNCGLK_GRID_LINE_HEIGHT_BASE_PX * scale) + 'px');
    var label = document.getElementById('font-size-reset');
    if (label) label.textContent = Math.round(scale * 100) + '%';
    try { window.localStorage.setItem(FONT_SCALE_KEY, String(scale)); }
    catch (ex) { /* localStorage may be unavailable; current-session change still applies */ }
    window.dispatchEvent(new Event('resize'));
    return scale;
}

function current_font_scale() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--glk-game-font-scale');
    var val = parseFloat(raw);
    return isNaN(val) ? 1 : val;
}

/* Fixed-mode only: server pushes the host's gameport pixel size so this
   client's #gameport matches and GlkOte's right-anchored window rects
   (left + width vs current_metrics.width) render pixel-identical to the
   host. Setting inline width/height also overrides the absolute
   left:0/right:sidebar/height:100% in theme-base.css. After resizing we
   dispatch a window resize so GlkOte re-measures current_metrics — its
   internal cache is set at init time, before the layout message arrives. */
function apply_gameport_layout(width, height) {
    var gp = document.getElementById('gameport');
    if (!gp) return;
    if (typeof width === 'number') {
        gp.style.width = width + 'px';
        /* CSS spec: when left/right/width are all set the right value is
           ignored, but explicit "auto" is clearer to anyone reading
           devtools. */
        gp.style.right = 'auto';
    }
    if (typeof height === 'number')
        gp.style.height = height + 'px';
    window.dispatchEvent(new Event('resize'));
}

/* Trigger a browser download of `text` named `filename`. We build the
   blob ourselves rather than using a data: URL so very long transcripts
   don't hit URL-length limits. */
function download_text(filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    /* Defer revocation so the click has definitely been picked up. */
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}

/* Build a "YYYY-MM-DD-HHMM" suffix in local time so users get a
   filename they can sort by session without timezone surprises. */
function timestamp_suffix() {
    var d = new Date();
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
        + '-' + pad(d.getHours()) + pad(d.getMinutes());
}

function download_commands() {
    var lines = [];
    $('#command-feed .feed-line').each(function() {
        /* Skip lines without a .cmd-text span — those are system messages
           ("[system] ..."), not player commands. */
        var cmd = $(this).find('.cmd-text');
        if (cmd.length)
            lines.push(cmd.text());
    });
    download_text('flutterbug-commands-' + timestamp_suffix() + '.txt',
                  lines.join('\n') + (lines.length ? '\n' : ''));
}

function download_chat() {
    var lines = [];
    $('#chat-messages .feed-line').each(function() {
        /* Each chat line is "<strong>Name: </strong>text"; .text() flattens
           that into "Name: text" which is the format we want for the file. */
        lines.push($(this).text());
    });
    download_text('flutterbug-chat-' + timestamp_suffix() + '.txt',
                  lines.join('\n') + (lines.length ? '\n' : ''));
}

function update_status(message) {
    var el = $('#shared-status');
    if (!el.length)
        return;
    if (!message) {
        el.text('');
        el.hide();
        return;
    }
    el.text(message);
    el.show();
}


/* The page-ready handler. Like onload(), but better, I'm told. */
$(document).ready(function() {
    /* AsyncGlk's WebGlkOte constructor needs #gameport in the DOM, so we
       create it here rather than at script load. The accept callback that
       Plotkin's playws.js exposed via a global Game={accept: ...} object
       is passed inline to init() in callback_websocket_open(). The
       use_gidebug branch (Plotkin's in-page debug console) doesn't have an
       AsyncGlk equivalent yet; for now it's a no-op. */
    glkote = new AsyncGlk.WebGlkOte();
    open_websocket();

    /* Restore the user's slash-chat preference. Default is on; some games
       (e.g. Hadean Lands) bind '/' as a real verb, so this can be turned off. */
    try {
        var stored = window.localStorage.getItem(SLASH_CHAT_KEY);
        if (stored === '0')
            slash_chat_enabled = false;
    } catch (ex) { /* localStorage may be unavailable; keep default. */ }
    $('#slash-chat-toggle').prop('checked', slash_chat_enabled);
    $('#slash-chat-toggle').on('change', function() {
        slash_chat_enabled = this.checked;
        try {
            window.localStorage.setItem(SLASH_CHAT_KEY, slash_chat_enabled ? '1' : '0');
        } catch (ex) { /* ignore quota / private-mode failures */ }
    });

    /* Restore the saved game-text scale, if any, before the first arrange
       fires. apply_font_scale() also dispatches a resize so any in-flight
       GlkOte init picks up the right metrics. */
    var initial_scale = 1;
    try {
        var stored_scale = parseFloat(window.localStorage.getItem(FONT_SCALE_KEY));
        if (!isNaN(stored_scale)) initial_scale = stored_scale;
    } catch (ex) { /* localStorage may be unavailable; fall through to default */ }
    apply_font_scale(initial_scale);

    $('#font-size-down').on('click', function() {
        apply_font_scale(current_font_scale() - FONT_SCALE_STEP);
    });
    $('#font-size-up').on('click', function() {
        apply_font_scale(current_font_scale() + FONT_SCALE_STEP);
    });
    $('#font-size-reset').on('click', function() {
        apply_font_scale(1);
    });

    $('#chat-send').on('click', function() {
        send_chat();
    });
    $('#download-commands').on('click', download_commands);
    $('#download-chat').on('click', download_chat);
    $('#chat-input').on('keydown', function(ev) {
        if (ev.key === 'Enter') {
            send_chat();
        } else if (ev.key === 'Escape') {
            focus_game_input();
        } else if (ev.key !== 'Backspace' && ev.key !== 'Delete') {
            send_typing('chat');
        }
    });

    /* When the user presses '/' as the very first keystroke in an empty
       game input field, steal focus to the chat box instead — unless the
       user has turned this off so '/' can pass through to the game.

       The playws.js variant does this with jQuery delegation on
       #windowport, which relies on the keydown event bubbling up. That
       works for Plotkin's GlkOte but not for AsyncGlk's WebGlkOte: its
       input handler at asyncglk/src/glkote/web/input.ts calls
       ev.stopPropagation() on keydown to keep document-level handlers
       quiet, which kills the delegation. We work around that by listening
       in the *capture* phase on document, which fires top-down (before
       AsyncGlk's per-textarea handler can stop it). */
    document.addEventListener('keydown', function(ev) {
        var target = ev.target;
        var windowport = document.getElementById('windowport');
        if (!target || !windowport || !windowport.contains(target)) return;
        var tag = target.tagName;
        var is_text = (tag === 'INPUT' && target.type === 'text') || tag === 'TEXTAREA';
        if (!is_text) return;

        if (slash_chat_enabled && ev.key === '/' && (target.value || '') === '') {
            ev.preventDefault();
            ev.stopPropagation();
            document.getElementById('chat-input').focus();
        } else if (ev.key !== 'Enter' && ev.key !== 'Backspace' && ev.key !== 'Delete') {
            send_typing('command');
        }
    }, /* useCapture = */ true);
});

function focus_game_input() {
    var el = $('#windowport input[type=text]:visible, #windowport textarea:visible').first();
    if (el.length)
        el.focus();
}


