Key Buddy — Linux
=================

OPTION A — APP MENU SHORTCUT (recommended, no terminal)
-------------------------------------------------------
1. Copy this folder to the laptop, e.g. ~/Games/key-buddy-linux

2. One-time setup in a terminal:

   cd ~/Games/key-buddy-linux
   chmod +x KeyBuddy.sh install-desktop.sh
   ./install-desktop.sh

3. Launch "Key Buddy" from your app menu (Education category).
   - Opens in its own window
   - No terminal, no manual server commands
   - Close the window when done — everything stops automatically

OPTION B — DOUBLE-CLICK KeyBuddy.sh
-----------------------------------
If your file manager allows running scripts:
   chmod +x KeyBuddy.sh
   ./KeyBuddy.sh

OPTION C — NATIVE APP IMAGE (best — like Windows .exe)
------------------------------------------------------
If you received Key-Buddy-X.X.X.AppImage instead of this zip:
   chmod +x Key-Buddy-*.AppImage
   Double-click it (or run from terminal once)

No Python, no browser setup needed for AppImage.

REQUIREMENTS (zip package only)
-------------------------------
- Linux Mint / Ubuntu (Cinnamon, etc.)
- Python 3 (preinstalled on Mint)
- Firefox or Chromium

OFFLINE
-------
Works fully offline after copying.

UPDATING
--------
Replace this folder with a new build from your dev PC (npm run package:linux).
