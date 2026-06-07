#!/usr/bin/env bash
# Start Keyboard Learning on Linux (no Node.js required — uses Python).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
PORT=5183
URL="http://127.0.0.1:${PORT}/"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required. Install with: sudo apt install python3"
  exit 1
fi

echo "Keyboard Learning"
echo "Starting at ${URL}"
echo "Press Ctrl+C to stop."
echo ""

if command -v xdg-open >/dev/null 2>&1; then
  (sleep 1 && xdg-open "$URL") >/dev/null 2>&1 &
fi

exec python3 -m http.server "$PORT" --bind 127.0.0.1
