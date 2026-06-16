# E16 — Canonical diff semantics (`diff-core`)

**Assessment status:** Draft  
**Owner tier:** OSS  
**Wave:** E (Enablement)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Inconsistent diff results across CLI, cloud, and ToolChange undermine audit credibility. |
| **MGFA directness** | **Medium** — Dim 3 reproducible structural checks; foundation for all gate verdicts. |
| **Revenue / strategic** | Trust anchor for entire ecosystem; low direct revenue but high technical credibility with architects. |
| **Differentiation** | Shared `@driftguard/diff-core` across gates is engineering moat vs ad-hoc JSON diff utilities. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — ARCH-U01 **shipped**; vector expansion for MCP edge cases is incremental test work. |
| **Open-core boundary** | Core OSS library — intentionally public. |
| **Dependency risk** | Profile drift between `cli` and `hosted` if not kept in sync. |
| **Scope creep risk** | **Medium** if semantic layer added here — belongs in hosted semantic pipeline, not diff-core. |

## Verdict

**Go** — Expand contract vectors + "single source of truth" narrative; low effort, high credibility for MGFA structural evidence chain.
