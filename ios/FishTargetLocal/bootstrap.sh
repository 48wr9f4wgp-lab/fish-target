#!/usr/bin/env bash
set -euo pipefail

HOST_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$HOST_DIR/../.." && pwd)"
WEB_DIR="$HOST_DIR/WebApp"

if ! command -v node >/dev/null 2>&1; then
  echo "node is required"
  exit 1
fi

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "xcodegen is required. Install it with: brew install xcodegen"
  exit 1
fi

echo "[1/3] Building fish-target web bundle"
(cd "$ROOT_DIR" && npm run build)

echo "[2/3] Syncing offline web bundle"
rm -rf "$WEB_DIR"
mkdir -p "$WEB_DIR"
cp -R "$ROOT_DIR/dist/." "$WEB_DIR/"

echo "[3/3] Generating Xcode project"
(cd "$HOST_DIR" && xcodegen generate)

echo
echo "Ready: $HOST_DIR/FishTargetLocal.xcodeproj"
echo "Open the project, choose your Development Team, connect an iPhone, and Run."
