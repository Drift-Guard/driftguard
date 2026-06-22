#!/usr/bin/env bash
# Scrub proprietary content from the PUBLIC Drift-Guard/driftguard git history.
#
# Run only on a fresh clone after backing up. Rewrites history — coordinate with
# anyone who has forked or cloned the repo before force-pushing main.
#
# Requires: git-filter-repo (pip install git-filter-repo)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "Install git-filter-repo: pip install git-filter-repo" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree must be clean before history rewrite." >&2
  exit 1
fi

echo "This rewrites ALL history on the current branch."
echo "Press Ctrl+C to abort, or Enter to continue."
read -r _

# Remove files that were committed before the open-core split (May 2026).
PATHS=(
  MONETIZATION.md
  AGENT_LOG.md
  PAYMENTS_KENYA.md
  LAUNCH
  Dockerfile
  fly.toml
  render.yaml
  docs/ROADMAP.md
  src/api
  src/billing
  src/db
  src/services
  web/index.html
)

args=(--force)
for p in "${PATHS[@]}"; do
  args+=(--path "$p" --invert-paths)
done

git filter-repo "${args[@]}"

# Redact personal workers.dev subdomain everywhere in history.
replacements="$(mktemp)"
cat >"$replacements" <<'EOF'
driftguard.org==>driftguard.org
driftguard.org==>driftguard.org
EOF
git filter-repo --force --replace-text "$replacements"
rm -f "$replacements"

echo ""
echo "History scrub complete on $(git branch --show-current)."
echo "Next steps:"
echo "  1. gitleaks detect --source . --verbose"
echo "  2. git push --force-with-lease origin main"
echo "  3. Rotate credentials listed in docs/security/SECRET-ROTATION-CHECKLIST.md"
