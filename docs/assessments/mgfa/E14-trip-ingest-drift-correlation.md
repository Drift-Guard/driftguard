# E14 — FuseGuard trip ingest and drift correlation

**Assessment status:** Draft  
**Owner tier:** Hosted  
**Wave:** D (Runtime guardrails)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Runtime trips (loop, budget, preflight block) disconnected from open drift incidents — weak post-mortems. |
| **MGFA directness** | **Medium** — Dim 3 runtime logging tied to contract incidents; supports Dim 2 evidence via correlated timeline. |
| **Revenue / strategic** | Enterprise FuseGuard 2B (`fuseguard_prod`); completes runtime story started in E5. |
| **Differentiation** | APM correlates spans; we correlate **contract drift events ↔ fuse trips** — niche but aligned with lane. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Low today** — OSS trip log schema **shipped** (FG-2A-6); hosted ingest + correlation is **roadmap** (FG-2B, not GA). |
| **Open-core boundary** | Ingest hosted; trip JSON OSS — correct. |
| **Dependency risk** | Multi-tenant ingest pipeline; PII in trip logs if customers misconfigure. |
| **Scope creep risk** | **Medium** — stay correlation-only, not full incident management platform. |

## Verdict

**Defer** — Clear value but **blocked on FG-2B delivery**; OSS trip logs sufficient for interim partner SIEM ingest. Re-assess when cloud ingest ships.
