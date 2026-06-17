# E4 — Drift history and audit export

**Assessment status:** Draft  
**Owner tier:** Hosted  
**Wave:** A (Evidence pack)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | GRC and internal audit need immutable drift history tied to watches — not ad-hoc webhook logs. |
| **MGFA directness** | **High** — Dim 3 logging/monitoring; Dim 2 evidence for human oversight (partner workflows consume exports). |
| **Revenue / strategic** | Team-tier differentiator; blocks enterprise SG deals without structured export + retention story. |
| **Differentiation** | APM vendors export traces, not contract-centric drift timelines. DriftGuard's export lane is narrow and defensible if scoped to watch lifecycle. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Partial** — Team audit export referenced in pricing/README but not fully specified in OSS docs; needs CSV/JSON schema, retention, immutability narrative in cloud. |
| **Open-core boundary** | Hosted-only — correct. |
| **Dependency risk** | Enterprise buyers may require WORM storage / SIEM — integrate, don't rebuild ([partner list](../../SINGAPORE-MGFA-PRODUCT-FIT.md#what-we-explicitly-will-not-build-partner-list)). |
| **Scope creep risk** | **High** if export becomes full GRC platform; keep to drift event + ack + watch metadata. |

## Verdict

**Refine** — High value for MGFA evidence pack but **requires hosted product completion** before Approved; do not over-promise immutability without legal/infra review.

## Refine delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Structured CSV/JSON export (`GET /api/drift/export`) with watch lifecycle fields | Cloud `drift-export.ts` · integration tests |
| Signed audit JSON (`format=audit`) with `ackTrail` + HMAC signature | Cloud Team/Fleet tier |
| Retention + immutability buyer narrative | Cloud `docs/compliance/DRIFT-AUDIT-EXPORT.md` |
| OSS API index aligned to shipped export schemas | [hosted-api](../../reference/hosted-api.md#drift-history-and-audit-team) |

Assessment remains **Draft** until buyer legal review of immutability claims. Verdict unchanged: **Refine** (export + retention docs shipped; WORM/SIEM remains partner territory).
