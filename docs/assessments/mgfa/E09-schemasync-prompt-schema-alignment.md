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

## Refine delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Literal blocking `lint-nl` (word-boundary + synonyms) | OSS `packages/schemasync/schemasync/lint_nl.py` |
| Semantic-hints advisory-only (always exit 0) | OSS `packages/schemasync/schemasync/cli.py` |
| Phase 4A test matrix SS-N01–N05 + CLI blocking tests | OSS `packages/schemasync/tests/` |
| MGFA prompt↔schema guide (literal blocking, advisory bootstrap, evidence artifact) | [schemasync-prompt-schema-alignment.md](../../guides/schemasync-prompt-schema-alignment.md) |
| CI workflow template (literal blocking default) | [examples/workflows/schemasync.yml](../../../examples/workflows/schemasync.yml) |
| Example prompts + removed-fields + synonyms | [examples/schemasync](../../../examples/schemasync/) |
| Harness `manifests.schemasync` pinning + lint | `examples/harness-mgfa/.driftguard/harness.lock` · `lint-harness` |

Assessment remains **Draft** until buyer repos demonstrate stable prompt/schema coupling workflows. Verdict unchanged: **Refine** (literal blocking + docs shipped; semantic→blocking and Gate 4B App deferred).
