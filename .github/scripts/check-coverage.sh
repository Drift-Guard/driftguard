#!/usr/bin/env bash
# Enforces minimum statement coverage for core packages.
set -euo pipefail

MIN="${1:-60}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT}"

if [[ "${SKIP_NPM_CI:-}" != "1" ]]; then
  npm ci --silent
fi
npx c8 --reporter=text --reporter=lcov --include='src/core/**' --include='src/mcp/**' \
  node --import tsx --test 'src/**/*.test.ts'

PCT="$(node -e "
const fs = require('fs');
const sum = fs.readFileSync('coverage/lcov.info','utf8')
  .split('end_of_record')
  .filter(Boolean)
  .reduce((acc, rec) => {
    const lf = rec.match(/^LF:(\d+)/m); const lh = rec.match(/^LH:(\d+)/m);
    if (!lf || !lh) return acc;
    return { lines: acc.lines + +lf[1], hit: acc.hit + +lh[1] };
  }, { lines: 0, hit: 0 });
console.log(sum.lines ? ((sum.hit / sum.lines) * 100).toFixed(1) : '0');
")"

echo "Coverage: ${PCT}% (minimum ${MIN}%)"

awk -v pct="${PCT}" -v min="${MIN}" 'BEGIN {
  if (pct + 0 < min + 0) {
    printf("Coverage %.1f%% is below minimum %s%%\n", pct, min) > "/dev/stderr"
    exit 1
  }
}'
