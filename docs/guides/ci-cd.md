# CI/CD guide

Add DriftGuard to pipelines in four steps: **hook → preview → trial → gate**. Start free; upgrade when you need full coverage enforcement.

**Full reference:** [CI.md](../CI.md) — tiers, env vars, Step Summary behavior, version pins.

**Before you start:** A repo with JSON fixtures, `mcp.json`, or OpenAPI paths to scan. Node 20+ for CLI jobs.

---

## Overview

| Tier | What it does | API key | Blocks CI? |
|------|--------------|---------|------------|
| **Hook** | Breaking diff on before/after JSON | No | On breaking diff only |
| **Preview** | Scan repo for unwatched deps; console links | No | No (default) |
| **Trial gate** | Assert all deps watched | Trial session | Yes (1 endpoint) |
| **Pro gate** | Assert all deps watched | `dg_…` key | Yes (plan limit) |

**Pin policy:** `uses: kioie/driftguard/...@v0.3.3` or `npx driftguard@0.3.3` — never `@main`.

---

## Step 1 — Hook (free)

Fastest add: copy [examples/workflows/driftguard-starter.yml](../../examples/workflows/driftguard-starter.yml) to `.github/workflows/driftguard.yml`.

```yaml
- uses: kioie/driftguard/.github/actions/drift-diff@v0.3.3
  with:
    before: '{"status":"ok","data":{"id":1}}'
    after: '{"status":"ok","data":{"id":1,"name":"test"}}'
```

CLI equivalent: `npx driftguard@0.3.3 diff "$BEFORE" "$AFTER"`.

Details: [CI.md — Layer 1](../CI.md#layer-1--hook-free).

---

## Step 2 — Preview (free, nudge upgrade)

Discover endpoints from `mcp.json`, OpenAPI, and URLs in repo files. Writes GitHub Step Summary (or GitLab job summary) with trial deep links — **does not block** by default.

```yaml
- uses: kioie/driftguard/.github/actions/drift-coverage-preview@v0.3.3
  with:
    scan-paths: mcp.json,.cursor/mcp.json,package.json
```

Optional: `fail-on-missing: true` after you are ready to enforce.

Details: [CI.md — Layer 2](../CI.md#layer-2--preview-free-hooks-upgrade).

---

## Step 3 — Trial

One endpoint gets full Pro in the console. CI deep links from preview pre-fill the first missing watch.

Start: [driftguard.org/start](https://driftguard.org/start) (use `?from=ci` when linked from Step Summary).

---

## Step 4 — Gate (trial or Pro)

```yaml
- uses: kioie/driftguard/.github/actions/drift-coverage@v0.3.3
  env:
    DRIFTGUARD_API_KEY: ${{ secrets.DRIFTGUARD_API_KEY }}
```

Trial: use `DRIFTGUARD_TRIAL_SESSION` instead — limited to **one** watched endpoint; multi-dep repos need Pro.

Details: [CI.md — Layer 4](../CI.md).

---

## Platform-specific docs

| Platform | Guide | Template |
|----------|-------|----------|
| **GitHub Actions** | [Integrations — GitHub Actions](../integrations/github-actions.md) | [driftguard-starter.yml](../../examples/workflows/driftguard-starter.yml) |
| **GitLab CI** | [GITLAB_CI.md](../GITLAB_CI.md) · [Integrations — GitLab](../integrations/gitlab-ci.md) | [gitlab-ci.yml](../../examples/gitlab-ci.yml) |
| **Marketplace** | [GITHUB_MARKETPLACE.md](../GITHUB_MARKETPLACE.md) | Listing readiness for composite actions |

---

## Gate packages in CI

Beyond JSON diff, add repo gates step by step: [Gate ladder](../policies/gate-ladder.md) (MockDrift → ToolChange → SchemaSync).

---

## Next steps

| Goal | Doc |
|------|-----|
| Drift triage after alerts | [Drift management](./drift-management.md) |
| Team API keys and watches | [Platform admin](./platform-admin.md) |
| Adoption from CI-only | [Migrate — from CI-only](../migrate/README.md#from-ci-only-checks) |
| Integrations catalog | [Integrations](../integrations/README.md) |
