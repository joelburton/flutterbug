# Flutterbug

Flutterbug is a project that lets you play parser-style Interactive Fiction
games collaboratively with one or more friends online.

![Flutterbug screenshot](screenshot.png)

It can play:

- ZMachine games (such as Infocom games)
- Glulx games
- TADS
- Hugo
- Scare

## On Windows? Start here

Grab the **flutterbug-windows.zip** from the
[latest release](https://github.com/joelburton/flutterbug/releases/latest)
and follow the included `readme.txt` (also viewable in
[`windows/readme.txt`](windows/readme.txt)). It walks you through Python, Node.js, and a one-click install batch file, and gives you drag-and-drop
launchers for solo and friends-online play.

The rest of this file is for people using other operating systems, or who
are running into trouble the Windows quick-start didn't cover, or just
want to learn more about other features.

## Requirements

- Python
- Node.js

If you don't have these, you should install these:

- **MacOS**: `brew install node python`
- **Linux**: use the installer for your distro
- **Windows**: `winget install OpenJS.NodeJS.LTS Python.Python.3.12`

(closing your terminal window and re-opening may be required after you do this)

## Installing

This installs "emglken", which comes with a bunch of IF virtual machines.
Pin to 0.6.0 — the latest 0.7+ releases have a Windows bug that prevents
the interpreter from launching:

```sh
npm install -g emglken@0.6.0
```

Install Flutterbug. The `@v0.96` pins to a known release; bump it when a
newer tag is available on GitHub:

```sh
pip install --user git+https://github.com/joelburton/flutterbug.git@v0.96
```

(when this hits version 1.0, I'll add it to PyPi so this is easier to install)

## Require password for users (or explicitly opt out)

Every flutterbug invocation must pick one of:

- `--password "super secret"` — friends will be prompted for this
  password on the sign-in page. **Recommended whenever the server is
  reachable from outside your machine** (any tunnel, port-forward, LAN,
  VPN, etc).
- `--no-password` — anyone who reaches the URL can sign in. Only safe
  on a fully trusted local network. Don't combine with `--tunnel`
  unless you genuinely intend a public game.

Forgetting to pick will fail loudly rather than quietly exposing the
server.

## Playing solo

```sh
flutterbug --no-password --open --story=MyGameFile.z5
```

(or .z8 or .zblorb or .ulx or .t3 or whatever)

`--open` waits for the server to come up on http://localhost:4000/ and
opens it in your default browser.

## Playing with friends

In order for your friends to connect to your game, they'll need to be able to
reach your computer. If you have a VPN or static IP, you may not need to set
up a tunnel.

For most people, though, you'll need to open a public tunnel to your computer.
Flutterbug has support for two built-in (or you can use any other solution to
set up a tunnel yourself):

### Localhost.run tunnel

[Localhost.run](https://localhost.run) provides free tunnels and requires no
setup on your computer or anything installed. To use this, add `--tunnel lhr`
to your invocation of Flutterbug:

```sh
flutterbug --password "secret" --open --tunnel lhr --story=game.z5
```

> **Caveat:** some home routers (especially ones with "advanced security"
> or family-filter features) block localhost.run entirely, in which case
> the tunnel will fail to come up. If that happens, switch to a Cloudflare tunnel.

### Cloudflare tunnel

[Cloudflare](https://www.cloudflare.com) also provides free tunnels, and requires
no Cloudflare account. However, you do need to install a program on your computer:
[Cloudflare installation directions](https://www.cloudflare.com). Once you have
that installed, you can use this by adding `--tunnel cf`:

```sh
flutterbug --password "secret" --open --tunnel cf --story=game.z5
```

### After starting a tunnel

After a moment, this will open your browser to the same link you can send to friends — together with the password.

Quitting Flutterbug will disconnect that tunnel.

> ⚠️ **About save files in your launch directory.** Anyone who signs in
> can issue `save` and `restore` commands that read and write
> `*.glksave` files in the directory you started flutterbug from. They
> can also overwrite each others' saves, and the sign-in page lists the
> save filenames in that directory to anyone who's signed in. To be safe,
> launch flutterbug from a clean per-game directory, not from your home
> directory or any any directory containing valuable data.

## Other options

The `--help` command will show other options, including selecting a different
port than 4000, and emitting more debugging-style log messages.

### Display mode: `--mode=flex` (default) or `--mode=fixed`

Most games work best in the default **flex** mode. Each player can use
whatever browser window size they prefer and pick their own font size,
and the game text reflows to fit. Use this for almost everything —
classic Infocom-style games, most modern parser IF, anything where the
game is just "status bar on top, story text below".

Switch to **fixed** mode for games with carefully designed window
layouts — multiple text panes side-by-side, fixed-width art or maps,
puzzle games where the geometry of the screen matters. In fixed mode,
the first player to connect (the "host") sets the window size for
everyone, so the layout looks identical on every screen. Players whose
browser is smaller than the host's will see the edges clipped; players
with bigger windows will see empty space around the game.

```sh
flutterbug --mode=fixed --story=game.z5 ...
```

### Keeping users signed in across restarts: `--secret`

By default, Flutterbug generates a random session key each time it starts.
This means that if you restart the server — to update the game file, change
a setting, or recover from a crash — everyone will need to sign in again.

To avoid this, pass a fixed secret:

```sh
flutterbug --secret "random string" ...
```

With a consistent `--secret`, a returning user whose browser still holds a
valid session cookie is let straight into the game without seeing the sign-in
page — even if a password is required for new visitors. Pick any random
string and keep it the same across invocations. Don't reuse it as your game
password.

### Server-side transcripts and command recordings

If you want a complete log of the game session — captured from the start and working with any VM (including ones without native transcripting) — pass one or both of:

```sh
flutterbug --transcript game.txt --recording game.cmd ...
```

- `--transcript PATH` (also `-T`) writes a full transcript. In multiplayer it prefixes commands with the
  player name (`> Alice: look`).
- `--recording PATH` (also `-R`) writes just the commands, one per
  line — useful for the in-game `REPLAY` command.

Both will overwrite existing files.

### In-game `SCRIPT` / `RECORDING` commands

If you use emglken (the default) and rely on the in-game `SCRIPT ON`
/ `SCRIPT OFF` or `RECORDING ON` / `RECORDING OFF` commands,  the file
you're writing to will appear empty until the game exits. `SCRIPT
OFF` does **not** flush it. This seems to be a limitation in emglken.

Two ways to fix:

- **Use `--transcript` / `--recording` instead** (see above).
- **Type `QUIT` in the game.** The ensures the files are written.


## Credits

Flutterbug is written by Joel Burton <joel@joelburton.com>.

It stands on the work of others:

- [Andrew Plotkin](https://eblong.com/zarf/) — the
  [remote-if-demo](https://github.com/erkyrath/remote-if-demo) script
  that Flutterbug is descended from, the
  [GlkOte](https://github.com/erkyrath/glkote) protocol the browser
  client speaks, and the
  [namedialog.js](https://github.com/erkyrath/glkote) save/restore
  file picker.
- [Dannii Willis](https://github.com/curiousdannii) —
  [AsyncGlk](https://github.com/curiousdannii/asyncglk) (the in-browser
  Glk/GlkOte implementation) and
  [emglken](https://github.com/curiousdannii/emglken) (the bundled IF
  interpreters: bocfel, glulxe, git, hugo, scare, tads).
- [Iosevka Custom](https://typeof.net/Iosevka/) for the bundled
  monospace font.

Thanks to [intfiction.org](https://intfiction.org) members @inventor200, @bg, @pieartsy, and @dannii for their support
and help.
