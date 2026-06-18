#!/usr/bin/env bash
# Mirror required OSS CI jobs locally (.github/workflows/ci.yml).
# Usage: bash scripts/ci-local.sh [--with-changelog] [--packages PATH,...]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WITH_CHANGELOG=0
PACKAGES=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-changelog) WITH_CHANGELOG=1; shift ;;
    --packages) PACKAGES="${2:-}"; shift 2 ;;
    -h|--help)
      cat <<'EOF'
DriftGuard OSS — local CI parity

  bash scripts/ci-local.sh              # validate + action-smoke (default)
  bash scripts/ci-local.sh --with-changelog
  bash scripts/ci-local.sh --packages packages/mockdrift

Matches .github/workflows/ci.yml (Build & test + CI action smoke).
Does not run: Gitleaks, CodeQL, SonarCloud, OpenRouter review (need GitHub/secrets).
Path-filtered package workflows (mockdrift, fuseguard, …) run only with --packages.
EOF
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

step() { echo ""; echo "==> $*"; }

need_node() {
  local major ver
  ver="$(node -v)"
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$major" -lt 20 ]]; then
    echo "Node >=20 required (CI uses 22); got $ver" >&2
    exit 1
  fi
  if [[ "$major" != "22" ]]; then
    echo "::warning::CI uses Node 22; local $ver may differ (use nvm/fnm to match)."
  fi
}

need_node

step "npm ci"
npm ci

step "npm run build"
npm run build

step "npm run check:agents-yaml"
npm run check:agents-yaml

step "Tests & coverage threshold (60%)"
SKIP_NPM_CI=1 bash .github/scripts/check-coverage.sh 60

step "npm audit (production, high+)"
npm audit --audit-level=high --omit=dev

step "Drift detection smoke"
BEFORE='{"status":"ok","data":{"id":1,"name":"test"}}'
AFTER='{"status":"ok","data":{"id":1}}'
RESULT="$(node dist/cli/check.js diff "$BEFORE" "$AFTER" 2>/dev/null || true)"
echo "$RESULT" | grep -q '"breakingCount": 1'

step "CI action smoke — version pin"
PKG_VERSION="$(node -p "require('./package.json').version")"
test "$(node dist/cli/check.js version)" = "$PKG_VERSION"

step "CI action smoke — drift-diff fails on breaking change"
set +e
node dist/cli/check.js diff '{"a":1}' '{"a":1,"b":2}' >/dev/null 2>&1
DIFF_RC=$?
set -e
test "$DIFF_RC" -ne 0

step "CI action smoke — drift-agents-lint example"
node scripts/check-agents-yaml.mjs examples/a2a/agents.yaml

step "CI action smoke — scan-paths wiring"
export DRIFTGUARD_SCAN_PATHS=examples/mcp-client-config.json
node --input-type=module -e "
  import { readFilesJsonForCi } from './dist/cli/ci-files.js';
  const files = JSON.parse(readFilesJsonForCi());
  if (!files.some((f) => f.path === 'examples/mcp-client-config.json')) {
    throw new Error('scan-paths did not load example MCP config');
  }
"

if [[ "$WITH_CHANGELOG" == "1" ]]; then
  step "CHANGELOG validation"
  GITHUB_EVENT_NAME=pull_request GITHUB_BASE_REF=main bash .github/scripts/validate-changelog.sh
fi

if [[ -n "$PACKAGES" ]]; then
  IFS=',' read -ra PKG_PATHS <<< "$PACKAGES"
  for pkg in "${PKG_PATHS[@]}"; do
    pkg="${pkg#"${pkg%%[![:space:]]*}"}"
    pkg="${pkg%"${pkg##*[![:space:]]}"}"
    [[ -n "$pkg" ]] || continue
    if [[ ! -d "$pkg" ]]; then
      echo "Package path not found: $pkg" >&2
      exit 1
    fi
    step "Path-filtered package: $pkg"
    if [[ -f "$pkg/pyproject.toml" ]]; then
      python3 -m pip install -q -e "$pkg[dev]" 2>/dev/null || python3 -m pip install -q -e "$pkg"
      (cd "$pkg" && pytest tests/ -q --tb=line)
    elif [[ -f "$pkg/package.json" ]]; then
      npm test --prefix "$pkg"
    else
      echo "No known test runner for $pkg" >&2
      exit 1
    fi
  done
fi

echo ""
echo "OSS local CI parity passed."
