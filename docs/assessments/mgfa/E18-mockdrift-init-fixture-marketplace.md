# E18 — MockDrift init + fixture marketplace

**Assessment status:** Draft  
**Owner tier:** OSS + hosted  
**Wave:** C (Pre-deploy testing)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Teams lack reproducible agent test scenarios aligned to MCP tool shapes; slow MockDrift adoption. |
| **MGFA directness** | **Medium-high** — Dim 3 reproducible scenario baselines for agent testing. |
| **Revenue / strategic** | H2–H3 OSS scaffolds + H5 hosted catalog drive Gate 1 adoption; regulated-industry packs are GTM content play. |
| **Differentiation** | Init templates (LangGraph/CrewAI) + vendor/scenario index — ecosystem packaging vs generic test frameworks. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — H2, H3, H5 **shipped** per [ROADMAP.md](../../ROADMAP.md). Curated regulated packs need content curation, not large eng. |
| **Open-core boundary** | Catalog API hosted; OSS index client — aligned. |
| **Dependency risk** | Fixture maintenance burden; stale packs harm credibility. |
| **Scope creep risk** | **Medium** if "regulated packs" implied certification — market as **examples**, not compliance bundles. |

## Verdict

**Refine** — Infrastructure shipped; invest in curated scenario content and honest labeling, not new platform features.

## Refine delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Init + fixture marketplace MGFA guide (H2/H3/H5, honest labeling) | [mockdrift-init-fixtures.md](../../guides/mockdrift-init-fixtures.md) |
| `mockdrift init` LangGraph + CrewAI + custom scaffolds documented | [packages/mockdrift/README.md](../../../packages/mockdrift/README.md) · `init_templates.py` |
| OSS fixture index curated packs + `lane` / `content_kind` labels | `packages/mockdrift/fixtures/index.yaml` |
| Hosted catalog `contentKind` + list disclaimer (examples, not compliance) | `cloud/src/services/mockdrift/fixture-catalog.ts` |
| CLI `mockdrift catalog` shows lane + content kind | `packages/mockdrift/mockdrift/cli.py` |
| Init scaffold tests (langgraph, crewai, hosted-only rejection) | `packages/mockdrift/tests/test_init_cmd.py` |
| Catalog labeling integration tests | `cloud/src/services/mockdrift/fixture-catalog.test.ts` |
| Singapore checklist step for init / fixture bootstrap | [singapore-agent-deployment-checklist.md](../../guides/singapore-agent-deployment-checklist.md) |

Assessment remains **Draft** until buyer repos adopt init scaffolds with hosted catalog installs. Verdict unchanged: **Refine** (curated **content** and labeling shipped; regulated packs are structural **examples** only).
