#!/usr/bin/env bash
# Enable optional git hooks (pre-push runs npm run ci:local). Not required for CI.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p .githooks
if [[ ! -f .githooks/pre-push ]]; then
  cp .githooks/pre-push.sample .githooks/pre-push
  chmod +x .githooks/pre-push
fi

git config core.hooksPath .githooks
echo "Git hooks enabled (.githooks/pre-push → npm run ci:local)."
