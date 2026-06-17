# ToolChange — MCP manifest change management

**Status:** OSS Gate 3A (alpha). MGFA Dimension 3 — controlled evolution of tool surfaces.

**Related:** [gate ladder — Gate 3A](../policies/gate-ladder.md) · [packages/toolchange](../../packages/toolchange/README.md) · [Singapore checklist](./singapore-agent-deployment-checklist.md)

ToolChange answers: *did this PR change MCP tool schemas in a breaking way compared to our committed baseline?* It does **not** judge semantic tool intent (use SchemaSync or hosted watches for that).

---

## Manifest discipline

Teams need two committed files in the repo:

| File | Role |
|------|------|
| `tools.json` | Current manifest (`toolchange export` from local venv — never in CI) |
| `tools.baseline.json` | Approved baseline; update only when breaking changes are intentional |

Workflow:

1. Implement or change tool handlers in Python/TypeScript.
2. Run `toolchange export --out tools.json` locally.
3. Open a PR — CI runs `toolchange lint --manifest tools.json --baseline tools.baseline.json`.
4. On intentional breaking changes, bump baseline in the same PR with reviewer sign-off.

Set `TOOLCHANGE_MANIFEST` / `TOOLCHANGE_BASELINE` for monorepo paths, or use the [pre-commit hook](../../packages/toolchange/hooks/pre-commit).

---

## Advisory → blocking adoption

| Surface | Default today | MGFA buyer path |
|---------|---------------|-----------------|
| `toolchange lint` CLI | **Blocking** (exit 1 on errors) | Use as-is in CI |
| GitHub Action | **Blocking** (`advisory: false`) | [examples/workflows/toolchange.yml](../../examples/workflows/toolchange.yml) |
| Harness `gates.yaml` | **Advisory** in [MGFA profile](../../examples/harness-mgfa/.driftguard/gates.yaml) | Set `toolchange.advisory: false` when manifest workflow is stable |

Start advisory in harness bundles while bootstrapping manifests; flip to blocking once `tools.json` + baseline are committed and TC-L01–L07 pass in your repo.

```yaml
# .driftguard/gates.yaml — after manifest discipline is in place
gates:
  toolchange:
    enabled: true
    advisory: false
```

---

## Harness bundle baseline pinning

Pin manifest paths in `harness.lock` so portable bundles document the canonical ToolChange baseline:

```yaml
manifests:
  toolchange:
    manifest: tools.json
    baseline: tools.baseline.json
packages:
  toolchange: "0.1.x"
```

`driftguard lint-harness` validates paths exist. Example: [examples/harness-mgfa/.driftguard/harness.lock](../../examples/harness-mgfa/.driftguard/harness.lock).

---

## What lint checks (TC-L01–L07)

| Check | Severity | Trigger |
|-------|----------|---------|
| Schema diff vs baseline | error | Removed fields, new required fields, type changes |
| Tool removed | error | Tool dropped from manifest |
| Tool added | warning | New tool (informational) |
| Stale manifest | error | `sourceHash` mismatch — run `toolchange export` |
| Injection patterns | error | Suspicious strings in schema/description |
| Write scope | error | Mutating tool name with `read` scope |

Contract vectors: [diff-core contract](../../packages/diff-core/contract/vectors.json) (`kind: tool_manifest`).

---

## MGFA evidence artifact

PR check output (stdout from `toolchange lint` or GitHub Action step) is the **change-management artifact** for Dimension 3 pre-deploy controls. Pair with:

- **E2** — `drift-diff` / CI harness for structural JSON drift
- **E1** — hosted watches for post-merge MCP `tools/list` drift
- **E22** — harness bundle orchestration across gates

DriftGuard does **not** certify MGFA compliance.

---

## Hosted complement

Continuous MCP `tools/list` polling and alert routing: [driftguard.org/start](https://driftguard.org/start). How-to: [driftguard.org/docs/how-tos/toolchange](https://driftguard.org/docs/how-tos/toolchange).
