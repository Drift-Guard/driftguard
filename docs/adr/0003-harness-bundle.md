---
status: accepted
---

# Harness bundle — portable gate config and LLM-readable sensors (H0–H5)

Harness engineering for DriftGuard means a **portable bundle** that CI, agents, and hosted watches share: fixture refs, gate toggles, agent bindings, and a **sensor output** agents can read in-loop. Today Gate 1 emits `mockdrift.assertion/v2` YAML from `MockDriftResult.emit_scenario()`; Gate 2B lints `.driftguard/agents.yaml` in isolation. There is no single artifact that ties fixtures, gates, and bindings together, no `mockdrift init`, no fixture marketplace index, and no evaluator (producer ≠ reviewer) CI step.

This ADR defines the **harness bundle** seam and phases **H0–H5** aligned with [gate-ladder.md](../policies/gate-ladder.md).

## Decision

Adopt a **harness bundle** directory (default `.driftguard/`) with three coordinated files plus optional fixture refs:

| File | Role | Status |
|------|------|--------|
| `.driftguard/agents.yaml` | Agent bindings, watches, skill↔tool map | **Shipped** (lint only) |
| `.driftguard/gates.yaml` | Enabled gates, advisory vs blocking, per-gate options | **Proposed** (H1) |
| `.driftguard/harness.lock` | Pinned fixture IDs/versions, package versions, default `failure_profile` | **Proposed** (H1) |
| `mockdrift.sensor/v1` JSON | LLM-readable assertion failure report (CI artifact + in-loop) | **Proposed** (H0) |

MockDrift remains **Gate 1 sensor**; an optional **Gate 1b evaluator** (rule-only first, LLM optional hosted) consumes sensor JSON only — never raw mock responses (PGE pattern).

## Constraints

- **Open-core boundary:** Bundle schema, sensor JSON, OSS fixture index, `mockdrift init`, rule evaluator action — this repo. Hosted marketplace CDN, managed LLM evaluator, bundle→watch ingest — `driftguard-cloud` only. Funnel per [OPEN_CORE.md](../../OPEN_CORE.md).
- **Assertion v2 is source of truth:** `mockdrift.sensor/v1` is a **projection** of `mockdrift.assertion/v2` results, not a second verdict semantics layer. Sensor adds `remediation`, `agent_actions`, and condensed `trace` for agents.
- **PASS never means task success:** Sensor and assertion share the defensive-correctness philosophy in [ASSERTION-V2.md](../mockdrift/ASSERTION-V2.md).
- **Gate ladder order preserved:** Bundle defaults enable MockDrift; FuseGuard, ToolChange, SchemaSync are opt-in via `gates.yaml`.
- **Portable across repos:** Monorepo = one bundle; polyrepo = publish bundle as git tag or OCI-style artifact; downstream CI consumes `harness.lock` URL.

## Seam shape

| Seam | Deep module | Adapters |
|------|-------------|----------|
| Sensor projection | `MockDriftResult.to_sensor_json()` (H0) | pytest plugin artifact, GitHub Action output, MCP `compare_json` sibling tools |
| Bundle lint | `driftguard lint-harness` (H1) | extends `drift-agents-lint`; validates agents + gates + lock consistency |
| Init scaffold | `mockdrift init` (H2) | LangGraph ref app, custom/proxy, CrewAI (H5) |
| Fixture catalog | OSS `fixtures/index.yaml` + `mockdrift demo <id>` (H3) | hosted catalog search/install (H5) |
| Evaluator | `mockdrift evaluate` / `driftguard/evaluator-agent` (H4) | CI job 2 after pytest sensor job |

```text
.driftguard/          harness bundle (portable)
  agents.yaml           bindings + watches
  gates.yaml            gate ladder toggles
  harness.lock          pinned fixtures + versions
mockdrift run           Gate 1 sensor → assertion/v2 → sensor/v1 JSON
lint-harness            agents + gates + lock
evaluator (optional)    reads sensor/v1 only (PGE)
fuseguard / toolchange / schemasync   Gates 2A–4A per gates.yaml
```

## `gates.yaml` (sketch — schema in H1)

```yaml
version: 1
gates:
  mockdrift:
    enabled: true
    advisory: false
  fuseguard:
    enabled: true
    max_tool_calls: 40
  agents_lint:
    enabled: true
  toolchange:
    enabled: true
    advisory: true
  schemasync:
    enabled: false
defaults:
  failure_profile: bubble_to_orchestrator
  runner: langgraph
```

## `harness.lock` (sketch — schema in H1)

```yaml
version: 1
fixtures:
  - id: stripe/required-field
    version: "1.0.0"
    path: packages/mockdrift/fixtures/stripe-required-field
  - id: mcp/tool-removed
    version: "1.0.0"
    ref: driftguard/fixtures-mcp@1.0.0   # future marketplace ref
packages:
  mockdrift: "0.3.x"
  fuseguard: "0.2.x"
manifests:
  toolchange:
    manifest: tools.json
    baseline: tools.baseline.json
```

Fixture IDs use `vendor/scenario` (e.g. `stripe/refund-required-field`, `mcp/tools-list-removed`).

## Sensor (`mockdrift.sensor/v1`)

Machine schema: [`sensor-v1.schema.yaml`](../mockdrift/sensor-v1.schema.yaml).

Emitted when `MOCKDRIFT_SENSOR_JSON` is set or pytest `--mockdrift-sensor-report=path`. Evaluator and in-loop agents consume this JSON; humans may still read assertion v2 YAML in logs.

## Tracked work (H0–H5)

| Phase | Deliverable | Repo | Priority | Depends on |
|-------|-------------|------|----------|------------|
| **H0** | `sensor-v1.schema.yaml`, `MockDriftResult.to_sensor_json()`, pytest artifact env | OSS | **P0** | — |
| **H1** | `gates.yaml` + `harness.lock` JSON Schema; `lint-harness` action; gate-ladder link | OSS | P1 | H0 |
| **H2** | `mockdrift init` — LangGraph + custom/proxy; outputs bundle + test skeleton + workflow | OSS | P1 | H1 |
| **H3** | OSS `fixtures/index.yaml`; 10 curated vendors (Stripe, Slack, MCP); `mockdrift demo <vendor/id>` | OSS | P2 | H0, H1 |
| **H4** | Rule-only evaluator (`mockdrift evaluate`, GitHub Action); PGE CI template | OSS | P2 | H0 |
| **H5** | CrewAI init template; hosted fixture catalog + install; optional hosted LLM evaluator | OSS + cloud | P3 | H2–H4 |

**H0 acceptance (this PR):**

- ADR proposed with schema landed.
- `docs/mockdrift/sensor-v1.schema.yaml` validates example PASS/FAIL payloads.
- `MockDriftResult.to_sensor_json()`, pytest `--mockdrift-sensor-report`, `MOCKDRIFT_SENSOR_JSON`.
- ROADMAP lists H0–H5 with links to this ADR.

## Rejected alternatives

| Proposal | Why rejected |
|----------|--------------|
| Sensor replaces assertion v2 | Breaks existing YAML consumers and duplicates verdict logic |
| Marketplace as full API mock SaaS | Out of scope; fixtures stay schema + mock bodies + expect criteria |
| Evaluator reads fixture `sample-error.json` | Collusion risk; evaluator sees sensor + expect metadata only |
| Single `harness.yaml` merging agents + gates | agents.yaml already shipped; split files keep lint surfaces independent |

## Test surface (when implemented)

| Test | Locks |
|------|-------|
| `test_sensor_json.py` | Projection from `MockDriftResult`; schema validation against sensor-v1 |
| `test_lint_harness.py` | gates + lock + agents cross-check |
| Golden sensor fixtures in `packages/mockdrift/tests/fixtures/sensor/` | Stable agent-facing failure text |
| Evaluator unit tests | Rule-only re-parse of sensor JSON |

## Consequences

- CI workflows may add a second job for evaluator (Gate 1b) without changing Gate 1 pytest semantics.
- Hosted ingest (bundle → watches) remains Enterprise roadmap; OSS lint is sufficient for polyrepo portability.
- Fixture marketplace community contributions require sensor remediation text quality — index PRs should include example FAIL sensor JSON.

## References

- [Gate ladder](../policies/gate-ladder.md)
- [ASSERTION-V2.md](../mockdrift/ASSERTION-V2.md)
- [assertion-v2.schema.yaml](../mockdrift/assertion-v2.schema.yaml)
- [sensor-v1.schema.yaml](../mockdrift/sensor-v1.schema.yaml)
- [A2A agents.yaml example](../../examples/a2a/agents.yaml)
- [ROADMAP.md](../ROADMAP.md) § Harness engineering
