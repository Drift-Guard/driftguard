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

**Refine** — Strong MGFA fit but **premature for MGFA sales claims until manifest discipline is adopted in buyer repos**. CLI and Action block by default; harness MGFA profile stays advisory during bootstrap.

## Refine delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Manifest structural validation (duplicate names, scope, schema shape) | OSS `packages/toolchange/toolchange/manifest.py` |
| Manifest diff behavior tests (tool add/remove, advisory mode) | OSS `packages/toolchange/tests/` |
| MGFA change-management guide (discipline, advisory→blocking, evidence artifact) | [toolchange-change-management.md](../../guides/toolchange-change-management.md) |
| CI workflow template (blocking default) | [examples/workflows/toolchange.yml](../../../examples/workflows/toolchange.yml) |
| Harness `manifests.toolchange` baseline pinning + lint | `examples/harness-mgfa/.driftguard/harness.lock` · `lint-harness` |

Assessment remains **Draft** until buyer repos demonstrate stable manifest workflows. Verdict unchanged: **Refine** (hardening + docs shipped; GA positioning awaits customer adoption data).
