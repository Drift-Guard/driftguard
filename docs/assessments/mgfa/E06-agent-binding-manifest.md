# E6 — Agent binding manifest (`agents.yaml`)

**Assessment status:** Draft  
**Owner tier:** OSS + hosted  
**Wave:** B (Change management)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Multi-agent deployments lack declared tool/skill scope; orchestrators can't prove bindings match watched surfaces. |
| **MGFA directness** | **Medium-high** — Dim 1 risk bounding (declared scope); Dim 3 dev-time structural controls. |
| **Revenue / strategic** | Manifest in Git → hosted watch resolution → Pro coverage; foundation for A2A story (E7). |
| **Differentiation** | IdPs bound identity, not MCP skill↔tool maps. No mainstream competitor ships agents.yaml + drift correlation. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Partial** — CP-2.1 lint **shipped** (`drift-agents-lint`); hosted watch resolution and `assert_a2a_coverage` **roadmap** ([gate-ladder](../../policies/gate-ladder.md)). |
| **Open-core boundary** | Lint OSS; resolution hosted — aligned. |
| **Dependency risk** | A2A protocol maturity; customers may skip manifest if console-only workflow. |
| **Scope creep risk** | **High** for identity/OAuth — explicitly out of scope per A2A guide. |

## Verdict

**Refine** — Lint alone is insufficient for MGFA storytelling; **`assert_a2a_coverage` CI gate** must land before Approved. Hosted watch resolution from manifest is **shipped** (`POST /api/agents/manifest`). Do not claim Dim 1 IAM coverage.

## Refine delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Semantic manifest lint (duplicate ids, A2A↔watch alignment, skillToolMap discipline) | OSS `src/agents/validate.ts` |
| Manifest lint unit tests | OSS `src/agents/validate.test.ts` |
| MGFA binding manifest guide (inventory, hosted sync path, evidence artifact) | [agent-binding-manifest.md](../../guides/agent-binding-manifest.md) |
| CI workflow template (blocking lint on manifest PRs) | [examples/workflows/agents-lint.yml](../../../examples/workflows/agents-lint.yml) |
| Harness MGFA profile `agents.yaml` + `agents_lint` gate | `examples/harness-mgfa/.driftguard/` |
| Hosted watch URL → binding resolution | Cloud `POST /api/agents/manifest` · `missingWatchUrls` on 422 |

Assessment remains **Draft** until `assert_a2a_coverage` ships. Verdict unchanged: **Refine** (lint hardening + docs shipped; A2A correlation gate remains roadmap).
