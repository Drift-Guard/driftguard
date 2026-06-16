# E11 — Webhook and incident acknowledgement trail

**Assessment status:** Draft  
**Owner tier:** Hosted  
**Wave:** A (Evidence pack)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Drift alerts without ack discipline don't satisfy oversight audits; deploy pipelines need ack-gated blocks. |
| **MGFA directness** | **High** — Dim 3 failsafe/escalation; Dim 2 human response **evidence** (integrate with customer SOAR). |
| **Revenue / strategic** | Enterprise webhook stability + `acknowledge_drift` unlocks GRC integrations; Team tier stickiness. |
| **Differentiation** | Generic webhooks lack contract-specific ack semantics tied to agent policy unblock. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — `acknowledge_drift` MCP + webhooks **exist** ([webhooks-alerts](../../reference/webhooks-alerts.md), [glossary](../../glossary.md)). Work is payload stability docs + GRC integration guide. |
| **Open-core boundary** | Hosted-only — correct. |
| **Dependency risk** | Customer ITSM variance — document stable payload contract, don't build ServiceNow app in-house. |
| **Scope creep risk** | **Medium** — partner for approval queues; we supply ack trail only. |

## Verdict

**Go** — Core capability shipped; documentation and payload stability for GRC tools is high-value, low-risk MGFA evidence.
