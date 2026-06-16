# E9 — Prompt ↔ schema alignment (SchemaSync)

**Assessment status:** Draft  
**Owner tier:** OSS (+ 4B hosted App)  
**Wave:** B (Change management)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Prompts reference removed tool fields after schema changes — agents hallucinate parameters at runtime. |
| **MGFA directness** | **Medium-high** — Dim 3 instruction/tool consistency (rule-based controls). |
| **Revenue / strategic** | Gate 4A OSS drives SchemaSync App (4B) upsell; links ToolChange removals to prompt regressions. |
| **Differentiation** | NL policy engines (GRC) claim SOP compliance; SchemaSync is **literal structural alignment** — narrower, more honest for MGFA. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Partial** — `lint-nl` literal mode blocking **shipped**; semantic-hints **advisory only** (exit 0). Blocking semantic mode needs careful false-positive analysis. |
| **Open-core boundary** | 4A OSS; 4B App hosted — correct. |
| **Dependency risk** | Prompt location conventions vary; semantic blocking risks scope creep into policy eval. |
| **Scope creep risk** | **High** for semantic→blocking — doc warns "no full NL policy compliance claims". |

## Verdict

**Refine** — Literal mode is Go for MGFA CI story now; **defer semantic blocking** until accuracy proven. Don't bundle with E19 App before 4B exists.
