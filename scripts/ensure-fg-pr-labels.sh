#!/usr/bin/env bash
# Create fg-test/* GitHub labels (idempotent). Run once per repo or in CI bootstrap.
set -euo pipefail

REPO="${1:-}"
ARGS=()
if [[ -n "$REPO" ]]; then
  ARGS=(--repo "$REPO")
fi

LABELS=(
  "fg-test/oss-ci-local:1D76DB"
  "fg-test/oss-pytest:0E8A16"
  "fg-test/oss-pytest-targeted:0E8A16"
  "fg-test/oss-schema:5319E7"
  "fg-test/oss-ip-audit:B60205"
  "fg-test/oss-action-smoke:FBCA04"
  "fg-test/cloud-typecheck:1D76DB"
  "fg-test/cloud-unit:0E8A16"
  "fg-test/cloud-integration:1D76DB"
  "fg-test/cloud-integration-full:0052CC"
  "fg-test/cloud-e2e:5319E7"
  "fg-test/cloud-e2e-ops:5319E7"
  "fg-test/cloud-docs:C5DEF5"
  "fg-test/preflight-regression:D93F0B"
  "fg-test/cross-repo:B60205"
  "fg-test/soak:F9D0C4"
)

for entry in "${LABELS[@]}"; do
  label="${entry%%:*}"
  color="${entry##*:}"
  gh label create "$label" --color "$color" --description "FuseGuard program test gate — see docs/FG-PR-LABELS.md" --force "${ARGS[@]}" 2>/dev/null || true
done

echo "fg-test/* labels ensured."
