"""Flutterbug FastAPI app: routes, sessions, lifespan.

Bulk of the logic (room state machine, snapshot replay, blorb extraction,
IFDB lookup) lives in the sibling modules — this file is HTTP/WS plumbing.
"""

import glob
import logging
import os
import os.path
import secrets
import tempfile
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Annotated, Optional
from urllib.parse import urlparse

from fastapi import FastAPI, Form, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from jinja2 import Environment, FileSystemLoader, select_autoescape
from starlette.middleware.sessions import SessionMiddleware

from .blorb import autounpack_blorb_resources
from .metadata import lookup_story_metadata
from .room import SharedRoom

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))

AVAILABLE_THEMES = {
    'flutterbug': 'theme-flutterbug.css',
    'nocturne': 'theme-nocturne.css',
}

# Hostname suffixes for tunnel providers we ship support for. A signed-in
# player's browser will set Origin to the tunnel host, but tunnels often
# rewrite the Host header to localhost upstream, so a naive Origin==Host
# check rejects legitimate tunneled connections. These suffixes let those
# through without opening up arbitrary cross-origin WS clients.
TUNNEL_ORIGIN_SUFFIXES = ('.trycloudflare.com', '.lhr.life')


def _is_allowed_origin(origin: Optional[str], host: Optional[str]) -> bool:
    """Validate a websocket Origin header against the request's Host.

    Browsers always send Origin on WebSocket connections; non-browser
    clients (test fixtures, scripted tools) don't. A missing Origin is
    therefore not a CSRF vector and is permitted. When present we accept:
      - localhost / 127.0.0.1 on any port,
      - hostnames whose suffix matches a known tunnel provider, or
      - an exact hostname match against the request's Host header
        (covers reverse proxies that preserve Host).
    Everything else is refused so a malicious page can't piggyback on a
    signed-in user's session cookie to drive the shared VM.
    """
    if not origin:
        return True
    parsed = urlparse(origin)
    h = parsed.hostname
    if not h:
        return False
    if h in ('localhost', '127.0.0.1'):
        return True
    if any(h.endswith(suffix) for suffix in TUNNEL_ORIGIN_SUFFIXES):
        return True
    if host:
        host_h = host.split(':', 1)[0]
        if h == host_h:
            return True
    return False


def create_app(settings) -> FastAPI:
    log = logging.getLogger('uvicorn.error')
    static_dir = os.path.join(MODULE_DIR, 'static')
    template_dir = os.path.join(MODULE_DIR, 'templates')
    asset_version = secrets.token_hex(4)
    resource_url_prefix = '/static/resource'
    resource_tmpdir = tempfile.TemporaryDirectory(prefix='flutterbug-resource-')
    resource_dir = resource_tmpdir.name
    launch_dir = os.getcwd()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.settings = settings
        app.state.log = log
        app.state.launch_dir = launch_dir
        app.state.story_metadata = lookup_story_metadata(settings.story_path, log)
        app.state.room = SharedRoom(
            settings.command,
            log,
            cwd=launch_dir,
            jsondebug=settings.jsondebug,
            resource_dir=resource_dir,
            resource_url_prefix=resource_url_prefix,
            vm_factory=getattr(settings, 'vm_factory', None),
            mode=getattr(settings, 'mode', 'flex'),
            status_cols=getattr(settings, 'status_cols', 72),
        )
        autounpack_blorb_resources(settings.story_path, resource_dir, log)
        try:
            yield
        finally:
            app.state.room.close()
            resource_tmpdir.cleanup()

    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.secret,
        max_age=864000,
        same_site='lax',
        https_only=False,
    )

    jinja_env = Environment(
        loader=FileSystemLoader(str(template_dir)),
        autoescape=select_autoescape(['html', 'xml']),
    )

    def render_template(name: str, context: dict) -> str:
        template = jinja_env.get_template(name)
        return template.render(**context)

    def build_main_context(sessionid):
        themes = [
            {'key': k, 'label': k.capitalize()}
            for k in sorted(AVAILABLE_THEMES)
        ]
        return {
            'sessionid': sessionid,
            'themes': themes,
            'game_info': getattr(app.state, 'story_metadata', None),
            'password_required': getattr(settings, 'password', None) is not None,
            'asset_version': asset_version,
        }

    def password_ok(provided: Optional[str]) -> bool:
        required = getattr(settings, 'password', None)
        if required is None:
            return True
        if provided is None:
            return False
        return secrets.compare_digest(
            provided.encode('utf-8'), required.encode('utf-8'))

    app.mount(resource_url_prefix, StaticFiles(directory=resource_dir), name='resource')
    app.mount('/static', StaticFiles(directory=static_dir), name='static')

    @app.get('/')
    async def main_get(request: Request):
        sessionid = request.session.get('sessionid')
        html = render_template('main.html', build_main_context(sessionid))
        return HTMLResponse(html)

    @app.post('/')
    async def main_post(
        request: Request,
        signin: Annotated[Optional[str], Form()] = None,
        signout: Annotated[Optional[str], Form()] = None,
        password: Annotated[Optional[str], Form()] = None,
    ):
        if signin is not None:
            if not password_ok(password):
                ctx = build_main_context(None)
                ctx['password_error'] = True
                return HTMLResponse(
                    render_template('main.html', ctx), status_code=401)
            sessionid = secrets.token_hex(16)
            request.session['sessionid'] = sessionid
        elif signout is not None:
            request.session.clear()
            sessionid = None
        else:
            raise HTTPException(status_code=400, detail='Unknown form button')
        html = render_template('main.html', build_main_context(sessionid))
        return HTMLResponse(html)

    @app.get('/play')
    async def play_get(
        request: Request,
        name: str = Query(''),
        theme: str = Query('flutterbug'),
    ):
        sessionid = request.session.get('sessionid')
        if not sessionid:
            return RedirectResponse(url='/', status_code=303)

        playername = name.strip() or f'Player-{sessionid[:6]}'
        themename = theme.strip().lower()
        if themename not in AVAILABLE_THEMES:
            themename = 'flutterbug'

        html = render_template('play.html', {
            'gidebug': settings.gidebug,
            'playername': playername,
            'themename': themename,
            'theme_css': AVAILABLE_THEMES[themename],
            'asset_version': asset_version,
            'mode': getattr(settings, 'mode', 'flex'),
        })
        return HTMLResponse(html)

    @app.get('/savefiles')
    async def savefiles_get(request: Request):
        sessionid = request.session.get('sessionid')
        if not sessionid:
            raise HTTPException(status_code=403, detail='You are not logged in')

        files = []
        for path in glob.glob(os.path.join(launch_dir, '*.glksave')):
            try:
                stat = os.stat(path)
            except OSError:
                continue
            mtime = stat.st_mtime
            files.append({
                'name': os.path.basename(path),
                'mtime': mtime,
                'modified': datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S'),
            })
        files.sort(key=lambda val: val['mtime'], reverse=True)
        return JSONResponse({'files': files})

    @app.websocket('/websocket')
    async def ws_endpoint(websocket: WebSocket, name: str = Query('')):
        origin = websocket.headers.get('origin')
        host = websocket.headers.get('host')
        if not _is_allowed_origin(origin, host):
            log.warning(
                'Rejecting websocket from origin=%r host=%r', origin, host)
            await websocket.close(code=1008)
            return

        session = websocket.scope.get('session', {})
        sessionid = session.get('sessionid')
        if not sessionid:
            await websocket.close(code=1008)
            return

        await websocket.accept()
        room = websocket.app.state.room
        app_log = websocket.app.state.log

        playername = name.strip() or f'Player-{sessionid[:6]}'
        clientid = room.add_client(websocket, playername, sessionid)
        app_log.info('Client %s joined as %s', clientid, playername)

        await room.broadcast_players()
        await room.send_snapshot_to_client(clientid)

        try:
            while True:
                msg = await websocket.receive_text()
                await room.handle_client_message(clientid, msg)
        except WebSocketDisconnect:
            pass
        except Exception as ex:
            app_log.warning('Client %s websocket error: %s', clientid, ex)
        finally:
            room.remove_client(clientid)
            await room.broadcast_players()
            app_log.info('Client %s disconnected', clientid)

    return app
