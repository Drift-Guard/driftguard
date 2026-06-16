# E20 — FuseGuard loop and budget runtime controls

**Assessment status:** Draft  
**Owner tier:** OSS  
**Wave:** D (Runtime guardrails)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Runaway agent tool loops and uncapped spend — operational risk adjacent to contract drift. |
| **MGFA directness** | **Medium** — Dim 3 guardrails limiting runaway/costly actions; complements E5 preflight (different control plane). |
| **Revenue / strategic** | OSS FuseGuard adoption; indirect hosted upsell via preflight (E5) not loop fuse itself. |
| **Differentiation** | Cost/loop containment is common in agent frameworks; **contract preflight** is the sharper differentiator — document separately per catalog note. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — FG-2A-1 through FG-2A-6 **Done** ([packages/fuseguard](../../../packages/fuseguard/README.md)). Documentation-only enhancement. |
| **Open-core boundary** | Fully OSS — appropriate. |
| **Dependency risk** | Overlap with framework-native limits (LangGraph recursion limits). |
| **Scope creep risk** | **Low** for docs; **medium** if positioned as primary MGFA control vs contract preflight. |

## Verdict

**Go** — Shipped capability; document MGFA cost/runaway narrative **separately from E5** to avoid muddying contract observability lane.
