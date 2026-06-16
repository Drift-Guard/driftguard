# E15 — Evaluator / PGE sensor loop (MockDrift sensor v1)

**Assessment status:** Draft  
**Owner tier:** OSS  
**Wave:** C (Pre-deploy testing)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Same agent generates and judges tests — MGFA/testing best practice expects independent review. |
| **MGFA directness** | **High** — Dim 3 pre-deploy agent workflow testing; producer ≠ evaluator maps to governance testing sections. |
| **Revenue / strategic** | OSS H4 drives MockDrift adoption; Enterprise LLM evaluator stays hosted upsell (boundary). |
| **Differentiation** | LangSmith has evaluators but not MCP sensor JSON + rule-only CI gate tied to drift replay. PGE pattern is credible governance story. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — H0–H4 **shipped** ([sensor-v1.schema.yaml](../../mockdrift/sensor-v1.schema.yaml), `drift-evaluator` Action). Work is MGFA-facing documentation. |
| **Open-core boundary** | Rule evaluator OSS; LLM evaluator Enterprise hosted — must document split. |
| **Dependency risk** | Teams skip evaluator job; sensor schema versioning. |
| **Scope creep risk** | **Low** — explicitly not regulatory attestation. |

## Verdict

**Go** — Shipped, distinctive, low-cost documentation play for MGFA pre-deploy testing narrative.
