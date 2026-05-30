#!/usr/bin/env bash
# Validates CHANGELOG.md structure (Keep a Changelog).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHANGELOG="${ROOT}/CHANGELOG.md"

if [[ ! -f "${CHANGELOG}" ]]; then
  echo "CHANGELOG.md is missing"
  exit 1
fi

grep -q 'keepachangelog.com' "${CHANGELOG}" || {
  echo "CHANGELOG.md should reference Keep a Changelog format"
  exit 1
}

grep -q '^## \[Unreleased\]' "${CHANGELOG}" || {
  echo "CHANGELOG.md must contain an [Unreleased] section"
  exit 1
}

if [[ "${GITHUB_EVENT_NAME:-}" == "pull_request" && -n "${GITHUB_BASE_REF:-}" ]]; then
  cd "${ROOT}"
  git fetch origin "${GITHUB_BASE_REF}" --depth=1 2>/dev/null || true
  BASE="origin/${GITHUB_BASE_REF}"
  if git rev-parse "${BASE}" >/dev/null 2>&1; then
    CHANGED="$(git diff --name-only "${BASE}...HEAD" || true)"
    if echo "${CHANGED}" | grep -qE '^(src/|package\.json)' && ! echo "${CHANGED}" | grep -q '^CHANGELOG.md$'; then
      echo "::warning::src/ or package.json changed but CHANGELOG.md was not updated"
    fi
  fi
fi

echo "CHANGELOG.md OK"
