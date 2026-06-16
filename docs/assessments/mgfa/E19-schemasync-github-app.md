# E19 — SchemaSync GitHub App (Gate 4B)

**Assessment status:** Draft  
**Owner tier:** Hosted  
**Wave:** B (Change management) — **blocked**

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Prompt updates lag schema PRs — draft-PR prompt fixes reduce merge friction for instruction/tool consistency. |
| **MGFA directness** | **Medium-high** — Dim 3 change management for prompt/schema coupling in PR workflow. |
| **Revenue / strategic** | Hosted App SKU (`schemasync_repo`); completes Gate 4 story beyond OSS lint. |
| **Differentiation** | GitHub-native prompt/schema coupling automation — few competitors in MCP agent repos. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Low today** — Gate 4B is **Gap** (cloud-only roadmap, not shipped). OSS 4A literal lint exists without App. |
| **Open-core boundary** | App correctly hosted-only. |
| **Dependency risk** | GitHub App ops (permissions, rate limits, multi-tenant); significant cloud eng. |
| **Scope creep risk** | **High** — auto-editing prompts touches customer IP and review processes. |

## Verdict

**Defer** — Strong eventual fit but **no shipped surface**; do not reference in MGFA materials until 4B exists. OSS E9 literal lint is interim story.
