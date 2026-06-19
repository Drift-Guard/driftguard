#!/usr/bin/env bash
# Mirror required OSS CI jobs locally (.github/workflows/ci.yml).
# Usage: bash scripts/ci-local.sh [--with-changelog] [--with-sonar] [--packages PATH,...]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WITH_CHANGELOG=0
WITH_SONAR=0
PACKAGES=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-changelog) WITH_CHANGELOG=1; shift ;;
    --with-sonar) WITH_SONAR=1; shift ;;
    --packages) PACKAGES="${2:-}"; shift 2 ;;
    -h|--help)
      cat <<'EOF'
DriftGuard OSS — local CI parity

  npm run ci:local                         # default (validate + action-smoke)
  npm run ci:local -- --with-changelog     # + CHANGELOG validation
  npm run ci:local -- --with-sonar         # + SonarCloud upload (needs SONAR_TOKEN)
  npm run sonar:local                      # Sonar only (same prerequisites as SonarCloud workflow)
  npm run ci:local -- --packages packages/mockdrift

Matches .github/workflows/ci.yml (Build & test + CI action smoke).
Not run locally by default: Gitleaks, CodeQL, OpenRouter review.
SonarCloud: npm run sonar:local or --with-sonar (requires SONAR_TOKEN).
EOF
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

step() { echo ""; echo "==> $*"; }

need_node() {
  local want major ver
  want="22"
  if [[ -f .nvmrc ]]; then
    want="$(tr -d '[:space:]' < .nvmrc)"
  fi
  ver="$(node -v)"
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$major" -lt "$want" ]]; then
    echo "Node >=$want required to match CI; got $ver (run: nvm use)" >&2
    exit 1
  fi
  if [[ "$major" != "$want" ]]; then
    echo "::warning::CI uses Node $want; local $ver may differ (run: nvm use)."
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

if [[ "$WITH_SONAR" == "1" ]]; then
  step "SonarCloud local scan"
  SKIP_NPM_CI=1 bash scripts/sonar-local.sh --skip-prereqs
fi

echo ""
echo "OSS local CI parity passed."
