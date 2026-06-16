# E17 — MockDrift cloud replay (`--simulate-drift`)

**Assessment status:** Draft  
**Owner tier:** OSS + hosted  
**Wave:** C (Pre-deploy testing)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | CI tests use stale mocks while production already drifted — pre-deploy tests don't reflect live contract breaks. |
| **MGFA directness** | **High** — Dim 3 pre-deploy tests using production-faithful drift fixtures (IMDA change-mgmt case study adjacency). |
| **Revenue / strategic** | M3 cloud replay requires Pro key — strong OSS→hosted bridge; differentiates MockDrift from static snapshots. |
| **Differentiation** | LangSmith replays traces; MockDrift replays **contract drift fixtures** from hosted incidents — unique lane. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — M3 **shipped**; tying fixtures to open drift incidents is workflow/docs + API glue in cloud. |
| **Open-core boundary** | Replay API hosted; OSS client flag — correct per OPEN_CORE. |
| **Dependency risk** | Pro key requirement limits OSS-only MGFA demos; fixture hygiene and PII in captured drift. |
| **Scope creep risk** | **Low** — PASS ≠ task success (by design); don't claim full regression of agent behaviour. |

## Verdict

**Refine** — Core replay shipped; prioritize incident→fixture linking and MGFA regression-test workflow docs before Approved.
