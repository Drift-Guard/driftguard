#!/usr/bin/env bash
# Install a pinned DriftGuard CLI for CI (npm registry or GitHub Release tarball).
set -euo pipefail

INPUT_VERSION="${1:-}"
REF="${GITHUB_ACTION_REF:-}"
ROOT="${GITHUB_WORKSPACE:-$(pwd)}"

resolve_version() {
  if [ -n "$INPUT_VERSION" ]; then
    echo "$INPUT_VERSION"
    return
  fi
  if [ -n "$REF" ] && [ "$REF" != "main" ] && [ "$REF" != "master" ]; then
    echo "${REF#v}"
    return
  fi
  if [ -f "$ROOT/package.json" ]; then
    node -p "require('$ROOT/package.json').version" 2>/dev/null && return
  fi
  echo ""
}

install_from_workspace() {
  if [ ! -f "$ROOT/package.json" ]; then
    return 1
  fi
  local name
  name="$(node -p "require('$ROOT/package.json').name" 2>/dev/null || true)"
  [ "$name" = "driftguard" ] || return 1
  if [ ! -d "$ROOT/dist/cli" ]; then
    echo "Building DriftGuard from workspace..."
    (cd "$ROOT" && npm ci && npm run build)
  fi
  [ -d "$ROOT/dist/cli" ] || return 1
  echo "Installing DriftGuard from workspace (${ROOT})..."
  npm install -g "$ROOT"
  return 0
}

VERSION="$(resolve_version)"
if [ -z "$VERSION" ]; then
  echo "Could not resolve DriftGuard version. Pass inputs.version (e.g. 0.3.1)." >&2
  exit 1
fi

echo "Target driftguard@${VERSION}..."

if install_from_workspace; then
  :
elif npm view "driftguard@${VERSION}" version >/dev/null 2>&1; then
  npm install -g "driftguard@${VERSION}"
else
  TGZ="https://github.com/kioie/driftguard/releases/download/v${VERSION}/driftguard-${VERSION}.tgz"
  echo "Installing from GitHub Release: ${TGZ}"
  curl -fsSL "$TGZ" -o /tmp/driftguard-"${VERSION}".tgz
  npm install -g /tmp/driftguard-"${VERSION}".tgz
fi

INSTALLED="$(driftguard version 2>/dev/null || true)"
echo "DriftGuard CLI ready: ${INSTALLED:-unknown}"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "version=${INSTALLED:-$VERSION}" >> "$GITHUB_OUTPUT"
fi
