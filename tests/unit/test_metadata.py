"""Unit tests for ``lookup_story_metadata``.

Every external boundary (BabelStory parsing, IFDB network call) is
faked via ``monkeypatch.setattr`` on the source modules. The function
under test does ``from babel_if import BabelStory`` *inside* its body
each call, which picks up the monkeypatched attribute at call time.

These tests pin the contract that *any* failure in the optional-deps
chain returns None — the index page must degrade gracefully when
metadata can't be fetched.
"""

import logging

import babel_if
import ifdb

from flutterbug_server.metadata import lookup_story_metadata


def _log() -> logging.Logger:
    return logging.getLogger('test.metadata')


# -----------------------------------------------------------------
# Early returns
# -----------------------------------------------------------------

def test_returns_none_when_story_path_is_none():
    assert lookup_story_metadata(None, _log()) is None


def test_returns_none_when_story_path_is_empty_string():
    # The CLI may pass '' if --story wasn't given but a settings shim still
    # forwarded the attribute. Treat as "no story".
    assert lookup_story_metadata('', _log()) is None


# -----------------------------------------------------------------
# BabelStory failure modes
# -----------------------------------------------------------------

def test_returns_none_when_babel_cannot_open_file(monkeypatch):
    class _BoomStory:
        def __init__(self, *a, **k):
            raise RuntimeError('cannot read story')

    monkeypatch.setattr(babel_if, 'BabelStory', _BoomStory)
    assert lookup_story_metadata('/path/x.gblorb', _log()) is None


def test_returns_none_when_story_has_no_ifid(monkeypatch):
    class _NoIfidStory:
        def __init__(self, path):
            self.ifid = None

    monkeypatch.setattr(babel_if, 'BabelStory', _NoIfidStory)
    assert lookup_story_metadata('/path/x.gblorb', _log()) is None


# -----------------------------------------------------------------
# IFDB failure modes
# -----------------------------------------------------------------

def test_returns_none_when_ifdb_lookup_raises(monkeypatch):
    class _Story:
        def __init__(self, path):
            self.ifid = 'IFID-123'

    class _BoomClient:
        def get_game(self, ifid=None):
            raise RuntimeError('network down')

    monkeypatch.setattr(babel_if, 'BabelStory', _Story)
    monkeypatch.setattr(ifdb, 'IFDBClient', _BoomClient)
    assert lookup_story_metadata('/path/x.gblorb', _log()) is None


def test_returns_none_when_ifdb_returns_no_game(monkeypatch):
    class _Story:
        def __init__(self, path):
            self.ifid = 'IFID-123'

    class _EmptyClient:
        def get_game(self, ifid=None):
            return None

    monkeypatch.setattr(babel_if, 'BabelStory', _Story)
    monkeypatch.setattr(ifdb, 'IFDBClient', _EmptyClient)
    assert lookup_story_metadata('/path/x.gblorb', _log()) is None


def test_returns_none_when_all_metadata_fields_are_empty(monkeypatch):
    """A bare IFDB record with title/author/cover all None is no better
    than no record at all — the index page would render a stub."""
    class _Story:
        def __init__(self, path):
            self.ifid = 'IFID-123'

    class _Game:
        title = None
        author = None
        cover_art_url = None

    class _Client:
        def get_game(self, ifid=None):
            return _Game()

    monkeypatch.setattr(babel_if, 'BabelStory', _Story)
    monkeypatch.setattr(ifdb, 'IFDBClient', _Client)
    assert lookup_story_metadata('/path/x.gblorb', _log()) is None


# -----------------------------------------------------------------
# Happy path
# -----------------------------------------------------------------

def test_returns_full_dict_on_full_happy_path(monkeypatch):
    class _Story:
        def __init__(self, path):
            self.ifid = 'IFID-123'

    class _Game:
        title = 'Curses'
        author = 'Graham Nelson'
        cover_art_url = 'https://example.invalid/c.png'

    class _Client:
        def get_game(self, ifid=None):
            assert ifid == 'IFID-123'
            return _Game()

    monkeypatch.setattr(babel_if, 'BabelStory', _Story)
    monkeypatch.setattr(ifdb, 'IFDBClient', _Client)

    result = lookup_story_metadata('/path/x.gblorb', _log())
    assert result == {
        'title': 'Curses',
        'author': 'Graham Nelson',
        'cover_art_url': 'https://example.invalid/c.png',
        'ifid': 'IFID-123',
        'description': None,
        'ifdb_url': None,
        'first_published': None,
    }


def test_returns_partial_dict_when_only_title_present(monkeypatch):
    """Some IFDB entries have only a title; we still want to surface it."""
    class _Story:
        def __init__(self, path):
            self.ifid = 'IFID-456'

    class _Game:
        title = 'Anonymous'
        author = None
        cover_art_url = None

    class _Client:
        def get_game(self, ifid=None):
            return _Game()

    monkeypatch.setattr(babel_if, 'BabelStory', _Story)
    monkeypatch.setattr(ifdb, 'IFDBClient', _Client)

    result = lookup_story_metadata('/path/x.gblorb', _log())
    assert result is not None
    assert result['title'] == 'Anonymous'
    assert result['author'] is None
    assert result['cover_art_url'] is None
    assert result['ifid'] == 'IFID-456'
