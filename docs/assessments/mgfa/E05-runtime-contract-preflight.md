# E5 — Runtime contract preflight (FuseGuard)

**Assessment status:** Draft  
**Owner tier:** OSS + hosted  
**Wave:** D (Runtime guardrails)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Agents call tools after upstream schemas drift; irreversible actions need block-before-call, not post-hoc alerts. |
| **MGFA directness** | **High** — Dim 3 guardrails before/during action; maps to MGFA "block before irreversible tool call" pattern. |
| **Revenue / strategic** | Hosted preflight (CP-3.1) ties FuseGuard OSS to Pro watches; runtime gate is differentiated vs CI-only tools. |
| **Differentiation** | Lakera/Guardrails AI focus prompt injection; LangSmith doesn't block tool calls on schema drift. FuseGuard preflight is **contract-specific**, not general safety. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Partial** — OSS `FuseProxy`/`wrap_agent` + hosted `POST /api/preflight` **shipped** (FG-2A, CP-3.1). Reason taxonomy expansion is incremental. |
| **Open-core boundary** | Correct — runtime check needs hosted watches; OSS emits trip logs locally. |
| **Dependency risk** | Cache TTL, watch ID config complexity; false blocks if watches stale. |
| **Scope creep risk** | **Medium** — must not become HITL approval UI (partner territory). |

## Verdict

**Refine** — Shipped core is sound; prioritize reason taxonomy + MGFA pattern docs. Pair with E11 ack trail for oversight narrative, not standalone compliance claim.

## Refine delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Preflight + trip reason taxonomy (`blocked[].reasons[]`, `contract_drift_blocked`) | [runtime-contract-preflight.md](../../guides/runtime-contract-preflight.md) |
| MGFA "block before irreversible tool call" pattern + E11 ack pairing | Same guide · [webhooks-alerts](../../reference/webhooks-alerts.md#incident-acknowledgement-trail) |
| FuseGuard → `POST /api/preflight` integration + env table | [packages/fuseguard/README.md](../../../packages/fuseguard/README.md) · [examples/fuseguard/preflight_wrap.py](../../../examples/fuseguard/preflight_wrap.py) |
| Gate ladder + Singapore checklist runtime step | [gate-ladder](../../policies/gate-ladder.md) · [singapore-agent-deployment-checklist](../../guides/singapore-agent-deployment-checklist.md) |
| OSS hosted API index — preflight route family | [hosted-api](../../reference/hosted-api.md#preflight-runtime-gate) |
| Hosted preflight guide — reason taxonomy (no HITL UI) | [driftguard.org/docs/guides/preflight](https://driftguard.org/docs/guides/preflight) |

Assessment remains **Draft** — verdict **Refine** (taxonomy + MGFA pattern docs on shipped CP-3.1/FG-2A; trip ingest E14 and HITL remain out of scope).
