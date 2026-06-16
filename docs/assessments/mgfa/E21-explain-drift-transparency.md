# E21 — `explain_drift` operator transparency

**Assessment status:** Draft  
**Owner tier:** OSS  
**Wave:** E (Enablement)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Operators receive breaking diff signals without actionable remediation context. |
| **MGFA directness** | **Medium** — Dim 4 transparency of contract changes for integrators/operators (not end-user training). |
| **Revenue / strategic** | Public endpoint (no key) — trust builder and MCP discoverability; supports hosted upsell clarity. |
| **Differentiation** | Raw JSON diff tools don't explain breaking changes in operator language; complements structural watches. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — public endpoint **exists**; FAQ distinguishing operator vs end-user visibility is docs-only. |
| **Open-core boundary** | Public endpoint appropriately OSS-accessible; hosted may add richer context — document delta. |
| **Dependency risk** | LLM explanation quality/cost if expanded — keep bounded. |
| **Scope creep risk** | **Low** — not Dim 4 end-user training (partner/customer L&D). |

## Verdict

**Go** — Low effort MGFA Dim 4 support; essential honesty doc on who sees what.
