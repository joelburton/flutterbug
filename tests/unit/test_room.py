"""Unit tests for SharedRoom helpers that don't require a running VM."""

import asyncio
import logging
import sys
from pathlib import Path

import pytest

from flutterbug_server import room as room_module
from flutterbug_server.room import SharedRoom, _default_vm_factory


def _make_room(resource_dir: Path | None) -> SharedRoom:
    return SharedRoom(
        command='fake',
        log=logging.getLogger('test'),
        cwd='/tmp',
        resource_dir=str(resource_dir) if resource_dir else None,
    )


# -----------------------------------------------------------------
# _add_missing_image_urls: walks the outgoing payload and synthesizes
# url fields for `special: 'image'` nodes the VM didn't fill in.
# -----------------------------------------------------------------

def test_add_missing_image_urls_inserts_url_for_known_pict(tmp_path):
    (tmp_path / 'pict-1.png').write_bytes(b'fake png')
    room = _make_room(tmp_path)

    payload = {
        'content': [{
            'text': [{'content': [{'special': 'image', 'image': 1}]}],
        }]
    }
    inserted = room._add_missing_image_urls(payload)

    assert inserted == 1
    img = payload['content'][0]['text'][0]['content'][0]
    assert img['url'] == '/static/resource/pict-1.png'


def test_add_missing_image_urls_skips_when_url_already_set(tmp_path):
    (tmp_path / 'pict-1.png').write_bytes(b'fake png')
    room = _make_room(tmp_path)

    payload = {'special': 'image', 'image': 1, 'url': '/preset.png'}
    inserted = room._add_missing_image_urls(payload)

    assert inserted == 0
    assert payload['url'] == '/preset.png'


def test_add_missing_image_urls_skips_when_pict_file_missing(tmp_path):
    # No pict-1.* on disk at all.
    room = _make_room(tmp_path)

    payload = {'special': 'image', 'image': 1}
    inserted = room._add_missing_image_urls(payload)

    assert inserted == 0
    assert 'url' not in payload


def test_add_missing_image_urls_handles_jpeg_extension(tmp_path):
    (tmp_path / 'pict-7.jpeg').write_bytes(b'fake jpeg')
    room = _make_room(tmp_path)

    payload = {'special': 'image', 'image': 7}
    room._add_missing_image_urls(payload)

    assert payload['url'] == '/static/resource/pict-7.jpeg'


def test_add_missing_image_urls_walks_nested_dicts_and_lists(tmp_path):
    (tmp_path / 'pict-1.png').write_bytes(b'.')
    (tmp_path / 'pict-2.png').write_bytes(b'.')
    room = _make_room(tmp_path)

    payload = {
        'windows': [
            {'id': 1, 'special': 'image', 'image': 1},
            {'id': 2, 'inner': {'deep': [{'special': 'image', 'image': 2}]}},
        ]
    }
    inserted = room._add_missing_image_urls(payload)

    assert inserted == 2
    assert payload['windows'][0]['url'] == '/static/resource/pict-1.png'
    assert (payload['windows'][1]['inner']['deep'][0]['url']
            == '/static/resource/pict-2.png')


def test_add_missing_image_urls_no_resource_dir_returns_zero():
    room = _make_room(None)
    payload = {'special': 'image', 'image': 1}

    assert room._add_missing_image_urls(payload) == 0
    assert 'url' not in payload


def test_add_missing_image_urls_ignores_non_image_special_nodes(tmp_path):
    (tmp_path / 'pict-1.png').write_bytes(b'.')
    room = _make_room(tmp_path)

    # `special: 'flowbreak'` (or anything other than 'image') must be left alone.
    payload = {'special': 'flowbreak', 'image': 1}
    inserted = room._add_missing_image_urls(payload)

    assert inserted == 0
    assert 'url' not in payload


def test_add_missing_image_urls_tolerates_non_int_image_field(tmp_path):
    (tmp_path / 'pict-1.png').write_bytes(b'.')
    room = _make_room(tmp_path)

    # `image` arrives as a string from the VM in a malformed payload — must
    # still resolve via int() coercion rather than crash.
    payload = {'special': 'image', 'image': '1'}
    room._add_missing_image_urls(payload)
    assert payload['url'] == '/static/resource/pict-1.png'

    # Truly garbage `image` field: skip silently.
    bad = {'special': 'image', 'image': 'not-a-number'}
    assert room._add_missing_image_urls(bad) == 0
    assert 'url' not in bad


# -----------------------------------------------------------------
# _default_vm_factory: pre-resolve the program against PATH so a missing
# binary surfaces a clear error rather than uvloop's bare ENOENT.
# -----------------------------------------------------------------

@pytest.mark.skipif(sys.platform == 'win32', reason='POSIX-only path')
def test_default_vm_factory_raises_clear_error_for_missing_binary(monkeypatch):
    monkeypatch.setattr(room_module.shutil, 'which', lambda _: None)

    with pytest.raises(FileNotFoundError) as exc_info:
        asyncio.run(_default_vm_factory('definitely-not-a-real-cmd --rem', '/tmp'))

    msg = str(exc_info.value)
    assert 'definitely-not-a-real-cmd' in msg
    assert 'not found on PATH' in msg


@pytest.mark.skipif(sys.platform == 'win32', reason='POSIX-only path')
def test_default_vm_factory_passes_resolved_path_to_subprocess(monkeypatch):
    monkeypatch.setattr(room_module.shutil, 'which', lambda _: '/abs/emglken')

    seen = {}

    async def fake_exec(*args, **kwargs):
        seen['args'] = args
        seen['kwargs'] = kwargs
        return 'sentinel'

    monkeypatch.setattr(asyncio, 'create_subprocess_exec', fake_exec)

    result = asyncio.run(_default_vm_factory('emglken Game.z5 --rem', '/tmp'))

    assert result == 'sentinel'
    assert seen['args'] == ('/abs/emglken', 'Game.z5', '--rem')
    assert seen['kwargs']['cwd'] == '/tmp'
