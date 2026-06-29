# FuseGuard PR labels (`fg-test/*`)

Every PR must carry **at least one** `fg-test/*` label. The [FG PR labeler](../.github/workflows/fg-pr-labeler.yml) workflow applies labels from the diff; authors can add more manually for paired cloud PRs.

| Label | Local command |
|-------|---------------|
| `fg-test/oss-ci-local` | `npm run ci:local` |
| `fg-test/oss-pytest` | `cd packages/fuseguard && pytest tests/ -v` |
| `fg-test/oss-schema` | Schema fixture validation |
| `fg-test/oss-ip-audit` | `bash scripts/audit-oss-boundary.sh` |
| `fg-test/oss-action-smoke` | CI action smoke workflow |

Create labels once: `bash scripts/ensure-fg-pr-labels.sh Drift-Guard/driftguard`

Full cloud label set: private `driftguard-cloud` repo `docs/FG-PR-LABELS.md`.
