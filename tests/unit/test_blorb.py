"""Unit tests for Blorb extraction helpers and image-dimension parsers."""

import logging
import os
import struct

from flutterbug_server.blorb import (
    autounpack_blorb_resources,
    extract_jpeg_dimensions,
    extract_png_dimensions,
    write_if_changed,
)


# -----------------------------------------------------------------
# PNG / JPEG dimension probes
# -----------------------------------------------------------------

def _minimal_png(width: int, height: int) -> bytes:
    # 8-byte signature + IHDR chunk (length=13, type=IHDR, then 13 bytes:
    # width, height, bit depth, color type, compression, filter, interlace).
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_payload = struct.pack('>II', width, height) + b'\x08\x06\x00\x00\x00'
    ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_payload + b'\x00\x00\x00\x00'  # crc placeholder
    return sig + ihdr


def _minimal_jpeg(width: int, height: int) -> bytes:
    # SOI + SOF0 marker with the two big-endian dimensions.
    soi = b'\xff\xd8'
    sof0 = (b'\xff\xc0'
            + struct.pack('>H', 8)        # segment length (incl. these 2)
            + b'\x08'                     # bit depth
            + struct.pack('>HH', height, width)
            + b'\x01')                    # 1 component
    eoi = b'\xff\xd9'
    return soi + sof0 + eoi


def test_extract_png_dimensions_parses_ihdr():
    assert extract_png_dimensions(_minimal_png(640, 480)) == (640, 480)


def test_extract_png_dimensions_rejects_truncated_data():
    assert extract_png_dimensions(b'\x89PNG\r\n\x1a\n') == (None, None)


def test_extract_png_dimensions_rejects_non_png_magic():
    assert extract_png_dimensions(b'GIF89a' + b'\x00' * 30) == (None, None)


def test_extract_png_dimensions_rejects_valid_signature_with_wrong_chunk_type():
    """Valid PNG signature but the first chunk isn't IHDR — width/height
    bytes would be read from the wrong offset, so refuse rather than guess."""
    sig = b'\x89PNG\r\n\x1a\n'
    bogus = sig + b'\x00\x00\x00\x0d' + b'iCCP' + b'\x00' * 13
    assert extract_png_dimensions(bogus) == (None, None)


def test_extract_jpeg_dimensions_parses_sof0():
    assert extract_jpeg_dimensions(_minimal_jpeg(800, 600)) == (800, 600)


def test_extract_jpeg_dimensions_rejects_non_jpeg():
    assert extract_jpeg_dimensions(b'\x00' * 20) == (None, None)


def test_extract_jpeg_dimensions_rejects_short_input():
    assert extract_jpeg_dimensions(b'\xff\xd8') == (None, None)


def test_extract_jpeg_dimensions_returns_none_when_no_sof_marker():
    """JPEG with valid SOI + APP0 but no SOF0/SOF2 — dimensions are unknown
    and the parser must say so rather than fall through to garbage."""
    soi = b'\xff\xd8'
    app0_payload = b'JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
    app0 = b'\xff\xe0' + struct.pack('>H', 2 + len(app0_payload)) + app0_payload
    eoi = b'\xff\xd9'
    assert extract_jpeg_dimensions(soi + app0 + eoi) == (None, None)


# -----------------------------------------------------------------
# write_if_changed
# -----------------------------------------------------------------

def test_write_if_changed_creates_file_when_missing(tmp_path):
    target = tmp_path / 'a.bin'
    assert write_if_changed(str(target), b'hello') is True
    assert target.read_bytes() == b'hello'


def test_write_if_changed_skips_when_identical(tmp_path):
    target = tmp_path / 'a.bin'
    target.write_bytes(b'hello')
    mtime_before = target.stat().st_mtime_ns
    assert write_if_changed(str(target), b'hello') is False
    assert target.stat().st_mtime_ns == mtime_before


def test_write_if_changed_overwrites_on_diff(tmp_path):
    target = tmp_path / 'a.bin'
    target.write_bytes(b'old')
    assert write_if_changed(str(target), b'new') is True
    assert target.read_bytes() == b'new'


# -----------------------------------------------------------------
# autounpack_blorb_resources — synthetic blorb
# -----------------------------------------------------------------

def _build_blorb(picts: list[tuple[int, str, bytes]]) -> bytes:
    """Build a minimal Blorb with the given Pict resources.

    Each Pict is (number, chunk_id, data) where chunk_id is e.g. 'PNG '.
    """
    # Layout: 'FORM' + total_len + 'IFRS' + RIdx_chunk + content_chunks
    # RIdx records per resource: usage(4) + number(4) + offset(4 within FORM).

    chunk_offsets: list[int] = []  # absolute file offsets for each pict

    # Compute absolute offsets. Header before content: 12 (FORM/length/IFRS)
    # plus the RIdx chunk (8 + payload, padded to even).
    ridx_payload_len = 4 + 12 * len(picts)
    ridx_total = 8 + ridx_payload_len
    if ridx_total & 1:
        ridx_total += 1
    cursor = 12 + ridx_total

    chunk_blobs: list[bytes] = []
    for (_num, chunk_id, data) in picts:
        chunk_offsets.append(cursor)
        chunk = chunk_id.encode('ascii') + struct.pack('>I', len(data)) + data
        if len(data) & 1:
            chunk += b'\x00'
        chunk_blobs.append(chunk)
        cursor += len(chunk)

    ridx_records = b''
    for ((num, _chunk_id, _data), offset) in zip(picts, chunk_offsets, strict=True):
        ridx_records += b'Pict' + struct.pack('>II', num, offset)
    ridx_payload = struct.pack('>I', len(picts)) + ridx_records
    assert len(ridx_payload) == ridx_payload_len
    ridx_full = b'RIdx' + struct.pack('>I', ridx_payload_len) + ridx_payload
    if len(ridx_payload) & 1:
        ridx_full += b'\x00'

    body = b'IFRS' + ridx_full + b''.join(chunk_blobs)
    return b'FORM' + struct.pack('>I', len(body)) + body


def test_autounpack_extracts_png_pict(tmp_path):
    png = _minimal_png(10, 20)
    blorb = tmp_path / 'demo.gblorb'
    blorb.write_bytes(_build_blorb([(1, 'PNG ', png)]))

    outdir = tmp_path / 'res'
    log = logging.getLogger('test')

    autounpack_blorb_resources(str(blorb), str(outdir), log)

    assert (outdir / 'pict-1.png').read_bytes() == png
    rmap = (outdir / 'resourcemap.json').read_text()
    assert '"image": 1' in rmap
    assert '"width": 10' in rmap
    assert '"height": 20' in rmap


def test_autounpack_is_idempotent(tmp_path):
    png = _minimal_png(4, 4)
    blorb = tmp_path / 'demo.gblorb'
    blorb.write_bytes(_build_blorb([(1, 'PNG ', png)]))

    outdir = tmp_path / 'res'
    log = logging.getLogger('test')

    autounpack_blorb_resources(str(blorb), str(outdir), log)
    mtime1 = (outdir / 'pict-1.png').stat().st_mtime_ns

    autounpack_blorb_resources(str(blorb), str(outdir), log)
    mtime2 = (outdir / 'pict-1.png').stat().st_mtime_ns

    assert mtime1 == mtime2  # write_if_changed kept its hands off


def test_autounpack_skips_when_story_path_is_none(tmp_path):
    log = logging.getLogger('test')
    outdir = tmp_path / 'res'
    autounpack_blorb_resources(None, str(outdir), log)
    assert not outdir.exists() or list(outdir.iterdir()) == []


def test_autounpack_skips_non_blorb_extension(tmp_path):
    z5 = tmp_path / 'game.z5'
    z5.write_bytes(b'irrelevant')
    log = logging.getLogger('test')
    outdir = tmp_path / 'res'
    autounpack_blorb_resources(str(z5), str(outdir), log)
    assert not outdir.exists() or list(outdir.iterdir()) == []


def test_autounpack_handles_missing_file(tmp_path):
    log = logging.getLogger('test')
    outdir = tmp_path / 'res'
    autounpack_blorb_resources(str(tmp_path / 'nope.gblorb'), str(outdir), log)
    assert not outdir.exists() or list(outdir.iterdir()) == []


def test_autounpack_rejects_non_blorb_file(tmp_path):
    bogus = tmp_path / 'fake.gblorb'
    bogus.write_bytes(b'NOT A BLORB AT ALL')
    log = logging.getLogger('test')
    outdir = tmp_path / 'res'
    autounpack_blorb_resources(str(bogus), str(outdir), log)
    assert not outdir.exists() or 'resourcemap.json' not in os.listdir(outdir)


def test_autounpack_extracts_jpeg_pict(tmp_path):
    jpeg = _minimal_jpeg(50, 30)
    blorb = tmp_path / 'demo.gblorb'
    blorb.write_bytes(_build_blorb([(2, 'JPEG', jpeg)]))

    outdir = tmp_path / 'res'
    autounpack_blorb_resources(str(blorb), str(outdir), logging.getLogger('test'))

    assert (outdir / 'pict-2.jpeg').read_bytes() == jpeg
    rmap = (outdir / 'resourcemap.json').read_text()
    assert '"image": 2' in rmap
    assert '"width": 50' in rmap
    assert '"height": 30' in rmap


def test_autounpack_handles_mixed_png_and_jpeg(tmp_path):
    png = _minimal_png(10, 20)
    jpeg = _minimal_jpeg(50, 30)
    blorb = tmp_path / 'demo.gblorb'
    blorb.write_bytes(_build_blorb([(1, 'PNG ', png), (2, 'JPEG', jpeg)]))

    outdir = tmp_path / 'res'
    autounpack_blorb_resources(str(blorb), str(outdir), logging.getLogger('test'))

    assert (outdir / 'pict-1.png').exists()
    assert (outdir / 'pict-2.jpeg').exists()
    rmap = (outdir / 'resourcemap.json').read_text()
    assert '"image": 1' in rmap and '"image": 2' in rmap
