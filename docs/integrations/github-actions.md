# GitHub Actions

DriftGuard ships composite actions under `.github/actions/` in the public repo. Pin semver tags — never `@main`.

**Full CI tiers:** [CI.md](../CI.md) · **Guide:** [CI/CD](../guides/ci-cd.md)

---

## Actions

| Action | Tier | Blocks? | API key |
|--------|------|---------|---------|
| `drift-diff` | Hook | On breaking diff | No |
| `drift-coverage-preview` | Preview | No (default) | No |
| `drift-coverage` | Gate | Yes | Pro key or trial |
| `drift-agents-lint` | Manifest lint | No | `.driftguard/agents.yaml` |
| `validate` CLI / workflow | Runtime ingress gate | On invalid payload | No (local); hosted `POST /api/validate` for n8n |

Marketplace names and listing status: [GITHUB_MARKETPLACE.md](../GITHUB_MARKETPLACE.md).

---

## Quick start

Copy [examples/workflows/driftguard-starter.yml](../../examples/workflows/driftguard-starter.yml) to `.github/workflows/driftguard.yml`.

```yaml
- uses: kioie/driftguard/.github/actions/drift-diff@v0.3.3
  with:
    before: '{"status":"ok","data":{"id":1}}'
    after: '{"status":"ok","data":{"id":1,"name":"test"}}'
```

**Preview** (scan `mcp.json` and repo paths):

```yaml
- uses: kioie/driftguard/.github/actions/drift-coverage-preview@v0.3.3
  with:
    scan-paths: mcp.json,.cursor/mcp.json,package.json
```

**Gate** — full workflow: [examples/workflows/driftguard-coverage-gate.yml](../../examples/workflows/driftguard-coverage-gate.yml)

```yaml
- uses: kioie/driftguard/.github/actions/drift-coverage@v0.3.3
  env:
    DRIFTGUARD_API_KEY: ${{ secrets.DRIFTGUARD_API_KEY }}
```

**agents.yaml lint** (offline, no API key) — see [agent binding manifest guide](../guides/agent-binding-manifest.md):

```yaml
- uses: kioie/driftguard/.github/actions/drift-agents-lint@v0.3.3
  with:
    manifest: .driftguard/agents.yaml
```

Template: [examples/workflows/agents-lint.yml](../../examples/workflows/agents-lint.yml).

**Ingress validate** (offline CLI — gate workflow exports or fixture outputs):

```yaml
- uses: kioie/driftguard/.github/actions/setup-driftguard@v0.3.3
- run: driftguard validate --profile profiles/lead.json --payload fixtures/event.json
```

Template: [examples/workflows/ingress-validate.yml](../../examples/workflows/ingress-validate.yml). Hosted API for n8n: [validate-api.md](../reference/validate-api.md).

**OpenAPI compatibility gate** (Notion-style producer CI):

```yaml
- uses: kioie/driftguard/.github/actions/openapi-diff@v0.3.3
  with:
    base: openapi/base.json
    target: openapi/openapi.json
```

Template: [examples/workflows/openapi-compatibility-gate.yml](../../examples/workflows/openapi-compatibility-gate.yml).

Per-action READMEs: `.github/actions/drift-diff/README.md`, `drift-coverage-preview/README.md`, `drift-coverage/README.md`, `drift-agents-lint/README.md`.

---

## Step Summary

Preview and gate actions write markdown to the GitHub Actions Step Summary with unmonitored endpoints and [trial deep links](https://driftguard.org/start?from=ci).

---

## Next steps

| Goal | Doc |
|------|-----|
| GitLab equivalent | [gitlab-ci.md](./gitlab-ci.md) |
| ToolChange gate in Actions | [toolchange-change-management.md](../guides/toolchange-change-management.md) |
| Integrations index | [README.md](./README.md) |
