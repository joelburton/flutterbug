Flutterbug for Windows
======================

Quick start
-----------

1. Install Python 3 from https://www.python.org/downloads/
   (the default options are fine; leave "Install launcher for all users"
   checked if asked)

2. Install Node.js LTS from https://nodejs.org/

3. Double-click flutterbug-install.bat. It will install Flutterbug
   and the game interpreter (emglken). When it finishes, close the
   window.

4. To play a game, drag a story file (e.g. MyGame.z5, MyGame.gblorb)
   onto one of these:

      flutterbug-solo.bat       - just you, on your own computer
      flutterbug-tunnel.bat     - play with friends over the internet (free)
      flutterbug-cloudflare.bat - play with friends via Cloudflare tunnel
                                  (needs cloudflared installed separately)

   flutterbug-tunnel.bat and flutterbug-cloudflare.bat will prompt
   for a password your friends will use to sign in.

   Quitting Flutterbug closes the tunnel.

Save files land in the same folder as the story file you dragged in.
