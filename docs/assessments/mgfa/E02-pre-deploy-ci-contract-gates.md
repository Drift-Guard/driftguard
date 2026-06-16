# E2 — Pre-deploy CI contract gates

**Assessment status:** Draft  
**Owner tier:** OSS + hosted  
**Wave:** B (Change management)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Agent repos ship MCP/tool changes without structural gates; MGFA expects pre-deployment safety testing. |
| **MGFA directness** | **High** — Dim 3 dev controls and pre-deploy testing; maps directly to gate ladder (MockDrift, evaluator, coverage). |
| **Revenue / strategic** | OSS funnel to hosted `assert_coverage` (Pro); CI Actions drive adoption before key purchase. |
| **Differentiation** | Generic JSON diff / OpenAPI validators lack MCP manifest + agent-binding context. Gate ladder is a packaged MGFA-ready narrative competitors don't ship as one spine. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — Gate 1, H4 evaluator, harness lint, `drift-diff`, coverage Actions all **shipped** ([gate-ladder](../../policies/gate-ladder.md)). Work is packaging + trial→Pro path clarity. |
| **Open-core boundary** | Correct split: structural gates OSS; coverage enforcement needs hosted key. |
| **Dependency risk** | npm publish still blocked at 0.1.1 ([AGENT-DISCOVERY-ROADMAP](../../AGENT-DISCOVERY-ROADMAP.md) DISC-001) — limits one-session CI adoption until resolved. |
| **Scope creep risk** | **Low** if framed as orchestration/docs; **high** if we promise full MGFA compliance from CI alone. |

## Verdict

**Go** — Mostly narrative and template work on shipped gates; high MGFA directness and low engineering cost once npm/discovery blockers clear.
