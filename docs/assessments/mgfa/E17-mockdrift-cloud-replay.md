# E17 — MockDrift cloud replay (`--simulate-drift`)

**Assessment status:** Draft  
**Owner tier:** OSS + hosted  
**Wave:** C (Pre-deploy testing)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | CI tests use stale mocks while production already drifted — pre-deploy tests don't reflect live contract breaks. |
| **MGFA directness** | **High** — Dim 3 pre-deploy tests using production-faithful drift fixtures (IMDA change-mgmt case study adjacency). |
| **Revenue / strategic** | M3 cloud replay requires Pro key — strong OSS→hosted bridge; differentiates MockDrift from static snapshots. |
| **Differentiation** | LangSmith replays traces; MockDrift replays **contract drift fixtures** from hosted incidents — unique lane. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — M3 **shipped**; tying fixtures to open drift incidents is workflow/docs + API glue in cloud. |
| **Open-core boundary** | Replay API hosted; OSS client flag — correct per OPEN_CORE. |
| **Dependency risk** | Pro key requirement limits OSS-only MGFA demos; fixture hygiene and PII in captured drift. |
| **Scope creep risk** | **Low** — PASS ≠ task success (by design); don't claim full regression of agent behaviour. |

## Verdict

**Refine** — Core replay shipped; prioritize incident→fixture linking and MGFA regression-test workflow docs before Approved.

## Refine delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Hosted replay API links open incident + latest drift event | `cloud/src/services/mockdrift/simulate.ts` · `POST /v1/mockdrift/fixtures/from-watch` |
| Incident metadata in fixture payload (`driftEventId`, `incidentStatus`) | `cloud/src/services/mockdrift/fixture-template.ts` |
| Integration test MD-C-007 incident linkage | `cloud/tests/integration/products.test.ts` |
| MGFA regression workflow guide (incident → replay → PR gate) | [mockdrift-cloud-replay.md](../../guides/mockdrift-cloud-replay.md) |
| CI workflow template (`--simulate-drift` + cache) | [examples/workflows/mockdrift-replay.yml](../../../examples/workflows/mockdrift-replay.yml) |
| Example `@drift_replay(fixture="simulate-drift")` test | [examples/mockdrift/test_simulate_drift_replay.py](../../../examples/mockdrift/test_simulate_drift_replay.py) |
| Cache persists `incident` block in `cloud-meta.json` | `packages/mockdrift/mockdrift/cache.py` |
| Harness `manifests.mockdrift_replay` pinning example | `examples/harness-mgfa/.driftguard/harness.lock` |

Assessment remains **Draft** until buyer repos run replay gates against live open incidents. Verdict unchanged: **Refine** (incident linkage + MGFA workflow docs shipped; fixture **content** fidelity still v1 template).
