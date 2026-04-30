"""Unit tests for SnapshotState.

The snapshot is what makes the shared room work: a late joiner can't
re-init the VM without yanking the layout out from under everyone, so
we replay an accumulated synthetic update instead. These tests pin
the apply/build round-trip behaviour the room depends on.
"""

from flutterbug_server.snapshot import BUFFER_LINE_CAP, SnapshotState


def test_initial_state_has_no_output():
    s = SnapshotState()
    assert s.build_update() is None
    assert not s.has_output


def test_pre_gen_update_passes_through_verbatim():
    # Some VMs emit an early update with no `gen` field. We treat the room
    # as not yet tracking deltas and just pass the raw payload through.
    s = SnapshotState()
    raw = {'type': 'update', 'foo': 'bar'}
    s.apply(raw)
    out = s.build_update()
    assert out == raw
    # And it's a copy, not the same dict — caller mutations must not bleed.
    assert out is not raw


def test_first_update_with_gen_sets_windows_and_buffer_text():
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 1,
        'windows': [{'id': 1, 'type': 'buffer'}],
        'content': [{'id': 1, 'text': [{'content': [{'text': 'Hello'}]}]}],
    })
    out = s.build_update()
    assert out is not None
    assert out['type'] == 'update'
    assert out['gen'] == 1
    assert out['windows'] == [{'id': 1, 'type': 'buffer'}]
    assert len(out['content']) == 1
    assert out['content'][0]['id'] == 1
    assert out['content'][0]['text'][0]['content'] == [{'text': 'Hello'}]


def test_buffer_text_accumulates_across_updates():
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 1,
        'windows': [{'id': 1, 'type': 'buffer'}],
        'content': [{'id': 1, 'text': [{'content': [{'text': 'A'}]}]}],
    })
    s.apply({
        'type': 'update', 'gen': 2,
        'content': [{'id': 1, 'text': [{'content': [{'text': 'B'}]}]}],
    })
    text = s.build_update()['content'][0]['text']
    assert len(text) == 2
    assert text[0]['content'] == [{'text': 'A'}]
    assert text[1]['content'] == [{'text': 'B'}]


def test_buffer_clear_drops_prior_text():
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 1,
        'windows': [{'id': 1, 'type': 'buffer'}],
        'content': [{'id': 1, 'text': [{'content': [{'text': 'old'}]}]}],
    })
    s.apply({
        'type': 'update', 'gen': 2,
        'content': [{'id': 1, 'clear': True,
                     'text': [{'content': [{'text': 'new'}]}]}],
    })
    text = s.build_update()['content'][0]['text']
    assert len(text) == 1
    assert text[0]['content'] == [{'text': 'new'}]


def test_grid_lines_are_addressed_by_slot():
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 1,
        'windows': [{'id': 1, 'type': 'grid', 'gridheight': 3}],
        'content': [{'id': 1, 'lines': [
            {'line': 0, 'content': [{'text': 'top'}]},
            {'line': 2, 'content': [{'text': 'bottom'}]},
        ]}],
    })
    lines = s.build_update()['content'][0]['lines']
    assert len(lines) == 3
    assert lines[0]['content'] == [{'text': 'top'}]
    assert lines[2]['content'] == [{'text': 'bottom'}]
    # Slot 1 was untouched and gets a placeholder.
    assert lines[1] == {'line': 1}


def test_grid_line_overwrite_replaces_in_place():
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 1,
        'windows': [{'id': 1, 'type': 'grid', 'gridheight': 2}],
        'content': [{'id': 1, 'lines': [
            {'line': 0, 'content': [{'text': 'old'}]},
        ]}],
    })
    s.apply({
        'type': 'update', 'gen': 2,
        'content': [{'id': 1, 'lines': [
            {'line': 0, 'content': [{'text': 'new'}]},
        ]}],
    })
    lines = s.build_update()['content'][0]['lines']
    assert lines[0]['content'] == [{'text': 'new'}]


def test_window_removal_drops_associated_content():
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 1,
        'windows': [
            {'id': 1, 'type': 'buffer'},
            {'id': 2, 'type': 'grid', 'gridheight': 1},
        ],
        'content': [
            {'id': 1, 'text': [{'content': [{'text': 'buf'}]}]},
            {'id': 2, 'lines': [{'line': 0, 'content': [{'text': 'grid'}]}]},
        ],
    })
    s.apply({
        'type': 'update', 'gen': 2,
        'windows': [{'id': 1, 'type': 'buffer'}],
    })
    out = s.build_update()
    # The vanished grid window's content must not leak into the synthetic update.
    assert all(c['id'] == 1 for c in out.get('content', []))


def test_grid_resize_smaller_truncates_rows():
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 1,
        'windows': [{'id': 1, 'type': 'grid', 'gridheight': 5}],
        'content': [{'id': 1, 'lines': [
            {'line': 0, 'content': [{'text': '0'}]},
            {'line': 4, 'content': [{'text': '4'}]},
        ]}],
    })
    s.apply({
        'type': 'update', 'gen': 2,
        'windows': [{'id': 1, 'type': 'grid', 'gridheight': 2}],
    })
    lines = s.build_update()['content'][0]['lines']
    assert len(lines) == 2


def test_input_state_replaces_each_update():
    s = SnapshotState()
    s.apply({'type': 'update', 'gen': 1, 'input': [{'id': 1, 'type': 'line'}]})
    s.apply({'type': 'update', 'gen': 2, 'input': [{'id': 1, 'type': 'char'}]})
    assert s.build_update()['input'][0]['type'] == 'char'


def test_current_gen_tracks_latest():
    s = SnapshotState()
    s.apply({'type': 'update', 'gen': 7})
    assert s.current_gen == 7
    s.apply({'type': 'update', 'gen': 12})
    assert s.current_gen == 12


def test_apply_is_isolated_from_caller_mutations():
    # The snapshot must hold its own copy — if the room mutates the
    # outgoing dict (e.g. _add_missing_image_urls) after a broadcast,
    # earlier snapshot state mustn't change.
    s = SnapshotState()
    payload = {
        'type': 'update', 'gen': 1,
        'windows': [{'id': 1, 'type': 'buffer'}],
        'content': [{'id': 1, 'text': [{'content': [{'text': 'A'}]}]}],
    }
    s.apply(payload)
    payload['content'][0]['text'][0]['content'][0]['text'] = 'MUTATED'
    captured = s.build_update()['content'][0]['text'][0]['content'][0]['text']
    assert captured == 'A'


def test_build_update_returns_independent_copy():
    # Two callers (two clients) get separate dicts, so mutating one
    # doesn't affect the other.
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 1,
        'windows': [{'id': 1, 'type': 'buffer'}],
        'content': [{'id': 1, 'text': [{'content': [{'text': 'A'}]}]}],
    })
    a = s.build_update()
    b = s.build_update()
    a['windows'][0]['id'] = 999
    assert b['windows'][0]['id'] == 1


def test_reset_clears_everything():
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 5,
        'windows': [{'id': 1, 'type': 'buffer'}],
        'content': [{'id': 1, 'text': [{'content': [{'text': 'x'}]}]}],
        'input': [{'id': 1, 'type': 'line'}],
        'timer': 1000,
    })
    s.reset()
    assert s.build_update() is None
    assert s.current_gen is None
    assert s.latest_output is None
    assert s.windows == []
    assert s.bufcontent == {}
    assert s.gridcontent == {}
    assert s.input is None
    assert s.timer is None
    assert not s.has_output


def test_reset_then_reapply_starts_fresh():
    # Models the bug-1 scenario: VM closes (reset), a new player triggers
    # a relaunch, the new VM emits a fresh init at gen=1.
    s = SnapshotState()
    s.apply({'type': 'update', 'gen': 7,
             'windows': [{'id': 1, 'type': 'buffer'}]})
    s.reset()
    s.apply({'type': 'update', 'gen': 1,
             'windows': [{'id': 2, 'type': 'buffer'}]})
    out = s.build_update()
    assert out['gen'] == 1
    assert out['windows'] == [{'id': 2, 'type': 'buffer'}]


def test_buffer_text_caps_per_window():
    # A long-running game pours unbounded paragraphs into the buffer; the
    # snapshot must drop oldest lines once the cap is exceeded so memory
    # (and replay cost for late joiners) stays bounded.
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 1,
        'windows': [{'id': 1, 'type': 'buffer'}],
    })
    overflow = BUFFER_LINE_CAP + 250
    for i in range(overflow):
        s.apply({
            'type': 'update', 'gen': i + 2,
            'content': [{'id': 1, 'text': [{'content': [{'text': str(i)}]}]}],
        })
    text = s.build_update()['content'][0]['text']
    assert len(text) == BUFFER_LINE_CAP
    # Newest line is the last we sent.
    assert text[-1]['content'] == [{'text': str(overflow - 1)}]
    # Oldest survivor is the (overflow - cap)-th paragraph.
    assert text[0]['content'] == [{'text': str(overflow - BUFFER_LINE_CAP)}]


def test_content_for_unknown_window_is_ignored():
    # If a content entry refers to a window we don't know about (e.g. the
    # VM dropped it before this update arrived), we silently skip it
    # rather than crashing.
    s = SnapshotState()
    s.apply({
        'type': 'update', 'gen': 1,
        'windows': [{'id': 1, 'type': 'buffer'}],
        'content': [
            {'id': 1, 'text': [{'content': [{'text': 'ok'}]}]},
            {'id': 99, 'text': [{'content': [{'text': 'orphan'}]}]},
        ],
    })
    out = s.build_update()
    assert all(c['id'] == 1 for c in out['content'])
