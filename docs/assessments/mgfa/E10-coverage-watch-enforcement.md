# E10 — Coverage and dependency watch enforcement

**Assessment status:** Draft  
**Owner tier:** Hosted + OSS Actions  
**Wave:** E (Enablement)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Agent repos depend on external MCP servers with no proof those deps are monitored. |
| **MGFA directness** | **Medium** — Dim 1 third-party / external linkage visibility (partial — visibility not IAM). |
| **Revenue / strategic** | `assert_coverage` is Pro gate — directly converts trial OSS users to watched deps. |
| **Differentiation** | Unique MCP-centric coverage gate; OpenAPI lint doesn't enforce watch registration across agent deps. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — `assert_coverage` MCP tool + Actions **exist**; work is Singapore checklist template + DISC-004 cursor rule integration. |
| **Open-core boundary** | Enforcement requires hosted key — documented in README tier table. |
| **Dependency risk** | `parse_mcp_config` discovery completeness; false negatives if mcp.json incomplete. |
| **Scope creep risk** | **Low** — templates only. |

## Verdict

**Go** — Shipped capability + low-effort enablement; pairs with E2 CI narrative and E1 monitoring.
