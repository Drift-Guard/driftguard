---
status: accepted
---

# Contract Manifest — unified `.driftguard/` + MCP lockfile (CM0–CM6)

Unify the harness bundle (`.driftguard/`) and MCP catalog baselines (`driftguard-lock.json`) into a **single git-native contract manifest** — the integrator-facing standard for ramp, CI, and embed. Supersedes split mental models between harness engineering (ADR-0003) and the lockfile bridge.

## Decision

Adopt `.driftguard/manifest.yaml` as the bundle **entrypoint**. Keep separate files (manifest, gates, agents, harness.lock, lock JSON) — do not merge into one mega-YAML (rejected in ADR-0003).

| File | Role |
|------|------|
| `manifest.yaml` | Adoption level, scan roots, lockfile policy, hosted expectations |
| `gates.yaml` | Gate ladder toggles (ADR-0003) |
| `agents.yaml` | Agent ↔ MCP ↔ watch graph |
| `harness.lock` | Pinned fixtures + manifest path refs (`mcp_lock`, toolchange, schemasync) |
| `mcp/driftguard-lock.json` | Deterministic `tools/list` baseline (`McpLockfileV1` in diff-core) |

### Adoption levels

| Level | Name | Required artifacts | API key |
|-------|------|-------------------|---------|
| **1** | Lock | `manifest.yaml`, lock JSON under `lockfiles.dir` | No |
| **2** | Harness | + `gates.yaml`, `harness.lock` | No |
| **3** | Observe | + `agents.yaml`, coverage gate | Yes |

## Constraints

- **Open-core:** schemas, `lint-harness`, adopt/doctor (CM3–CM4) — OSS. Watch reconcile, `suggestedLockfilePatch` webhook field — `driftguard-cloud` (see cloud `CM-6-LOCKFILE-REMEDIATION-SPEC.md`).
- **Lock format frozen:** `driftguard-lock.json` uses `McpLockfileV1`; diff via `diffMcpTools` only.
- **Offline first:** Level 1–2 require no `DRIFTGUARD_API_KEY`.
- **Progressive strictness:** default ToolChange advisory at Level 2; strict mode opt-in.

## Tracked work (CM0–CM6)

| Phase | Deliverable | Repo | Status |
|-------|-------------|------|--------|
| **CM0** | ADR, `manifest.yaml` schema, `harness.lock.manifests.mcp_lock`, lint codes, `agents.mcp.lockServers` | OSS | **Shipped** |
| **CM1** | Cross-lint lock ↔ agents; default lock path `.driftguard/mcp/` | OSS | Planned |
| **CM2** | Root lockfile deprecation warn (`DG-LOCK-020`) | OSS | Planned |
| **CM3** | `driftguard adopt` (levels 1–2) | OSS | **Shipped** |
| **CM4** | `driftguard doctor` scorecard | OSS | Planned |
| **CM5** | Manifest-aware CI templates | OSS | Planned |
| **CM6** | `adopt --level 3`, webhook `suggestedLockfilePatch` | OSS + cloud | Planned |

## References

- [ADR-0003 harness bundle](./0003-harness-bundle.md)
- [mcp-lockfile-bridge.md](../guides/mcp-lockfile-bridge.md)
- [manifest-lint-codes.md](../reference/manifest-lint-codes.md)
- [ROADMAP.md](../ROADMAP.md) § Contract Manifest
