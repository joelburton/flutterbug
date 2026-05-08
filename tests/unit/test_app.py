"""Unit tests for helpers in ``app.py`` that don't need the full ASGI app."""

import logging
import os

from flutterbug_server.app import _check_browser_assets, _is_allowed_origin


def test_origin_missing_is_allowed():
    """Non-browser clients (test fixtures, scripts) don't send Origin."""
    assert _is_allowed_origin(None, 'localhost:4000')
    assert _is_allowed_origin('', 'localhost:4000')


def test_origin_localhost_is_allowed():
    assert _is_allowed_origin('http://localhost:4000', 'localhost:4000')
    assert _is_allowed_origin('http://127.0.0.1:4000', '127.0.0.1:4000')


def test_origin_known_tunnel_suffix_is_allowed():
    """Tunnels often rewrite Host to localhost upstream, so an exact
    Origin==Host check would reject legitimate tunneled connections.
    Suffix allow-list covers the providers we ship support for."""
    assert _is_allowed_origin(
        'https://gentle-orange.trycloudflare.com', 'localhost:4000')
    assert _is_allowed_origin(
        'https://abc-def.lhr.life', 'localhost:4000')


def test_origin_matching_host_is_allowed():
    """Reverse proxies that preserve Host: Origin and Host both name the
    public hostname, so an exact match is the natural pass."""
    assert _is_allowed_origin(
        'https://play.example.com', 'play.example.com')
    assert _is_allowed_origin(
        'https://play.example.com', 'play.example.com:443')


def test_origin_foreign_host_is_rejected():
    """The CSRF-mitigation case: signed-in user visits evil.com which tries
    to open a websocket carrying their session cookie."""
    assert not _is_allowed_origin(
        'https://evil.example.com', 'localhost:4000')
    assert not _is_allowed_origin(
        'https://evil.example.com', 'play.example.com')


def test_origin_lookalike_tunnel_suffix_is_rejected():
    """``foo.trycloudflare.com.evil.com`` ends with ``.evil.com``, not
    with the tunnel suffix; the endswith check must not be fooled."""
    assert not _is_allowed_origin(
        'https://foo.trycloudflare.com.evil.com', 'localhost:4000')


def test_origin_with_no_hostname_is_rejected():
    """``Origin: null`` (sandbox iframes) and bare schemes have no hostname."""
    assert not _is_allowed_origin('null', 'localhost:4000')
    assert not _is_allowed_origin('http://', 'localhost:4000')


def test_browser_assets_check_silent_when_present(tmp_path, caplog):
    os.makedirs(tmp_path / 'asyncglk-css')
    (tmp_path / 'play.bundle.js').write_text('// bundle')
    (tmp_path / 'asyncglk-css' / 'glkote.css').write_text('/* css */')
    with caplog.at_level(logging.ERROR):
        _check_browser_assets(str(tmp_path), logging.getLogger('test'))
    assert caplog.records == []


def test_browser_assets_check_logs_when_missing(tmp_path, caplog):
    """Empty static dir; both required assets absent. The log must name
    them and tell the user how to fix it -- this is the message we want
    a confused new user to see at boot before chasing phantom server bugs."""
    with caplog.at_level(logging.ERROR):
        _check_browser_assets(str(tmp_path), logging.getLogger('test'))
    assert len(caplog.records) == 1
    msg = caplog.records[0].getMessage()
    assert 'play.bundle.js' in msg
    assert 'glkote.css' in msg
    assert 'npm run build' in msg
