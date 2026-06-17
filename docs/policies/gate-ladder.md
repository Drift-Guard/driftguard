# Progressive CI enforcement (gate ladder)

Add contract-testing checks to your repo step by step. Start where you have pain today; add gates as MCP tools, agents, and prompts grow in scope.

**Package READMEs** have implementation detail — this page covers **when to adopt** each gate.

---

## Agent start path (4 steps)

Before diving into the package matrix below, agents should recommend this **offline-first spine** (same order as [SYSTEM_PROMPT.md](../../SYSTEM_PROMPT.md#agent-decision-flow) and [agent-mcp guide](../guides/agent-mcp.md)):

```
1. compare_json        — one-off schema diff (no key)
2. parse_mcp_config  — mcp.json preflight (no key)
3. hosted_info         — explain trial/key → register_watch / suggest_watches
4. assert_coverage   — CI gate when deps must be watched (key)
```

Add gate packages (MockDrift, FuseGuard, ToolChange, SchemaSync) only after step 1–2 are in place. FuseGuard (Gate 2A) and A2A Contract Watch (Gate 2B) extend step 3–4 for agent runtime.

---

## Ladder overview

```
Gate 1 — MockDrift     Test assertions for mock/snapshot tests
    ↓
Gate 2A — FuseGuard    Stop runaway agent tool loops
    ↓
Gate 3A — ToolChange   Lint MCP tool manifest changes in PRs
    ↓
Gate 4A — SchemaSync   Check prompts still match removed schema fields
```

Hosted complements (not in this repo): FuseGuard trip ingest, SchemaSync GitHub App — `driftguard-cloud`.

---

## Gate 1 — MockDrift

| | |
|---|---|
| **When** | You have pytest/integration tests with mocked APIs and need reliable drift assertions |
| **When not** | Plain JSON fixture diff is enough — use free `compare_json` or CI `drift-diff` |
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

## Gate 2B — agents.yaml lint (shipped)

| | |
|---|---|
| **When** | Production agents declare bindings in `.driftguard/agents.yaml`; catch schema/policy errors in CI |
| **When not** | Bindings managed only in hosted console with no manifest in Git |
| **Surface** | `.driftguard/agents.yaml`, GitHub Action `drift-agents-lint`, `driftguard lint-agents` |
| **Status** | **Shipped** (CP-2.1) — hosted watch resolution and `assert_a2a_coverage` remain roadmap |

```yaml
- uses: kioie/driftguard/.github/actions/drift-agents-lint@v0.3.3
  with:
    manifest: .driftguard/agents.yaml
```

Guide: [A2A Contract Watch](../guides/a2a-contract-watch.md) · Hosted: [agents.yaml reference](https://driftguard.org/docs/reference/agents-yaml).

---

## Harness bundle lint (shipped)

| | |
|---|---|
| **When** | Portable `.driftguard/` bundle with `gates.yaml`, `harness.lock`, optional `agents.yaml` |
| **When not** | MockDrift-only pytest with no gate toggles or fixture pins |
| **Surface** | `driftguard lint-harness`, GitHub Action `drift-harness-lint` |
| **Status** | **Shipped** (H1) — see [adr/0003-harness-bundle.md](../adr/0003-harness-bundle.md) |

```yaml
- uses: kioie/driftguard/.github/actions/drift-harness-lint@v0.3.3
  with:
    bundle: .driftguard
```

---

## Gate 1b — Evaluator (PGE, shipped)

| | |
|---|---|
| **When** | CI separates generator (pytest sensor) from reviewer (evaluator reads sensor JSON only) |
| **When not** | Single-job pytest is enough |
| **Surface** | `mockdrift evaluate --report`, GitHub Action `drift-evaluator` |
| **Status** | **Shipped** (H4) — rule-only; hosted LLM evaluator remains Enterprise |

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
| **1** | Free diff + CI hook | First API or MCP integration |
| **2** | MockDrift | Flaky mocks; need scenario replay |
| **3** | FuseGuard | Agent cost/runaway loops |
| **3b** | A2A Contract Watch | A2A Agent Card vs MCP skew (multi-agent) |
| **4** | ToolChange | MCP tool sprawl in monorepo |
| **5** | SchemaSync | Prompts must stay aligned with schema removals |
| **Parallel** | Hosted watches | Continuous monitoring — [trial](https://driftguard.org/start) |

JSON diff (`compare_json`) underpins all gates but is not a replacement for hosted watches.

---

## Next steps

| Goal | Doc |
|------|-----|
| CI hook only | [CI/CD guide](../guides/ci-cd.md) |
| Policy overview | [Policies README](./README.md) |
| Glossary | [Gate packages](../glossary.md#gate-packages-coverage-ladder) |
