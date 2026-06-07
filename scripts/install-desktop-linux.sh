#!/usr/bin/env bash
# Install a Cinnamon/application menu shortcut for Keyboard Learning.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
DESKTOP_SRC="$DIR/keyboard-learning.desktop"
DESKTOP_DEST="$HOME/.local/share/applications/keyboard-learning.desktop"

if [ ! -f "$DESKTOP_SRC" ]; then
  echo "Run from the keyboard-learning-linux folder (missing keyboard-learning.desktop)."
  exit 1
fi

mkdir -p "$HOME/.local/share/applications"
sed "s|INSTALL_DIR|$DIR|g" "$DESKTOP_SRC" > "$DESKTOP_DEST"
chmod +x "$DESKTOP_DEST"
chmod +x "$DIR/start.sh"

echo "Installed menu shortcut:"
echo "  $DESKTOP_DEST"
echo "Look for 'Keyboard Learning' under Education in your app menu."
