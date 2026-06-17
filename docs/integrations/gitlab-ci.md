# GitLab CI

Same free CLI and hosted API routes as GitHub Actions — no Actions-specific dependencies.

**Full reference:** [GITLAB_CI.md](../GITLAB_CI.md) · **Guide:** [CI/CD](../guides/ci-cd.md)

---

## Quick start

Copy [examples/gitlab-ci.yml](../../examples/gitlab-ci.yml) into your repo root.

| Tier | Command | Secret | Blocks? |
|------|---------|--------|---------|
| Preview | `driftguard coverage-preview` | None | No |
| Trial gate | `driftguard assert-coverage` | `DRIFTGUARD_TRIAL_SESSION` | Yes (1 endpoint) |
| Pro gate | `driftguard assert-coverage` | `DRIFTGUARD_API_KEY` | Yes |

**Pin:** `npx @driftguard/driftguard@0.3.3` — never `@latest` in production.

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DRIFTGUARD_SCAN_PATHS` | Files to scan (default: `mcp.json,.cursor/mcp.json,package.json`) |
| `DRIFTGUARD_FILES_JSON` | Explicit `{path, content}` array |
| `DRIFTGUARD_CI_REPO` | Repo slug for console links (defaults to `CI_PROJECT_PATH`) |
| `CI_JOB_SUMMARY` | GitLab 16+ job summary (auto-set) |

CLI writes markdown summaries to `CI_JOB_SUMMARY` when present — same UX as GitHub Step Summary.

---

## Trial from GitLab

1. Run preview job — read job summary for unwatched endpoints.
2. Mint trial session or follow summary deep link to [driftguard.org/start](https://driftguard.org/start).
3. Add `DRIFTGUARD_TRIAL_SESSION` as masked variable for assert gate.

Details: [GITLAB_CI.md — trial setup](../GITLAB_CI.md#trial-setup-from-gitlab).

---

## Next steps

| Goal | Doc |
|------|-----|
| GitHub Actions | [github-actions.md](./github-actions.md) |
| Integrations index | [README.md](./README.md) |
