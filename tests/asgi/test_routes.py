"""HTTP route tests: login, /play, /savefiles."""

import pytest


def test_main_get_renders_signin_form(client):
    r = client.get('/')
    assert r.status_code == 200
    assert 'signin' in r.text.lower()


def test_play_without_session_redirects_home(client):
    r = client.get('/play', follow_redirects=False)
    assert r.status_code == 303
    assert r.headers['location'] == '/'


def test_signin_unlocks_play_and_threads_name_and_theme(client):
    client.post('/', data={'signin': '1'})
    r = client.get('/play?name=Alice&theme=nocturne')
    assert r.status_code == 200
    assert 'theme-nocturne.css' in r.text
    assert 'Alice' in r.text


def test_play_falls_back_to_default_theme_for_unknown(signed_in_client):
    r = signed_in_client.get('/play?theme=neon-banana')
    assert r.status_code == 200
    assert 'theme-flutterbug.css' in r.text


def test_signout_clears_session(signed_in_client):
    signed_in_client.post('/', data={'signout': '1'})
    r = signed_in_client.get('/play', follow_redirects=False)
    assert r.status_code == 303


def test_main_post_with_unknown_button_is_400(client):
    r = client.post('/', data={'whatever': '1'})
    assert r.status_code == 400


def test_savefiles_403_without_session(client):
    r = client.get('/savefiles')
    assert r.status_code == 403


def test_savefiles_lists_glksave_files_in_launch_dir(signed_in_client, launch_dir):
    (launch_dir / 'first.glksave').write_bytes(b'x')
    (launch_dir / 'second.glksave').write_bytes(b'x')
    (launch_dir / 'not-a-save.txt').write_bytes(b'x')

    r = signed_in_client.get('/savefiles')
    assert r.status_code == 200
    names = {f['name'] for f in r.json()['files']}
    assert names == {'first.glksave', 'second.glksave'}


def test_index_renders_story_metadata_when_present(fake_story_metadata, client):
    r = client.get('/')
    assert r.status_code == 200
    assert fake_story_metadata['title'] in r.text
    assert fake_story_metadata['author'] in r.text
    assert fake_story_metadata['cover_art_url'] in r.text


def test_play_falls_back_to_player_prefix_when_name_blank(signed_in_client):
    r = signed_in_client.get('/play?name=%20%20')
    assert r.status_code == 200
    # The fallback name uses the first 6 chars of the sessionid; we don't know
    # the value, but we do know the prefix.
    assert 'Player-' in r.text


def test_play_clamps_overlong_player_name(signed_in_client):
    """The browser form caps maxlength=40, but a hand-crafted URL can ship
    a megabyte. Server must clamp so it doesn't land in the roster and get
    fanned out on every players envelope."""
    from flutterbug_server.app import PLAYERNAME_MAX_LENGTH

    long_name = 'A' * (PLAYERNAME_MAX_LENGTH + 500)
    r = signed_in_client.get(f'/play?name={long_name}')
    assert r.status_code == 200
    # The full overlong name must not appear in the rendered page.
    assert long_name not in r.text
    # The clamped prefix must appear.
    assert 'A' * PLAYERNAME_MAX_LENGTH in r.text


def test_signin_form_omits_password_field_when_no_password_required(client):
    r = client.get('/')
    assert 'name="password"' not in r.text


class TestPasswordGate:
    """Routes when --password is set."""

    @pytest.fixture
    def password(self):
        return 'open-sesame'

    def test_signin_form_shows_password_field(self, client):
        r = client.get('/')
        assert 'name="password"' in r.text

    def test_signin_without_password_is_401(self, client):
        r = client.post('/', data={'signin': '1'})
        assert r.status_code == 401
        # No session cookie was set.
        assert 'session' not in r.cookies
        assert 'Incorrect password' in r.text

    def test_signin_with_wrong_password_is_401(self, client):
        r = client.post('/', data={'signin': '1', 'password': 'guessing'})
        assert r.status_code == 401
        assert 'session' not in r.cookies

    def test_signin_with_correct_password_grants_session(self, client):
        r = client.post('/', data={'signin': '1', 'password': 'open-sesame'})
        assert r.status_code == 200
        # Session cookie was set; /play is now reachable.
        play = client.get('/play', follow_redirects=False)
        assert play.status_code == 200

    def test_websocket_unreachable_after_failed_signin(self, client):
        client.post('/', data={'signin': '1', 'password': 'wrong'})
        from starlette.testclient import WebSocketDisconnect
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect('/websocket'):
                pass
        assert exc_info.value.code == 1008


def test_savefiles_sorted_newest_first(signed_in_client, launch_dir):
    import os
    import time

    old = launch_dir / 'old.glksave'
    new = launch_dir / 'new.glksave'
    old.write_bytes(b'x')
    new.write_bytes(b'x')
    # Force a known mtime ordering rather than relying on filesystem timing.
    past = time.time() - 3600
    os.utime(old, (past, past))

    r = signed_in_client.get('/savefiles')
    names = [f['name'] for f in r.json()['files']]
    assert names == ['new.glksave', 'old.glksave']
