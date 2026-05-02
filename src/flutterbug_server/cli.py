"""Command-line entry point for Flutterbug."""

import argparse
import logging
import os
import re
import secrets
import shlex
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from urllib.parse import urlparse

import dns.exception
import dns.resolver

from . import __version__ as FLUTTERBUG_VERSION


def _open_when_ready(url: str, timeout_sec: float = 15.0):
    """Wait for the server to respond, then open a browser tab once."""
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1.0) as resp:
                if 200 <= resp.status < 500:
                    webbrowser.open(url)
                    return
        except (urllib.error.URLError, TimeoutError, OSError):
            pass
        time.sleep(0.25)


# URL patterns each provider prints to stdout/stderr. cloudflared prints
# inside an ASCII banner; localhost.run prints
#   "NAME.lhr.life tunneled with tls termination, https://NAME.lhr.life".
# Only .lhr.life is the actual tunnel host — .localhost.run shows up
# earlier in the connect banner pointing at the admin/dashboard page,
# and we must not lock onto that one.
_CLOUDFLARED_URL_RE = re.compile(r'https://[a-z0-9-]+\.trycloudflare\.com')
_LOCALHOSTRUN_URL_RE = re.compile(r'https://[a-z0-9-]+\.lhr\.life')


def _start_tunnel(
    provider_name: str,
    command: list[str],
    url_re: re.Pattern,
    log: logging.Logger,
    missing_msg: str,
    banner_done: threading.Event | None = None,
):
    """Spawn a tunnel subprocess and watch its output for the public URL.

    Returns ``(proc, url_holder, url_event)``. A daemon reader thread
    relays the subprocess's combined stdout/stderr to the log, and
    sets ``url_event`` once ``url_re`` matches a line.
    """
    log.info(
        'Launching %s tunnel: %s',
        provider_name, shlex.join(command))
    try:
        proc = subprocess.Popen(
            command,
            # Detach stdin from our TTY. Critical for the ssh provider:
            # if ssh sees a TTY on stdin it asks the server for a remote
            # PTY, which puts the LOCAL terminal in raw mode. In raw mode
            # Ctrl-C is sent as a byte over the SSH channel instead of as
            # SIGINT to our process group, so the first Ctrl-C only kills
            # ssh and the second is needed to stop uvicorn. As a bonus,
            # localhost.run also skips its decorative ANSI/QR-code banner
            # when no PTY is requested, so the log stays readable.
            # Cloudflared doesn't care either way.
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
    except FileNotFoundError:
        log.error(missing_msg)
        raise SystemExit(1) from None

    url_holder: dict = {'url': None}
    url_event = threading.Event()
    last_activity = [time.time()]
    banner_printed = [False]
    banner_lock = threading.Lock()

    def print_banner():
        with banner_lock:
            if banner_printed[0] or url_holder['url'] is None:
                return
            banner_printed[0] = True
        log.info('=' * 72)
        log.info('  Public tunnel URL: %s', url_holder['url'])
        log.info('  Share this with friends to play together.')
        log.info('=' * 72)
        if banner_done is not None:
            banner_done.set()

    def banner_thread():
        # Defer the user-facing banner until the provider's connect
        # chatter (welcome text, ASCII banner, status lines) has quieted
        # down for QUIET seconds, so the banner ends up at the bottom of
        # the visible scrollback instead of buried mid-stream. Hard cap
        # at MAX_WAIT in case a provider keeps emitting heartbeat lines
        # forever — we'd rather print the banner with some chatter
        # underneath than never print it at all.
        QUIET = 2.0
        MAX_WAIT = 10.0
        if not url_event.wait(timeout=60):
            return
        deadline = time.time() + MAX_WAIT
        while time.time() < deadline:
            if time.time() - last_activity[0] >= QUIET:
                break
            time.sleep(0.25)
        print_banner()

    def reader():
        assert proc.stdout is not None  # stdout=PIPE above
        for line in proc.stdout:
            line = line.rstrip()
            if line:
                log.debug('[%s] %s', provider_name, line)
                last_activity[0] = time.time()
            if url_holder['url'] is None:
                match = url_re.search(line)
                if match:
                    url_holder['url'] = match.group(0)
                    last_activity[0] = time.time()
                    url_event.set()
        # Provider closed its pipe; surface the banner now if we
        # haven't already (covers the "subprocess died fast" case).
        print_banner()

    threading.Thread(target=banner_thread, daemon=True).start()
    threading.Thread(target=reader, daemon=True).start()
    return proc, url_holder, url_event


def _start_localhostrun_tunnel(
        port: int, log: logging.Logger,
        banner_done: threading.Event | None = None):
    """Open an ssh reverse tunnel to localhost.run (no account required).

    ServerAliveInterval=60 is localhost.run's documented keepalive
    recommendation: SSH sends an empty packet every 60s of idle time,
    which both wards off NAT/router idle timeouts and lets us notice
    quickly if the route breaks. ExitOnForwardFailure=yes makes ssh
    exit immediately if the remote :80 forward can't be set up, so a
    silently-broken tunnel doesn't sit there pretending to work.
    StrictHostKeyChecking=accept-new auto-trusts on first connect (and
    still fails on a key mismatch later) so the script never blocks
    for an interactive yes/no prompt.
    """
    return _start_tunnel(
        'localhost.run',
        [
            'ssh',
            '-o', 'ServerAliveInterval=60',
            '-o', 'StrictHostKeyChecking=accept-new',
            '-o', 'ExitOnForwardFailure=yes',
            '-R', f'80:localhost:{port}',
            'nokey@localhost.run',
        ],
        _LOCALHOSTRUN_URL_RE,
        log,
        "ssh not found on PATH. Install OpenSSH and try again.",
        banner_done=banner_done)


def _start_cloudflared_tunnel(
        port: int, log: logging.Logger,
        banner_done: threading.Event | None = None):
    """Spawn ``cloudflared tunnel --url http://localhost:PORT``."""
    return _start_tunnel(
        'cloudflared',
        ['cloudflared', 'tunnel', '--url', f'http://localhost:{port}'],
        _CLOUDFLARED_URL_RE,
        log,
        "cloudflared not found on PATH. Install it (e.g. "
        "'brew install cloudflared') and try again.",
        banner_done=banner_done)


def _wait_for_tunnel_dns(url: str, log: logging.Logger, timeout: float = 30.0) -> bool:
    """Poll authoritative DNS until the tunnel's hostname resolves.

    dnspython sends UDP queries straight to the nameservers in
    /etc/resolv.conf; it does NOT go through getaddrinfo, so it
    bypasses macOS's mDNSResponder cache entirely. That matters
    because mDNSResponder caches NXDOMAIN — if the browser's first
    lookup happens before the tunnel's record propagates, Safari
    will keep showing 'can't find the server' until the negative
    entry expires. Polling here delays the browser launch until DNS
    is actually live, so mDNSResponder's first lookup sees a
    positive answer and caches that instead.
    """
    hostname = urlparse(url).hostname
    if not hostname:
        return True

    resolver = dns.resolver.Resolver()
    resolver.lifetime = 2.0
    resolver.cache = None
    # Skip loopback stub resolvers (e.g. systemd-resolved at 127.0.0.53).
    # dnspython queries them directly, bypassing getaddrinfo — which is great
    # for macOS's mDNSResponder, but on Linux those stubs have their own
    # NXDOMAIN cache that defeats the poll just as badly. Supplement with
    # real upstream servers so the check always reaches authoritative DNS.
    upstream = ['1.1.1.1', '8.8.8.8']
    real_ns = [ns for ns in resolver.nameservers if not ns.startswith('127.')]
    resolver.nameservers = real_ns + upstream
    deadline = time.time() + timeout
    last_logged = 0.0
    while time.time() < deadline:
        try:
            resolver.resolve(hostname, 'A')
            return True
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
            pass
        except dns.exception.DNSException as ex:
            log.debug('DNS query for %s failed: %r', hostname, ex)
        now = time.time()
        if now - last_logged >= 5.0:
            log.debug('Waiting for DNS to propagate for %s...', hostname)
            last_logged = now
        time.sleep(1.0)
    return False


def _stop_tunnel(proc: subprocess.Popen, name: str, log: logging.Logger):
    """Best-effort SIGTERM / SIGKILL escalation for the tunnel subprocess."""
    if proc.poll() is not None:
        return
    log.info('Stopping %s tunnel.', name)
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


_LEVEL_COLORS = {
    logging.DEBUG:    ('\x1b[32m', 4),        # green,     "DEBUG:    "
    logging.INFO:     ('\x1b[32m', 5),        # green,     "INFO:     "
    logging.WARNING:  ('\x1b[33m', 2),        # yellow,    "WARNING:  "
    logging.ERROR:    ('\x1b[31m', 4),        # red,       "ERROR:    "
    logging.CRITICAL: ('\x1b[1m\x1b[31m', 1), # bold red, "CRITICAL: "
}
_ANSI_RESET = '\x1b[0m'


class _ColoredFormatter(logging.Formatter):
    """Pre-uvicorn log formatter matching uvicorn's colored output style."""

    def format(self, record):
        use_colors = hasattr(sys.stderr, 'isatty') and sys.stderr.isatty()
        color, spaces = _LEVEL_COLORS.get(record.levelno, ('', 1))
        if use_colors:
            prefix = f"{color}{record.levelname}{_ANSI_RESET}:" + ' ' * spaces
        else:
            prefix = f"{record.levelname}:" + ' ' * spaces
        return prefix + record.getMessage()


def main():
    parser = argparse.ArgumentParser(
        description=(
            f'Flutterbug {FLUTTERBUG_VERSION}: '
            f'collaborative parser IF web server.'),
    )
    parser.add_argument(
        '--version', action='version',
        version=f'%(prog)s {FLUTTERBUG_VERSION}')
    parser.add_argument(
        '--port', type=int, default=4000,
        help='port number to listen on (default: 4000)')
    parser.add_argument(
        '--verbose', action='store_true',
        help='show tunnel provider output, HTTP access logs, and other diagnostic detail')
    parser.add_argument(
        '--debug', action='store_true',
        help='enable debug logging')
    parser.add_argument(
        '--command',
        help='shell command to run a RemGlk game')
    parser.add_argument(
        '--story', metavar='PATH',
        help='story file path. Without --command, expanded as: emglken PATH --rem. '
             'With --command, used for IFDB metadata + Blorb resource extraction.')
    parser.add_argument(
        '--mode', choices=('flex', 'fixed'), default='flex',
        help='flex (default): players can have different browser width/height '
             'than others, and can change font sizes. '
             'fixed: all players use same browser width/height; use for games '
             'with nonstandard windows.')
    parser.add_argument(
        '--status-cols', type=int, default=72, metavar='N',
        help='72 (default) in flex mode, sets the status window width in columns.')
    parser.add_argument(
        '--gidebug', action='store_true',
        help='activate the GlkOte debug console')
    parser.add_argument(
        '--jsondebug', action='store_true',
        help='log JSON messages in/out for websocket and game transport debugging')
    parser.add_argument(
        '--open', action='store_true',
        help='open the app URL in the default web browser once server is ready')
    tunnel_group = parser.add_mutually_exclusive_group()
    tunnel_group.add_argument(
        '--tunnel', action='store_true',
        help='expose the server publicly via a localhost.run ssh tunnel.')

    tunnel_group.add_argument(
        '--cloudflare', action='store_true',
        help='expose via cloudflared tunnel instead of localhost.run.')
    parser.add_argument(
        '--secret', default=None,
        help='secret key for signing session cookies. If set, users stay '
             'signed in across server restarts and won\'t need to re-enter '
             'the password. If omitted, a random key is used and all '
             'sessions are invalidated whenever the server restarts.')
    auth_group = parser.add_mutually_exclusive_group(required=True)
    auth_group.add_argument(
        '--password', default=None,
        help='players must enter this password on the sign-in page')
    auth_group.add_argument(
        '--no-password', action='store_true',
        help='allow anyone who reaches the URL to sign in. Only safe on a '
             'trusted local network.')
    args = parser.parse_args()

    # Use a dedicated 'flutterbug' logger with its own handler so --verbose
    # controls our diagnostic output independently of uvicorn's log level.
    # propagate=False ensures uvicorn's dictConfig call (which reconfigures
    # the 'uvicorn.*' hierarchy and root logger) can't affect our output.
    _handler = logging.StreamHandler()
    _handler.setFormatter(_ColoredFormatter())
    log = logging.getLogger('flutterbug')
    log.addHandler(_handler)
    log.propagate = False
    log.setLevel(logging.DEBUG if args.verbose else logging.INFO)

    if not args.command and not args.story:
        parser.error('Pass --story PATH and/or --command CMD.')

    if args.status_cols < 1:
        parser.error('--status-cols must be a positive integer.')

    if args.no_password:
        log.warning(
            'Running with --no-password: anyone who reaches the URL can '
            'sign in. Only safe on a trusted local network.')

    if args.story:
        args.story_path = os.path.abspath(args.story)
        if not os.path.isfile(args.story_path):
            parser.error(f'Story file not found: {args.story_path}')
        if not args.command:
            args.command = f'emglken {shlex.quote(args.story_path)} --rem'
    else:
        args.story_path = None

    if args.secret is None:
        args.secret = secrets.token_hex(32)
        log.info(
            'No --secret provided; users will need to sign in again if '
            'the server restarts.')

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as _s:
        if _s.connect_ex(('127.0.0.1', args.port)) == 0:
            log.error('Port %d is already in use. Choose a different port with --port.', args.port)
            raise SystemExit(1)

    log.info('Resolved game command: %s', args.command)

    import uvicorn
    from .app import create_app
    app = create_app(args)

    tunnel_proc = None
    tunnel_name = None
    tunnel_url_holder: dict = {'url': None}
    tunnel_url_event: threading.Event | None = None
    tunnel_banner_done: threading.Event | None = None
    if args.tunnel:
        log.warning(
            'As of 2026-05-02, localhost.run tunnels have been unreliable '
            '— the service may be having problems. If the tunnel '
            'fails to come up or DNS never propagates, try --cloudflare '
            'instead.')
        tunnel_name = 'localhost.run'
        tunnel_banner_done = threading.Event()
        tunnel_proc, tunnel_url_holder, tunnel_url_event = (
            _start_localhostrun_tunnel(args.port, log, tunnel_banner_done))
    elif args.cloudflare:
        tunnel_name = 'cloudflared'
        tunnel_banner_done = threading.Event()
        tunnel_proc, tunnel_url_holder, tunnel_url_event = (
            _start_cloudflared_tunnel(args.port, log, tunnel_banner_done))

    tunnel_failed = threading.Event()

    if args.open:
        local_url = f'http://localhost:{args.port}/'
        if tunnel_url_event is not None:
            def _open_tunneled():
                # Poll for the tunnel URL, logging progress every
                # POLL_INTERVAL seconds. If we hit OPEN_TIMEOUT without
                # a URL, signal failure and SIGINT the main process so
                # uvicorn shuts down cleanly (which runs the finally
                # block that kills the tunnel subprocess).
                POLL_INTERVAL = 5.0
                OPEN_TIMEOUT = 30.0
                deadline = time.time() + OPEN_TIMEOUT
                while True:
                    remaining = deadline - time.time()
                    if remaining <= 0:
                        break
                    if tunnel_url_event.wait(timeout=min(POLL_INTERVAL, remaining)):
                        # Don't HTTP-poll the tunnel URL — a fresh quick
                        # tunnel often 502s or returns the provider's
                        # cold-start page for a few seconds, and a
                        # pre-flight that demands 2xx/3xx will give up
                        # too early. We DO wait on DNS though, otherwise
                        # Safari's first lookup may NXDOMAIN and macOS's
                        # mDNSResponder caches that negative answer.
                        url = tunnel_url_holder['url']
                        if tunnel_banner_done is not None:
                            tunnel_banner_done.wait(timeout=15.0)
                        log.info(
                            'Waiting 3 seconds for tunnel DNS to propagate '
                            'before opening browser.')
                        time.sleep(3.0)
                        if _wait_for_tunnel_dns(url, log, timeout=30.0):
                            log.info('Opening tunnel URL in browser: %s', url)
                            webbrowser.open(url)
                        else:
                            log.error(
                                'DNS for %s did not resolve in 30s; not '
                                'auto-opening (would risk poisoning the OS '
                                'DNS cache). The URL above is still valid '
                                'once DNS catches up.', url)
                        return
                    log.debug(
                        'Waiting for tunnel... (%ds elapsed)',
                        int(OPEN_TIMEOUT - max(0, deadline - time.time())))
                log.error(
                    'Tunnel URL did not appear within %ds; shutting down.',
                    int(OPEN_TIMEOUT))
                tunnel_failed.set()
                os.kill(os.getpid(), signal.SIGINT)
            th = threading.Thread(target=_open_tunneled, daemon=True)
        else:
            th = threading.Thread(
                target=_open_when_ready, args=(local_url,), daemon=True)
        th.start()

    try:
        uvicorn.run(
            app,
            host='0.0.0.0',
            port=args.port,
            log_level='debug' if args.debug else 'info',
            access_log=args.verbose,
        )
    finally:
        if tunnel_proc is not None:
            _stop_tunnel(tunnel_proc, tunnel_name or 'tunnel', log)

    if tunnel_failed.is_set():
        raise SystemExit(1)


if __name__ == '__main__':
    main()
