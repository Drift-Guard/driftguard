# E13 — Semantic / NL drift classification

**Assessment status:** Draft  
**Owner tier:** Hosted  
**Wave:** D (Runtime guardrails) — consider **Defer** for MGFA-first rollout

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Tool descriptions change meaning without structural schema diff — operators miss semantic regressions. |
| **MGFA directness** | **Medium-low** — Dim 3 policy-adjacent detection; MGFA policy/SOP eval is **partner territory**. |
| **Revenue / strategic** | Pro/Team flagship hosted feature; upsell from structural watches. |
| **Differentiation** | LangSmith evals cover behaviour; we classify **contract-adjacent NL changes** on tool metadata — adjacent lane. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Partial** — hosted Pro/Team semantic drift exists per [ROADMAP.md](../../ROADMAP.md); boundary docs incomplete. |
| **Open-core boundary** | Correctly hosted-only; OSS stays structural. |
| **Dependency risk** | LLM classification cost, false positives; buyers may misread as regulatory compliance. |
| **Scope creep risk** | **Very high** — doc explicitly: "no SOP compliance claims". Legal/compliance claim risk is highest here. |

## Verdict

**Refine** (boundary docs) / **Defer** (MGFA lead story) — Valuable hosted SKU but **do not foreground in MGFA pitch** until structural evidence pack (E1/E4/E11) is solid. Strict disclaimer required.

## Refine delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Structural vs semantic boundary guide (MGFA Dim 3 policy-adjacent only; no SOP claims) | [semantic-drift-boundary.md](../../guides/semantic-drift-boundary.md) |
| OSS hosted API index — semantic drift route family + signal taxonomy | [hosted-api](../../reference/hosted-api.md#semantic-drift-proteam) |
| Glossary — structural vs semantic drift terms | [glossary](../../glossary.md) |
| MGFA product fit — Hosted DriftGuard + E13 catalog row | [SINGAPORE-MGFA-PRODUCT-FIT.md](../../SINGAPORE-MGFA-PRODUCT-FIT.md) |
| Hosted buyer boundary (sales/support prohibited claims) | Cloud `docs/compliance/SEMANTIC-DRIFT-BOUNDARY.md` |
| Drift management + guides hub cross-links | [drift-management](../../guides/drift-management.md) · [guides/README](../../guides/README.md) |

Assessment remains **Draft** until semantic classifier GA and buyer repos demonstrate stable triage workflows. Verdict unchanged: **Refine** (boundary docs shipped; NL metadata classifier and MGFA lead story deferred).
