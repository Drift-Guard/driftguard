# E22 — Harness bundle ↔ gate package orchestration

**Assessment status:** Draft  
**Owner tier:** OSS  
**Wave:** C (Pre-deploy testing)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Teams enable MockDrift, ToolChange, SchemaSync ad hoc — no single portable baseline for MGFA pre-deploy evidence. |
| **MGFA directness** | **High** — Dim 3 single portable baseline toggling all pre-deploy gates. |
| **Revenue / strategic** | Increases multi-gate adoption; Singapore checklist profile is APAC GTM accelerator. |
| **Differentiation** | Unified `.driftguard/gates.yaml` orchestration is ecosystem-specific vs point CI tools. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — H1 **shipped**; example profile + MGFA phrase mapping in lint errors is docs/template work. |
| **Open-core boundary** | OSS-only — no issues. |
| **Dependency risk** | Example profile must track gate alpha states (ToolChange advisory, SchemaSync partial). |
| **Scope creep risk** | **Low** — orchestration doesn't add new semantics ([gate-ladder](../../policies/gate-ladder.md)). |

## Verdict

**Go** — Ship Singapore checklist example in `gates.yaml` + lint message mapping; pairs E8, E2, E15 for Wave C MGFA pack.

## Go delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Singapore checklist step mapping in `gates.yaml` example | [examples/harness-mgfa/.driftguard/gates.yaml](../../examples/harness-mgfa/.driftguard/gates.yaml) |
| MGFA control phrase mapping in `lint-harness` errors | `src/harness/mgfa-phrases.ts` · `lintHarnessBundle` |
| Harness bundle CI workflow template | [examples/workflows/drift-harness.yml](../../../examples/workflows/drift-harness.yml) |
| Wave C pairing cross-links (E8, E2, E15) | E08 · E02 · E15 assessments · [gate-ladder](../../policies/gate-ladder.md) |
| Unit tests for phrase mapping | `src/harness/mgfa-phrases.test.ts` · `src/harness/lint.test.ts` |

Assessment remains **Draft** — verdict **Go** (orchestration docs + lint mapping on shipped H1; no new gate semantics).
