# E1 — Continuous MCP/API contract monitoring

**Assessment status:** Draft  
**Owner tier:** Hosted  
**Wave:** A (Evidence pack)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Post-deploy MCP `tools/list` and API schema changes break agents silently; regulated buyers need ongoing contract truth, not one-time CI checks. |
| **MGFA directness** | **High** — Dim 3 post-deploy monitoring and change management are explicit MGFA themes (GovTech case studies in IMDA v1.5). |
| **Revenue / strategic** | Core hosted SKU (Pro/Team watches); strongest conversion path from OSS trial. Essential for Singapore enterprise narrative. |
| **Differentiation** | Microsoft AGT / LangSmith focus on traces, evals, and agent lifecycle — not manifest-level MCP contract polling. OpenAPI lint is pre-deploy only. DriftGuard's lane is **contract observability**, not APM. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Exists** — scheduled watches, MCP polling, drift events, webhooks ([hosted-api](../../reference/hosted-api.md)). Proposed work is SLO hardening and incident lifecycle docs, not net-new platform. |
| **Open-core boundary** | Clean — monitoring stays hosted per [OPEN_CORE.md](../../../OPEN_CORE.md). OSS client proxies when keyed. |
| **Dependency risk** | MCP spec churn; polling reliability varies by server implementation. Mitigate with health SLOs and explicit unsupported-server docs. |
| **Scope creep risk** | **Medium** — resist bundling behavioural anomaly detection or full APM; doc already lists as partner territory. |

## Verdict

**Refine** — Product exists and is the anchor MGFA story; investment should go to reliability, watch health SLOs, and buyer-facing incident lifecycle documentation rather than new capabilities.

## Refine delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Watch health SLO docs (`health.band`, 2× interval stale detection, `failureClass`) | OSS [hosted-api](../../reference/hosted-api.md) · [drift-management](../../guides/drift-management.md) |
| Incident lifecycle states (open → ack → resolve, auto-resolve on drift clear) | OSS docs + cloud `POST …/incident/resolve` |
| API health fields on `list_watches` / `get_watch_status` | Cloud `computeWatchHealth` |

Assessment remains **Draft** until E4 audit export Refine and buyer legal review. Verdict unchanged: **Refine** (docs + SLO fields shipped; full SLO dashboards remain CP-5.3).
