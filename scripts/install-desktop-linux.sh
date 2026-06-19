#!/usr/bin/env bash
# Install Key Buddy in the Linux application menu (one-click for kids).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
DESKTOP_SRC="$DIR/key-buddy.desktop"
DESKTOP_DEST="$HOME/.local/share/applications/key-buddy.desktop"

if [ ! -f "$DESKTOP_SRC" ]; then
  echo "Run from the key-buddy-linux folder (missing key-buddy.desktop)."
  exit 1
fi

mkdir -p "$HOME/.local/share/applications"
sed "s|INSTALL_DIR|$DIR|g" "$DESKTOP_SRC" > "$DESKTOP_DEST"
chmod +x "$DESKTOP_DEST"
chmod +x "$DIR/KeyBuddy.sh"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
fi

echo "Key Buddy is in your app menu."
echo "Look under Education for \"Key Buddy\"."
echo ""
echo "Kids can click it like any other application — no terminal needed."
