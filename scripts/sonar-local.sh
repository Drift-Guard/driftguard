#!/usr/bin/env bash
# Local SonarCloud scan — mirrors .github/workflows/sonarcloud.yml (no push required).
# Usage: bash scripts/sonar-local.sh [--skip-prereqs]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SKIP_PREREQS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-prereqs) SKIP_PREREQS=1; shift ;;
    -h|--help)
      cat <<'EOF'
DriftGuard OSS — local SonarCloud scan

  npm run sonar:local

Requires SONAR_TOKEN (uploads analysis to SonarCloud; does not push code).

  export SONAR_TOKEN=...          # SonarCloud → My Account → Security → Generate token
  # or add SONAR_TOKEN=... to .env or .dev.vars (gitignored)

Install sonar-scanner (pick one):
  brew install sonar-scanner
  npx @sonarsource/sonar-scanner   # used automatically when CLI is missing

Prerequisites match .github/workflows/sonarcloud.yml: npm ci, build, test.
Project: sonar-project.properties (kioie_driftguard @ kioie).

If sonar-scanner fails with "Automatic Analysis is enabled", disable it once in
SonarCloud → project kioie_driftguard → Administration → Analysis Method.
See CONTRIBUTING.md (CI-based analysis; no scanner property workaround).
EOF
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

step() { echo ""; echo "==> $*"; }

load_sonar_token() {
  if [[ -n "${SONAR_TOKEN:-}" ]]; then
    return 0
  fi
  if [[ -f .dev.vars ]]; then
    # shellcheck disable=SC1091
    set -a && source .dev.vars && set +a
  fi
  if [[ -z "${SONAR_TOKEN:-}" && -f .env ]]; then
    # shellcheck disable=SC1091
    set -a && source .env && set +a
  fi
}

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
    echo "Node $want required to match CI; got $ver (run: nvm use, or PATH=\$(brew --prefix node@22)/bin:\$PATH)" >&2
    exit 1
  fi
}

sonar_auto_analysis_hint() {
  cat >&2 <<'EOF'

SonarCloud rejected CI/manual analysis because Automatic Analysis is enabled.

Fix (one-time; project admin):
  1. https://sonarcloud.io/project/analysis_method?id=kioie_driftguard
     (or: project → Administration → Analysis Method)
  2. Turn OFF Automatic Analysis (unselect "Enabled for this project")

DriftGuard uses CI-based scans (sonar-project.properties, src/ only). Automatic
Analysis ignores that file and conflicts with npm run sonar:local and the SonarCloud
workflow when SONAR_TOKEN is set. There is no sonar.scanner.* workaround.

Docs: CONTRIBUTING.md
EOF
}

run_sonar_scanner() {
  local log rc
  log="$(mktemp)"
  trap 'rm -f "$log"' RETURN
  set +e
  if command -v sonar-scanner >/dev/null 2>&1; then
    sonar-scanner 2>&1 | tee "$log"
    rc=${PIPESTATUS[0]}
  else
    step "sonar-scanner (npx @sonarsource/sonar-scanner)"
    npx --yes @sonarsource/sonar-scanner 2>&1 | tee "$log"
    rc=${PIPESTATUS[0]}
  fi
  set -e
  if [[ $rc -ne 0 ]] && grep -Fq "Automatic Analysis is enabled" "$log"; then
    sonar_auto_analysis_hint
  fi
  return "$rc"
}

load_sonar_token

if [[ -z "${SONAR_TOKEN:-}" ]]; then
  cat >&2 <<'EOF'
SONAR_TOKEN is required for local SonarCloud upload.

  1. SonarCloud → My Account → Security → Generate token
  2. export SONAR_TOKEN=<token>
     or add SONAR_TOKEN=<token> to .env or .dev.vars (gitignored)

Then run: npm run sonar:local

Install scanner: brew install sonar-scanner  (or rely on npx fallback)
EOF
  exit 1
fi

export SONAR_TOKEN

need_node

if [[ "$SKIP_PREREQS" != "1" ]]; then
  if [[ "${SKIP_NPM_CI:-}" != "1" ]]; then
    step "npm ci"
    npm ci
  fi

  step "npm run build"
  npm run build

  step "npm test"
  npm test
fi

step "SonarCloud scan (local upload)"
run_sonar_scanner

echo ""
echo "SonarCloud local scan finished. View results on sonarcloud.io (project: kioie_driftguard)."
