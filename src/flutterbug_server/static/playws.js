/*
  Client-side code for Remote-IF demo (websocket version).

  Written by Andrew Plotkin. This script is in the public domain.
 */

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
        GlkOte.log('Creating websocket: ' + url);
        websocket = new WebSocket(url);
    }
    catch (ex) {
        GlkOte.error('Unable to open websocket: ' + ex);
        return;
    }

    websocket.onopen = callback_websocket_open;
    websocket.onclose = callback_websocket_close;
    websocket.onmessage = callback_websocket_message;
}

function callback_websocket_open() {
    GlkOte.init();
}

function callback_websocket_close(ev) {
    websocket = null;
    GlkOte.error('Websocket has closed: (' + ev.code + ',' + ev.reason + ')');
}

function callback_websocket_message(ev) {
    var obj = JSON.parse(ev.data);

    if (obj.multiplayer == 'players') {
        update_player_list(obj.players || []);
        return;
    }

    if (obj.multiplayer == 'chat') {
        append_chat(obj.player, obj.color, obj.text);
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

    if (obj.multiplayer == 'error' || obj.multiplayer == 'info') {
        append_system_message(obj.message || 'Server message.');
        if (obj.multiplayer == 'error')
            GlkOte.error(obj.message || 'Server error.');
        return;
    }

    GlkOte.update(obj);
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
        item[0].style.setProperty('--player-color', player.color || '#555');
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
    append_log_line((player || 'Player') + ': ' + (command || ''));
}

function append_chat(player, color, text) {
    var feed = $('#chat-messages');
    if (!feed.length)
        return;
    var line = $('<div class="feed-line"></div>');
    var author = $('<strong class="chat-author"></strong>');
    author.text((player || 'Player') + ': ');
    author[0].style.setProperty('--player-color', color || '#555');
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

/* Game-text size stepper. We mutate --glk-game-font-scale on documentElement;
   the theme stylesheets multiply the buffer/grid font sizes by it via calc().
   GlkOte's resize observer only fires on gameport size changes, so after
   adjusting the scale we dispatch a window resize event to force it to
   re-measure character metrics and emit a fresh arrange to the VM. */
function apply_font_scale(scale) {
    if (isNaN(scale)) scale = 1;
    scale = Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, scale));
    /* Snap to the step grid so persisted values stay tidy across reloads. */
    scale = Math.round(scale / FONT_SCALE_STEP) * FONT_SCALE_STEP;
    document.documentElement.style.setProperty('--glk-game-font-scale', scale);
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


Game = {
    accept: accept,
};

/* The page-ready handler. Like onload(), but better, I'm told. */
$(document).ready(function() {
    if (use_gidebug) {
        Game.debug_commands = true;
        Game.debug_console_open = true;
    }
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
    $('#chat-input').on('keydown', function(ev) {
        if (ev.key === 'Enter') {
            send_chat();
        } else if (ev.key === 'Escape') {
            focus_game_input();
        } else {
            send_typing('chat');
        }
    });

    /* When the user presses '/' as the very first keystroke in an empty
       game input field, steal focus to the chat box instead — unless the
       user has turned this off so '/' can pass through to the game. */
    $('#windowport').on('keydown', 'input[type=text], textarea', function(ev) {
        if (slash_chat_enabled && ev.key === '/' && $(this).val() === '') {
            ev.preventDefault();
            $('#chat-input').focus();
        } else if (ev.key !== 'Enter') {
            send_typing('command');
        }
    });
});

function focus_game_input() {
    var el = $('#windowport input[type=text]:visible, #windowport textarea:visible').first();
    if (el.length)
        el.focus();
}


