#!/usr/bin/env bash
# FG-S18 / FG-S01: OSS IP boundary audit — fail on proprietary leaks in public guides.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERNS=(
  'driftguard-cloud'
  'kioie/driftguard-cloud'
  'ops\.driftguard'
  'FG-S[0-9]'
  'CP-[0-9]'
)

TARGETS=(
  'docs/guides/fuseguard.md'
  'docs/guides/fuseguard-cloud-quickstart.md'
  'docs/guides/fuseguard-cursor-connect.md'
  'packages/fuseguard/README.md'
  'examples/fuseguard'
)

ALLOWLIST=(
  'docs/policies/gate-ladder.md'
  'docs/policies/IP-BOUNDARY-POLICY.md'
  'docs/guides/fuseguard.md'
  'docs/guides/fuseguard-cloud-quickstart.md'
  'docs/guides/fuseguard-cursor-connect.md'
)

fail=0
for target in "${TARGETS[@]}"; do
  [[ -e "$target" ]] || continue
  for pat in "${PATTERNS[@]}"; do
    while IFS= read -r hit; do
      file="${hit%%:*}"
      skip=0
      for allowed in "${ALLOWLIST[@]}"; do
        if [[ "$file" == "$allowed" ]]; then skip=1; break; fi
      done
      if [[ "$skip" -eq 1 ]]; then
        continue
      fi
      echo "IP boundary violation ($pat): $hit"
      fail=1
    done < <(rg -n "$pat" "$target" 2>/dev/null || true)
  done
done

if [[ "$fail" -ne 0 ]]; then
  echo "audit-oss-boundary: FAILED"
  exit 1
fi
echo "audit-oss-boundary: OK"
