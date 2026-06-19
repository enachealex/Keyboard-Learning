#!/usr/bin/env bash
# Key Buddy — one-click launcher (no terminal, no manual server setup).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
PORT=5183
URL="http://127.0.0.1:${PORT}/"
PIDFILE="$DIR/.keybuddy-server.pid"

cleanup() {
  if [ -f "$PIDFILE" ]; then
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    rm -f "$PIDFILE"
  fi
}
trap cleanup EXIT INT TERM

if ! command -v python3 >/dev/null 2>&1; then
  if command -v zenity >/dev/null 2>&1; then
    zenity --error --text="Key Buddy needs Python 3.\nInstall: sudo apt install python3"
  else
    echo "Key Buddy needs Python 3. Install: sudo apt install python3" >&2
  fi
  exit 1
fi

if [ ! -f "$PIDFILE" ] || ! kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
  echo $! > "$PIDFILE"
  sleep 0.5
fi

open_app_window() {
  if command -v chromium >/dev/null 2>&1; then
    exec chromium --app="$URL" --window-size=1280,800 --window-position=0,0
  fi
  if command -v chromium-browser >/dev/null 2>&1; then
    exec chromium-browser --app="$URL" --window-size=1280,800 --window-position=0,0
  fi
  if command -v google-chrome >/dev/null 2>&1; then
    exec google-chrome --app="$URL" --window-size=1280,800 --window-position=0,0
  fi
  if command -v firefox >/dev/null 2>&1; then
    exec firefox --new-window "$URL"
  fi
  if command -v xdg-open >/dev/null 2>&1; then
    exec xdg-open "$URL"
  fi
  zenity --error --text="No browser found. Install Firefox or Chromium." 2>/dev/null || true
  exit 1
}

open_app_window
