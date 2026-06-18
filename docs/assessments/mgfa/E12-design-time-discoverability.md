# E12 — Design-time discoverability for MGFA buyers

**Assessment status:** Draft  
**Owner tier:** OSS docs  
**Wave:** E (Enablement)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Architects evaluating MGFA can't find DriftGuard when searching "agentic AI governance" or "MCP drift". |
| **MGFA directness** | **Medium** — Dim 4 transparency of ecosystem scope vs gaps; indirect but necessary for buyer trust. |
| **Revenue / strategic** | Top-of-funnel for SG/APAC; aligns with AGENT-DISCOVERY-ROADMAP (DES-001, DISC-005). |
| **Differentiation** | Positioning as **contract observability** lane avoids competing with full AGT stacks on discoverability keywords. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — docs/cursor rules only; DISC-005 and DES-001 are unblocked OSS work. |
| **Open-core boundary** | Safe — no hosted IP in OSS; link to trial, don't embed CP specs. |
| **Dependency risk** | Over-keyword stuffing hurts credibility; must pair with honest "not covered" list. |
| **Scope creep risk** | **Low** if bounded to docs; **high** if implied MGFA certification. |

## Verdict

**Go** — Essential enablement with minimal engineering; must explicitly state non-certification ([doc purpose](../../SINGAPORE-MGFA-PRODUCT-FIT.md#purpose-and-scope)).

## Go delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Design-time trigger keywords in `llms.txt` | [llms.txt](../../llms.txt) — MCP drift, agentic AI governance, contract observability |
| Design-time checklist + agent eval scenarios | [guides/agent-mcp.md](../../guides/agent-mcp.md) |
| Cursor rule template (DISC-004) | [examples/cursor-rule-driftguard.mdc](../../../examples/cursor-rule-driftguard.mdc) |
| Getting-started design-time + non-certification disclaimer | [getting-started.md](../../getting-started.md) |
| DISCOVERY.md cursor rule + Singapore checklist links | [DISCOVERY.md](../../DISCOVERY.md) |
| AGENT-DISCOVERY roadmap DES-001 / DISC-005 | [AGENT-DISCOVERY-ROADMAP.md](../../AGENT-DISCOVERY-ROADMAP.md) |

Assessment remains **Draft** — verdict **Go** (keywords + honest scope boundaries; no certification claims).
