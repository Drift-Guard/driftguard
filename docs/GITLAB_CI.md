# DriftGuard on GitLab CI

DriftGuard CI uses the same OSS CLI on GitLab — no GitHub Actions required. Hosted preview and Pro gate call the same API routes as GitHub.

**Pin:** `npx driftguard@0.3.3` (never `@latest` in production pipelines).

---

## Quick start

Copy [examples/gitlab-ci.yml](../examples/gitlab-ci.yml) into your repo root.

| Tier | Command | Secret | Blocks pipeline? |
|------|---------|--------|------------------|
| **Preview** | `driftguard coverage-preview` | None | No (optional `DRIFTGUARD_FAIL_ON_MISSING=1`) |
| **Trial gate** | `driftguard assert-coverage` | `DRIFTGUARD_TRIAL_SESSION` | Yes (1 endpoint) |
| **Pro gate** | `driftguard assert-coverage` | `DRIFTGUARD_API_KEY` | Yes (plan limit) |

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DRIFTGUARD_SCAN_PATHS` | Comma-separated files to scan (default: `mcp.json,.cursor/mcp.json,package.json`) |
| `DRIFTGUARD_FILES_JSON` | Explicit JSON array of `{path, content}` — overrides scan |
| `DRIFTGUARD_CI_REPO` | Repo slug for console links (defaults to `CI_PROJECT_PATH`) |
| `DRIFTGUARD_API_KEY` | Pro/Team API key for assert gate |
| `DRIFTGUARD_TRIAL_SESSION` | Trial UUID (1-endpoint gate) |
| `CI_JOB_SUMMARY` | GitLab 16+ job summary file (auto-set by GitLab) |

The CLI writes markdown summaries to `CI_JOB_SUMMARY` when present (same UX as GitHub Step Summary).

---

## Trial setup from GitLab

1. Run preview job — read job summary for unmonitored endpoints.
2. Mint a trial session (or use auto-mint in summary when preview runs with network access):

```bash
curl -sX POST https://driftguard.eddy-d55.workers.dev/api/trial/session \
  -H 'content-type: application/json' \
  -d '{"repo":"'"$CI_PROJECT_PATH"'"}' | jq -r '.trialGate.envVar'
```

3. Add `DRIFTGUARD_TRIAL_SESSION` as a **masked CI variable** in GitLab → Settings → CI/CD.
4. Open [CI trial setup](https://driftguard.eddy-d55.workers.dev/ci/setup?from=ci) to import watches in the console.
5. Enable assert job with `DRIFTGUARD_API_KEY` when you need full multi-endpoint coverage (Pro).

---

## GitLab vs GitHub Actions

| | GitHub Actions | GitLab CI |
|--|----------------|-----------|
| Distribution | Composite actions on Marketplace | `npx driftguard@X.Y.Z` in `.gitlab-ci.yml` |
| Repo slug | `GITHUB_REPOSITORY` | `CI_PROJECT_PATH` |
| Job summary | `GITHUB_STEP_SUMMARY` | `CI_JOB_SUMMARY` |
| Scan paths | `scan-paths` action input | `DRIFTGUARD_SCAN_PATHS` env |

---

## API reference

Same hosted routes as [CI.md](./CI.md): `POST /api/coverage/preview`, `POST /api/coverage/assert`, `POST /api/trial/session`.

Headers: `X-DriftGuard-CI-Repo`, `X-DriftGuard-Client-Version`, `Authorization` or `X-DriftGuard-Trial`.
