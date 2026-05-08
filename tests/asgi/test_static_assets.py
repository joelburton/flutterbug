"""Verify the browser assets play.html references are actually served.

Catches the failure mode where a published wheel (or a clone) is missing
the esbuild output: the user sees a /play page that hangs at "loading"
because the browser fetches an empty bundle. CI runs `pip install -e .`
from a clean checkout, so if `play.bundle.js` isn't committed (or the
build step regressed), this test fails immediately.
"""

import re

# /play.bundle.js?v=abc123  →  /play.bundle.js. The cache-buster query
# string is added by the template, but StaticFiles serves the path
# regardless of query, so we strip it for the GET.
STATIC_REF_RE = re.compile(r'/static/[^?"\s]+')


def test_play_bundle_is_served(client):
    r = client.get('/static/play.bundle.js')
    assert r.status_code == 200
    assert len(r.content) > 1000, 'bundle implausibly small'


def test_asyncglk_css_is_served(client):
    r = client.get('/static/asyncglk-css/glkote.css')
    assert r.status_code == 200


def test_every_static_ref_in_play_html_resolves(signed_in_client):
    """Each /static/... URL the rendered play page references must serve 200."""
    r = signed_in_client.get('/play')
    assert r.status_code == 200
    refs = sorted(set(STATIC_REF_RE.findall(r.text)))
    assert refs, 'play.html should reference at least one /static/ asset'
    for ref in refs:
        rr = signed_in_client.get(ref)
        assert rr.status_code == 200, (
            f'{ref} returned {rr.status_code}; '
            f'play.html references an asset that is not present')
