# E3 — MCP tool manifest change management (ToolChange)

**Assessment status:** Draft  
**Owner tier:** OSS  
**Wave:** B (Change management)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Small MCP tool schema edits cause outsized agent breakage; PRs merge without manifest review. |
| **MGFA directness** | **High** — Dim 3 change management for tool surfaces; aligns with IMDA emphasis on controlled protocol evolution. |
| **Revenue / strategic** | OSS credibility for regulated CI; upsell to hosted watches for post-merge monitoring. |
| **Differentiation** | OpenAPI/Spectral lint doesn't understand MCP manifest baselines or agent repo conventions. LangSmith tracks eval regressions, not PR-level tool manifest diffs. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Partial** — Gate 3A shipped but **`--advisory` default** (alpha); GA + PR-blocking requires TC-L01–L07 completion and customer manifest discipline. |
| **Open-core boundary** | Fully OSS-appropriate; hosted how-to only. |
| **Dependency risk** | Requires teams to maintain `tools.json` + baseline — adoption friction in immature MCP repos. |
| **Scope creep risk** | **Medium** — harness baseline pinning is reasonable; semantic tool intent belongs in SchemaSync/hosted, not ToolChange. |

## Verdict

**Refine** — Strong MGFA fit but **premature for MGFA sales claims at alpha/advisory default**. Prioritize GA with blocking default and harness bundle baseline pinning before deep-dive spec.
