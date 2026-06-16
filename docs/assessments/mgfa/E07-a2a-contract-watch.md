# E7 — A2A Contract Watch (Agent Card ↔ MCP correlation)

**Assessment status:** Draft  
**Owner tier:** OSS docs + hosted  
**Wave:** D (Runtime guardrails)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Agent Cards lag MCP deploys — orchestrators delegate against stale skill schemas (silent skew). |
| **MGFA directness** | **Medium** — Dim 3 multi-protocol change management; MGFA cites still-maturing protocols (A2A, MCP). |
| **Revenue / strategic** | Differentiated enterprise wedge for multi-agent platforms; depends on A2A adoption in SG/APAC. |
| **Differentiation** | **Strong** if correlation ships — no direct Microsoft AGT / LangSmith equivalent for Card↔MCP reconciliation. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Partial** — OSS guide + examples exist; hosted `get_agent_status`, correlation rules, block webhooks are **roadmap** (DES-003), guide says "when shipped". |
| **Open-core boundary** | Correlation engine hosted; offline `parse_agent_card` OSS — correct. |
| **Dependency risk** | A2A spec volatility; low adoption = low near-term revenue. |
| **Scope creep risk** | **High** — transport, identity, OAuth explicitly excluded; hold line on contract truth only. |

## Verdict

**Defer** (hosted correlation) / **Refine** (OSS narrative) — Compelling differentiation but **too immature to lead MGFA pitch** until DES-003 ships. Document as roadmap with honest partial status.
