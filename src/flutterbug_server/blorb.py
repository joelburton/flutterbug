"""Blorb resource extraction and image-dimension probing.

Blorb is the standard packaging format for Glulx/Z-Machine games with bundled
resources (cover art, in-game graphics, sounds). RemGlk-based interpreters
expect resources to be served as separate files at a URL stem; we extract
``Pict`` chunks from the .blorb at startup and write them next to a
``resourcemap.json`` index that GlkOte loads.
"""

import json
import os
import os.path
import struct
from logging import Logger

BLORB_EXTENSIONS = ('.blorb', '.gblorb', '.blb', '.zblorb')


def extract_png_dimensions(data: bytes) -> tuple[int | None, int | None]:
    """Return (width, height) for a PNG, or (None, None) if not a PNG."""
    if len(data) < 24:
        return (None, None)
    if data[0:8] != b'\x89PNG\r\n\x1a\n':
        return (None, None)
    if data[12:16] != b'IHDR':
        return (None, None)
    return (struct.unpack('>I', data[16:20])[0], struct.unpack('>I', data[20:24])[0])


def extract_jpeg_dimensions(data: bytes) -> tuple[int | None, int | None]:
    """Return (width, height) for a JPEG, or (None, None) if not parseable."""
    if len(data) < 4 or data[0:2] != b'\xff\xd8':
        return (None, None)
    pos = 2
    maxlen = len(data)
    while pos + 3 < maxlen:
        while pos < maxlen and data[pos] == 0xFF:
            pos += 1
        if pos >= maxlen:
            break
        marker = data[pos]
        pos += 1
        if marker in (0xD8, 0xD9, 0x01) or 0xD0 <= marker <= 0xD7:
            continue
        if pos + 1 >= maxlen:
            break
        seglen = struct.unpack('>H', data[pos:pos+2])[0]
        pos += 2
        if seglen < 2 or pos + seglen - 2 > maxlen:
            break
        if marker in (0xC0, 0xC2) and seglen >= 7:
            height = struct.unpack('>H', data[pos+1:pos+3])[0]
            width = struct.unpack('>H', data[pos+3:pos+5])[0]
            return (width, height)
        pos += seglen - 2
    return (None, None)


def write_if_changed(path: str, data: bytes) -> bool:
    """Write *data* to *path* unless it already contains exactly *data*."""
    if os.path.exists(path):
        with open(path, 'rb') as fl:
            if fl.read() == data:
                return False
    with open(path, 'wb') as fl:
        fl.write(data)
    return True


def autounpack_blorb_resources(
    story_path: str | None,
    resource_dir: str,
    log: Logger,
) -> None:
    """Extract Pict resources from a Blorb story file into *resource_dir*.

    No-op when *story_path* is None or doesn't have a Blorb extension —
    the caller may invoke us unconditionally and we silently skip games
    that don't ship resources.
    """
    if not story_path:
        log.info('No --story given; skipping Blorb resource auto-unpack.')
        return
    if not story_path.lower().endswith(BLORB_EXTENSIONS):
        log.info('Story file is not a Blorb; skipping auto-unpack: %s', story_path)
        return
    if not os.path.isfile(story_path):
        log.info('Story file does not exist; skipping auto-unpack: %s', story_path)
        return

    with open(story_path, 'rb') as fl:
        blob = fl.read()

    if len(blob) < 12 or blob[0:4] != b'FORM' or blob[8:12] != b'IFRS':
        log.info('File is not a valid Blorb FORM/IFRS: %s', story_path)
        return

    chunks: dict[int, tuple[bytes, bytes]] = {}
    pos = 12
    bloblen = len(blob)
    while pos + 8 <= bloblen:
        chunkid = blob[pos:pos+4]
        chunklen = struct.unpack('>I', blob[pos+4:pos+8])[0]
        datastart = pos + 8
        dataend = datastart + chunklen
        if dataend > bloblen:
            break
        chunks[pos] = (chunkid, blob[datastart:dataend])
        pos = dataend + (chunklen & 1)

    ridx_chunk: bytes | None = None
    for (chunkid, chunkdata) in chunks.values():
        if chunkid == b'RIdx':
            ridx_chunk = chunkdata
            break
    if not ridx_chunk or len(ridx_chunk) < 4:
        log.info('No RIdx chunk in Blorb; skipping auto-unpack: %s', story_path)
        return

    count = struct.unpack('>I', ridx_chunk[0:4])[0]
    expected = 4 + count * 12
    if len(ridx_chunk) < expected:
        log.warning('Malformed RIdx chunk (short data); skipping auto-unpack.')
        return

    os.makedirs(resource_dir, exist_ok=True)

    res_entries: dict[str, dict] = {}
    wrote = 0
    for idx in range(count):
        base = 4 + idx * 12
        usage = ridx_chunk[base:base+4]
        number = struct.unpack('>I', ridx_chunk[base+4:base+8])[0]
        start = struct.unpack('>I', ridx_chunk[base+8:base+12])[0]
        if usage != b'Pict':
            continue

        chunk = chunks.get(start)
        if chunk is None:
            # Some tools record offsets relative to the IFRS payload start.
            chunk = chunks.get(start + 12)
        if chunk is None:
            log.warning('Pict resource %s points to missing chunk offset %s', number, start)
            continue

        (chunkid, chunkdata) = chunk
        if chunkid == b'PNG ':
            ext = 'png'
            (width, height) = extract_png_dimensions(chunkdata)
        elif chunkid == b'JPEG':
            ext = 'jpeg'
            (width, height) = extract_jpeg_dimensions(chunkdata)
        else:
            log.warning('Pict resource %s has unsupported chunk type %r', number, chunkid)
            continue

        filename = 'pict-%s.%s' % (number, ext)
        outpath = os.path.join(resource_dir, filename)
        if write_if_changed(outpath, chunkdata):
            wrote += 1

        res_entries['pict-%s' % (number,)] = {
            'image': number,
            'url': filename,
            'width': width,
            'height': height,
        }

    if not res_entries:
        log.info('No Pict resources found in Blorb: %s', story_path)
        return

    jsonmap_path = os.path.join(resource_dir, 'resourcemap.json')
    jsmap_path = os.path.join(resource_dir, 'resourcemap.js')

    jsonmap_data = json.dumps(res_entries, indent=2, sort_keys=True).encode('utf-8') + b'\n'
    write_if_changed(jsonmap_path, jsonmap_data)

    js_entries = {
        val['image']: {
            'image': val['image'],
            'url': val['url'],
            'width': val['width'],
            'height': val['height'],
        }
        for val in res_entries.values()
    }
    js_lines = [
        b'/* resourcemap.js generated automatically from Blorb */',
        b'StaticImageInfo = ' + json.dumps(js_entries, indent=2, sort_keys=True).encode('utf-8') + b';',
        b'',
    ]
    write_if_changed(jsmap_path, b'\n'.join(js_lines))

    log.info('Auto-unpacked %s image resources from %s into %s',
             len(res_entries), story_path, resource_dir)
    if wrote:
        log.info('Wrote/updated %s image files.', wrote)
