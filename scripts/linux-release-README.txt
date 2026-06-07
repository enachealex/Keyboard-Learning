Keyboard Learning — Linux Play Package
======================================

This folder is a ready-to-run copy of the game for your Linux laptop.
No Node.js or npm is required on the laptop.

QUICK START
-----------
1. Copy this entire folder to the laptop (USB drive, scp, etc.)
   Example location: /home/USERNAME/Games/keyboard-learning-linux

2. Open a terminal in this folder and run:

   chmod +x start.sh install-desktop.sh
   ./start.sh

3. Firefox opens at http://127.0.0.1:5183
   Bookmark that page for quick access.

OPTIONAL: APP MENU SHORTCUT
---------------------------
   ./install-desktop.sh

   Then launch "Keyboard Learning" from the Education category.

REQUIREMENTS
------------
- Linux (tested for Linux Mint Cinnamon)
- Python 3 (preinstalled on Mint: python3)
- Firefox or Chromium

OFFLINE
-------
Works fully offline after copying. Progress saves in the browser.

UPDATING
--------
Rebuild on your dev PC (npm run package:linux), then copy this folder
again to replace the old one on the laptop.
