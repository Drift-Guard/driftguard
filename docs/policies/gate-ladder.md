# Gate ladder

Progressive adoption of contract-testing gates in your repo. Start where you have pain today; add gates as MCP tools, agents, and NL prompts grow in scope.

**Package READMEs** hold implementation detail — this page covers **when to adopt** each gate.

---

## Ladder overview

```
Gate 1 — MockDrift     Assertion v2 for mock/snapshot tests
    ↓
Gate 2A — FuseGuard    Loop/budget fuse for agent tool calls
    ↓
Gate 3A — ToolChange   Manifest lint for MCP tool schema PRs
    ↓
Gate 4A — SchemaSync   NL prompt lint vs removed schema fields
```

Hosted complements (not in this repo): FuseGuard trip ingest, SchemaSync GitHub App — `driftguard-cloud`.

---

## Gate 1 — MockDrift

| | |
|---|---|
| **When** | You have pytest/integration tests with mocked APIs and need deterministic drift assertions |
| **When not** | Pure JSON fixture diff is enough — use OSS `compare_json` or CI `drift-diff` |
| **Package** | [packages/mockdrift](../../packages/mockdrift/README.md) |
| **Docs** | [ASSERTION-V2.md](../mockdrift/ASSERTION-V2.md) · [R3-API.md](../mockdrift/R3-API.md) |

Assertion v2 scenarios replay expected vs drifted responses in tests.

---

## Gate 2A — FuseGuard

| | |
|---|---|
| **When** | Agents call tools in loops; you need budget caps and trip logging before schema checks |
| **When not** | No agent runtime — static CI diff only |
| **Package** | [packages/fuseguard](../../packages/fuseguard/README.md) |
| **Shared** | `mockdrift.loop_detect` |

Integration surfaces: MCP/HTTP proxy (`FuseProxy`), runner wrap (`wrap_agent`). Disable: `DRIFTGUARD_FUSE=0`.

---

## Gate 3A — ToolChange

| | |
|---|---|
| **When** | MCP tool manifests change in PRs; you want manifest-vs-baseline lint in CI |
| **When not** | Tools are not versioned as JSON manifests yet |
| **Package** | [packages/toolchange](../../packages/toolchange/README.md) |
| **Status** | Alpha — `--advisory` for non-blocking CI |

Commands: `toolchange export`, `toolchange lint`. GitHub Action: `.github/actions/toolchange`. Pre-commit hook included.

---

## Gate 4A — SchemaSync

| | |
|---|---|
| **When** | NL prompts reference schema fields; literal removal should fail lint |
| **When not** | No prompt/schema coupling in repo |
| **Package** | [packages/schemasync](../../packages/schemasync/README.md) |
| **Status** | Partial — `lint-nl` literal mode shipped; semantic-hints advisory only |

```bash
schemasync lint-nl --mode literal --prompt "…" --removed field_name
```

**Next (4B):** Hosted GitHub App webhook — cloud repo only.

---

## Adoption order (recommended)

| Stage | Gates | Typical trigger |
|-------|-------|-------------------|
| **1** | OSS diff + CI hook | First API or MCP integration |
| **2** | MockDrift | Flaky mocks; need scenario replay |
| **3** | FuseGuard | Agent cost/runaway loops |
| **4** | ToolChange | MCP tool sprawl in monorepo |
| **5** | SchemaSync | Prompts must stay aligned with schema removals |
| **Parallel** | Hosted watches | Continuous monitoring — [trial](https://driftguard.org/start) |

Structural JSON diff (`compare_json`) underpins all gates but is not a replacement for hosted watches.

---

## Next steps

| Goal | Doc |
|------|-----|
| CI hook only | [CI/CD guide](../guides/ci-cd.md) |
| Policy overview | [Policies README](./README.md) |
| Glossary | [Gate packages](../glossary.md#gate-packages-coverage-ladder) |
