"""Unit tests for the tunnel / DNS / browser helpers in ``cli.py``.

These are the most fragile pieces of the CLI: threads driving subprocess
output, DNS polling that bypasses the OS resolver cache, and a browser
launcher that races a starting server. We fake every external boundary
(``subprocess.Popen``, ``time.sleep``, ``urllib.request.urlopen``,
``webbrowser.open``, ``dns.resolver.Resolver``) so tests are
deterministic and quick.
"""

import logging
import subprocess
import urllib.error

import pytest

from flutterbug_server import cli


# -----------------------------------------------------------------
# URL regex specificity
# -----------------------------------------------------------------

def test_localhostrun_regex_picks_lhr_life_not_localhost_run():
    """localhost.run prints the dashboard URL (.localhost.run) in its
    connect banner before the actual tunnel URL (.lhr.life). We must
    not lock onto the dashboard URL by mistake — that would point
    sharers at an admin page instead of the game."""
    text = (
        'Welcome! visit https://admin.localhost.run for stats.\n'
        'NAME.lhr.life tunneled with tls termination, https://abc-def.lhr.life\n'
    )
    matches = cli._LOCALHOSTRUN_URL_RE.findall(text)
    assert matches == ['https://abc-def.lhr.life']


def test_cloudflared_regex_matches_trycloudflare_subdomain():
    text = '|  https://gentle-orange.trycloudflare.com  |\n'
    match = cli._CLOUDFLARED_URL_RE.search(text)
    assert match is not None
    assert match.group(0) == 'https://gentle-orange.trycloudflare.com'


# -----------------------------------------------------------------
# _start_tunnel: thread-based URL extraction from provider output
# -----------------------------------------------------------------

class _FakePopen:
    """Minimum subset of ``subprocess.Popen`` used by ``_start_tunnel`` and ``_stop_tunnel``."""

    def __init__(self, lines: list[str], returncode: int | None = None) -> None:
        self.stdout = iter(lines)
        self._returncode = returncode
        self.terminated = False
        self.killed = False

    def poll(self):
        return self._returncode

    def terminate(self):
        self.terminated = True
        self._returncode = -15

    def kill(self):
        self.killed = True
        self._returncode = -9

    def wait(self, timeout=None):
        return self._returncode


def test_start_tunnel_extracts_url_from_provider_output(monkeypatch):
    fake = _FakePopen([
        'connecting to localhost.run...\n',
        'NAME.lhr.life tunneled, https://abc-def.lhr.life\n',
    ])
    monkeypatch.setattr(cli.subprocess, 'Popen', lambda *a, **k: fake)

    proc, holder, evt = cli._start_tunnel(
        'localhost.run', ['ssh', '...'],
        cli._LOCALHOSTRUN_URL_RE,
        logging.getLogger('test'),
        'missing')

    assert evt.wait(timeout=5), 'reader thread never set url_event'
    assert holder['url'] == 'https://abc-def.lhr.life'
    assert proc is fake


def test_start_tunnel_raises_systemexit_when_binary_missing(monkeypatch):
    def boom(*a, **k):
        raise FileNotFoundError()
    monkeypatch.setattr(cli.subprocess, 'Popen', boom)

    with pytest.raises(SystemExit) as exc_info:
        cli._start_tunnel(
            'localhost.run', ['ssh', '...'],
            cli._LOCALHOSTRUN_URL_RE,
            logging.getLogger('test'),
            'ssh not found on PATH')
    assert 'ssh not found' in str(exc_info.value)


def test_start_tunnel_leaves_event_unset_when_no_url_in_output(monkeypatch):
    fake = _FakePopen([
        'plain status line\n',
        'another status line\n',
    ])
    monkeypatch.setattr(cli.subprocess, 'Popen', lambda *a, **k: fake)

    proc, holder, evt = cli._start_tunnel(
        'localhost.run', ['ssh', '...'],
        cli._LOCALHOSTRUN_URL_RE,
        logging.getLogger('test'),
        'missing')

    # Reader thread exhausts stdout and exits without ever matching the regex.
    # Brief poll to let it finish iterating, then assert no event.
    assert not evt.wait(timeout=0.5)
    assert holder['url'] is None


# -----------------------------------------------------------------
# _stop_tunnel: terminate / kill escalation
# -----------------------------------------------------------------

def test_stop_tunnel_skips_when_already_exited():
    proc = _FakePopen([], returncode=0)
    cli._stop_tunnel(proc, 'fake', logging.getLogger('test'))
    assert not proc.terminated
    assert not proc.killed


def test_stop_tunnel_terminates_running_process():
    proc = _FakePopen([], returncode=None)
    cli._stop_tunnel(proc, 'fake', logging.getLogger('test'))
    assert proc.terminated
    assert not proc.killed


def test_stop_tunnel_escalates_to_kill_when_terminate_times_out():
    """Worst-case: the tunnel ignores SIGTERM. We must not block forever."""

    class _StubbornPopen:
        def __init__(self):
            self.terminated = False
            self.killed = False

        def poll(self):
            return None

        def terminate(self):
            self.terminated = True

        def wait(self, timeout=None):
            raise subprocess.TimeoutExpired(cmd='x', timeout=timeout)

        def kill(self):
            self.killed = True

    proc = _StubbornPopen()
    cli._stop_tunnel(proc, 'fake', logging.getLogger('test'))
    assert proc.terminated
    assert proc.killed


# -----------------------------------------------------------------
# _wait_for_tunnel_dns: NXDOMAIN polling, success, timeout, recovery
# -----------------------------------------------------------------

def test_wait_for_tunnel_dns_returns_true_when_hostname_resolves(monkeypatch):
    class _OkResolver:
        lifetime = 0
        cache = None

        def resolve(self, hostname, rtype):
            return ['1.2.3.4']

    monkeypatch.setattr(cli.dns.resolver, 'Resolver', _OkResolver)

    assert cli._wait_for_tunnel_dns(
        'https://abc.lhr.life', logging.getLogger('test'))


def test_wait_for_tunnel_dns_short_circuits_when_url_has_no_host(monkeypatch):
    """``urlparse('not-a-url').hostname`` is None — nothing to resolve."""
    called = []

    class _Resolver:
        lifetime = 0
        cache = None

        def resolve(self, *a, **kw):
            called.append(True)
            return []

    monkeypatch.setattr(cli.dns.resolver, 'Resolver', _Resolver)

    assert cli._wait_for_tunnel_dns('not-a-url', logging.getLogger('test'))
    assert called == []


def test_wait_for_tunnel_dns_returns_false_when_nxdomain_persists(monkeypatch):
    class _NxResolver:
        lifetime = 0
        cache = None

        def resolve(self, hostname, rtype):
            raise cli.dns.resolver.NXDOMAIN()

    monkeypatch.setattr(cli.dns.resolver, 'Resolver', _NxResolver)
    monkeypatch.setattr(cli.time, 'sleep', lambda s: None)

    assert not cli._wait_for_tunnel_dns(
        'https://abc.lhr.life', logging.getLogger('test'), timeout=0.05)


def test_wait_for_tunnel_dns_recovers_after_initial_nxdomain(monkeypatch):
    """Real-world case: tunnel URL takes a couple seconds to propagate.
    The third lookup should win."""
    state = {'attempts': 0}

    class _SlowResolver:
        lifetime = 0
        cache = None

        def resolve(self, hostname, rtype):
            state['attempts'] += 1
            if state['attempts'] < 3:
                raise cli.dns.resolver.NXDOMAIN()
            return ['1.2.3.4']

    monkeypatch.setattr(cli.dns.resolver, 'Resolver', _SlowResolver)
    monkeypatch.setattr(cli.time, 'sleep', lambda s: None)

    assert cli._wait_for_tunnel_dns(
        'https://abc.lhr.life', logging.getLogger('test'), timeout=10.0)
    assert state['attempts'] == 3


# -----------------------------------------------------------------
# _open_when_ready: polls server then opens browser
# -----------------------------------------------------------------

class _FakeResp:
    def __init__(self, status: int) -> None:
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def test_open_when_ready_opens_browser_after_first_ok_response(monkeypatch):
    opened: list[str] = []
    monkeypatch.setattr(cli.webbrowser, 'open', lambda u: opened.append(u))
    monkeypatch.setattr(cli.urllib.request, 'urlopen',
                        lambda *a, **k: _FakeResp(200))

    cli._open_when_ready('http://localhost:4000/')
    assert opened == ['http://localhost:4000/']


def test_open_when_ready_gives_up_silently_after_timeout(monkeypatch):
    """If the server never comes up we shouldn't crash the main thread —
    just stop polling. The CLI proceeds without auto-opening."""
    opened: list[str] = []
    monkeypatch.setattr(cli.webbrowser, 'open', lambda u: opened.append(u))

    def always_fail(*a, **k):
        raise urllib.error.URLError('connection refused')

    monkeypatch.setattr(cli.urllib.request, 'urlopen', always_fail)
    monkeypatch.setattr(cli.time, 'sleep', lambda s: None)

    cli._open_when_ready('http://localhost:4000/', timeout_sec=0.05)
    assert opened == []


def test_open_when_ready_keeps_polling_through_5xx(monkeypatch):
    """A 500 response means the process is up but not ready yet — we
    must keep polling rather than open the browser at a broken page."""
    state = {'calls': 0}

    def first_500_then_200(*a, **k):
        state['calls'] += 1
        return _FakeResp(500 if state['calls'] == 1 else 200)

    opened: list[str] = []
    monkeypatch.setattr(cli.webbrowser, 'open', lambda u: opened.append(u))
    monkeypatch.setattr(cli.urllib.request, 'urlopen', first_500_then_200)
    monkeypatch.setattr(cli.time, 'sleep', lambda s: None)

    cli._open_when_ready('http://localhost:4000/', timeout_sec=5.0)
    assert opened == ['http://localhost:4000/']
    assert state['calls'] == 2
