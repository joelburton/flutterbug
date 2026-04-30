"""IFDB title/author/cover lookup for the index page."""

from logging import Logger
from typing import Optional


def lookup_story_metadata(story_path: Optional[str], log: Logger) -> Optional[dict]:
    """Best-effort IFID/IFDB lookup. Returns None on any failure or when
    *story_path* is None (caller didn't pass --story)."""
    if not story_path:
        return None

    try:
        from babel_if import BabelStory
        from ifdb import IFDBClient
    except Exception as ex:
        log.debug('Story metadata lookup unavailable: %s', ex)
        return None

    try:
        story = BabelStory(story_path)
    except Exception as ex:
        log.debug('Unable to read story metadata from %s: %s', story_path, ex)
        return None

    ifid = getattr(story, 'ifid', None)
    if not ifid:
        log.debug('No IFID found for story file: %s', story_path)
        return None

    try:
        game = IFDBClient().get_game(ifid=ifid)
    except Exception as ex:
        log.debug('IFDB lookup failed for IFID %s: %s', ifid, ex)
        return None

    if not game:
        return None

    title = getattr(game, 'title', None)
    author = getattr(game, 'author', None)
    cover_art_url = getattr(game, 'cover_art_url', None)
    if not title and not author and not cover_art_url:
        return None

    log.info('Loaded story metadata for IFID %s', ifid)
    return {
        'title': title,
        'author': author,
        'cover_art_url': cover_art_url,
        'ifid': ifid,
    }
