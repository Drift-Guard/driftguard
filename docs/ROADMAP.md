# Public roadmap (OSS)

The **hosted product roadmap** (control plane, billing, console, alert routing) is maintained in the private **`driftguard-cloud`** repository — not in this public repo. See [OPEN_CORE.md](../OPEN_CORE.md).

## What this repo ships (OSS)

| Area | Status | Docs |
|------|--------|------|
| Local JSON / MCP diff | Shipped | [README.md](../README.md), [docs/QUICKSTART.md](./QUICKSTART.md) |
| MockDrift (Gate 1) | Shipped | [docs/mockdrift/](./mockdrift/) |
| FuseGuard (Gate 2A) | Shipped | [packages/fuseguard/README.md](../packages/fuseguard/README.md) |
| ToolChange (Gate 3A) | Shipped (alpha) | [packages/toolchange/README.md](../packages/toolchange/README.md) |
| SchemaSync lint-nl (Gate 4A) | Shipped (partial) | [packages/schemasync/README.md](../packages/schemasync/README.md) |

## Hosted capabilities (not in this repo)

Continuous watches, drift history, alerts, identity, billing, and console — [free trial](https://driftguard.org/start) · [pricing](https://driftguard.org/pricing).

**Hosted UX roadmap (private):** Portkey-inspired onboarding, analytics, console IA — `driftguard-cloud` · [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md).

**Control Plane Phase 0 (next hosted work):** [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md) § Control Plane Phase 0 — `GET /api/watches/:id/status`, alert `agentAction` enrichment, webhook v1, console badge. Implement in private `driftguard-cloud`.

**GTM (pre-revenue):** [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md) § Founding Lab, § **Pricing architecture** (Critical / Fleet / Enterprise / Custom).

**A2A Contract Watch (spec in OSS):** [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md) § A2A Contract Watch — Agent Card ↔ MCP correlation, `assert_a2a_coverage`, Phase 2 agent bindings. User guide: [guides/a2a-contract-watch.md](./guides/a2a-contract-watch.md).

## Harness engineering (H0–H5)

Portable **harness bundle** (fixtures + gates + agent bindings) and **LLM-readable sensor output** for in-loop self-correction and PGE-style CI (generator ≠ evaluator). ADR: [adr/0003-harness-bundle.md](./adr/0003-harness-bundle.md). Sensor schema: [mockdrift/sensor-v1.schema.yaml](./mockdrift/sensor-v1.schema.yaml).

| Phase | Deliverable | Status | Repo |
|-------|-------------|--------|------|
| **H0** | `mockdrift.sensor/v1` schema + `to_sensor_json()` + pytest artifact | **Shipped** — schema, `sensor.py`, `--mockdrift-sensor-report`, `MOCKDRIFT_SENSOR_JSON` | OSS |
| **H1** | `.driftguard/gates.yaml`, `harness.lock`, `lint-harness` | **Shipped** | OSS |
| **H2** | `mockdrift init` (LangGraph + custom/proxy scaffolds) | **Shipped** | OSS |
| **H3** | Fixture marketplace index (`vendor/scenario`), curated Stripe/Slack/MCP packs | **Shipped** — `fixtures/index.yaml`, `mockdrift demo vendor/id` | OSS |
| **H4** | Evaluator agent pack (rule-only CI; PGE job 2 reads sensor JSON only) | **Shipped** — `mockdrift evaluate`, `drift-evaluator` action | OSS |
| **H5** | CrewAI init template; hosted fixture catalog + install; optional managed LLM evaluator | **Shipped** — CrewAI scaffold; hosted `GET /v1/mockdrift/fixtures/catalog` + `install` (cloud); `mockdrift catalog` / `install` | OSS + cloud |

Aligns with [policies/gate-ladder.md](./policies/gate-ladder.md) — MockDrift remains Gate 1 sensor; FuseGuard / ToolChange / SchemaSync toggled via `gates.yaml`.

## Semantic drift (flagship)

Semantic / NL drift classification for hosted Pro/Team remains on the **hosted** roadmap until public launch. Local OSS diff is structural (JSON schema) only.

## Resources document (documentation hub)

Inspiration: [envzero docs](https://docs.envzero.com/) organizational patterns — product overview with concept pillars, progressive onboarding, audience-split guides, reference vs task docs, integration catalog, migration wizards, changelogs, agent discoverability (`llms.txt`), and per-topic troubleshooting. **Not** a copy of their content; adapt the *information architecture* for schema/MCP drift and the open-core funnel.

**Goal:** One discoverable hub (future `docs.driftguard.org` or equivalent) that routes humans and agents from “try offline” → trial → Pro monitoring without implying full self-host.

### Top-level structure (proposed)

| Section | Audience | Purpose |
|---------|----------|---------|
| **Overview** | Evaluators, platform leads | What DriftGuard does, OSS vs hosted matrix, where it sits in CI/agent workflows |
| **Getting started** | Developers, SREs | Linear onboarding: install → first diff → MCP connect → optional trial |
| **Guides** | Practitioners by role | Task-oriented flows (watches, CI gates, remediation) |
| **Reference** | Integrators, agents | MCP tools, CLI, hosted API, schemas, webhook/event shapes |
| **Integrations** | DevOps, IDP teams | CI/CD, MCP clients, alert channels, registry listings |
| **Policies & gates** | Platform / security | Coverage rules, breaking-change policy, gate packages (MockDrift → SchemaSync) |
| **Migrate & adopt** | Teams switching tools | Import paths from manual checks, OpenAPI snapshots, competitor-ish workflows |
| **Changelog & status** | All users | Product release notes, breaking API/MCP changes, status link |
| **Security & trust** | Security reviewers | Public-repo posture, data handling, hosted boundary (no infra leakage) |
| **Community & support** | Contributors, customers | OSS contributing, support tiers, tutorials index |

### Section detail (DriftGuard-specific)

#### Overview (landing)

- **Concept pillars** (parallel to envzero’s feature blocks): structural diff, watches, drift events, MCP tool/schema polling, remediation hints, CI coverage gates.
- **Workflow fit diagram**: where DriftGuard sits between `mcp.json` / API payloads, CI, agents, and hosted console — mirror envzero’s “sits between code and cloud” framing for “sits between contracts and consumers.”
- **Capability matrix**: reuse and extend `hosted_info` / README table (offline tools vs Pro tools).
- **Next steps** links: Quick start, CI funnel, start trial, pricing — always respect [OPEN_CORE.md](../OPEN_CORE.md).

**Priority:** P0 · **Status:** Shipped — [docs/README.md](./README.md) hub landing with workflow diagram

#### Getting started

Progressive checklist (envzero-style “create org → connect VCS → first deploy”):

1. Install OSS client (`npm ci && npm run build`)
2. Run first `compare_json` / CLI diff
3. Connect MCP client (Cursor, Claude Desktop, Windsurf, Zed) from [examples/mcp-client-config.json](../examples/mcp-client-config.json)
4. Preview dependencies with `parse_mcp_config` (offline)
5. Optional: CI hook with [examples/workflows/driftguard-starter.yml](../examples/workflows/driftguard-starter.yml)
6. Upgrade path: trial → API key → `suggest_watches` / `register_watch`

Include **glossary** page mapping DriftGuard terms to familiar equivalents (watch ≈ monitored endpoint; drift event ≈ detected schema change; breaking vs additive; gate packages).

**Priority:** P0 · **Status:** Shipped (foundation) — [getting-started.md](./getting-started.md) funnel + [glossary.md](./glossary.md); [QUICKSTART.md](./QUICKSTART.md) remains copy-paste companion

#### Guides (audience-split)

| Guide track | Topics |
|-------------|--------|
| **Developer** | Local diff workflows, pre-commit checks, interpreting diff output, `explain_drift` remediation |
| **Agent / MCP** | Tool selection (`when` / `when-not` / siblings), offline-first order, `SYSTEM_PROMPT.md` companion |
| **Platform / admin** | Watch lifecycle (create, schedule, coverage), team API keys, alert routing (hosted) |
| **Drift management** | Detection → triage → fix: breaking classification, event history, linking to PRs (hosted) |
| **CI/CD** | Hook → preview → trial → gate funnel per [docs/CI.md](./CI.md); GitLab + Marketplace pointers |

Each guide page: overview → prerequisites → steps → **next steps** cross-links (envzero pattern).

**Priority:** P0 (developer + CI), P1 (drift management, platform) · **Status:** Shipped — [guides/](./guides/) (developer, agent-mcp, ci-cd, drift-management, platform-admin)

#### Reference (vs guides)

Split **how to accomplish a task** (guides) from **exact contracts** (reference):

| Reference type | Content |
|----------------|---------|
| **MCP tools** | Full catalog with auth requirements, inputs/outputs, sibling tools |
| **CLI** | `driftguard diff`, `driftguard mcp`, exit codes |
| **Hosted REST API** | OpenAPI-style pages for watches, events, keys (hosted site; link only from OSS hub) |
| **Diff semantics** | Breaking vs non-breaking rules (`@driftguard/diff-core`) |
| **Schemas** | MockDrift assertion v2, gate package manifests |
| **Webhooks / alerts** | Event types, payload fields, retry behavior (hosted) |

**Priority:** P0 (MCP + CLI + diff semantics), P1 (hosted API + webhooks) · **Status:** Shipped (OSS-appropriate) — [reference/README.md](./reference/README.md), [hosted-api.md](./reference/hosted-api.md), [webhooks-alerts.md](./reference/webhooks-alerts.md); full OpenAPI on driftguard.org at hosted launch

#### Integrations

Catalog pattern (envzero integrations index + per-vendor child pages):

| Integration | Doc type |
|-------------|----------|
| **GitHub Actions** | Starter workflow, composite actions, Step Summary / trial deep links |
| **GitLab CI** | Template job, env vars |
| **MCP clients** | Per-client `mcp.json` snippets |
| **MCP Registry** | [DISCOVERY.md](./DISCOVERY.md), `server.json` publish path |
| **Notifications** | Slack, email, webhooks (hosted) |
| **IDP / portals** | Future: Backstage-style “register watches from catalog” (P3) |

**Priority:** P1 · **Status:** Shipped — [integrations/](./integrations/) landing + GitHub Actions, GitLab, MCP client stubs

#### Policies & gates

Envzero parallels: approval policies, ready-to-use policies, destroy protection → DriftGuard equivalents:

- **Coverage policy**: `assert_coverage`, required watches per repo
- **Breaking-change policy**: fail CI on breaking, allow additive
- **Gate ladder**: MockDrift (1) → FuseGuard (2A) → ToolChange (3A) → SchemaSync (4A) — when to adopt each
- **Open-core guardrails**: what policies cannot be enforced from OSS alone

**Priority:** P1 · **Status:** Shipped — [policies/](./policies/) index + [gate-ladder.md](./policies/gate-ladder.md); package READMEs remain implementation detail

#### Migrate & adopt

Envzero’s multi-step migration wizard docs (connect → resolve → review → go live) suggest a similar **adoption wizard** narrative for DriftGuard:

| Adoption path | Steps to document |
|---------------|-------------------|
| **From zero** | Getting started track |
| **From manual JSON diff** | Pin baseline snapshots, wire CLI/MCP |
| **From CI-only checks** | Add preview + hosted watches without blocking dev flow |
| **From mcp.json sprawl** | `parse_mcp_config` → `suggest_watches` import |
| **Troubleshooting** | Per-path failure modes (missing API key, false positives, rate limits) |

**Priority:** P2 · **Status:** Shipped (foundation) — [migrate/README.md](./migrate/README.md) adoption paths + per-path troubleshooting

#### Changelog, agent discoverability, trust

| Asset | Notes |
|-------|-------|
| **Changelog** | Product-facing release notes (repo [CHANGELOG.md](../CHANGELOG.md) is dev-facing); call out breaking MCP tool or diff-semantics changes |
| **`llms.txt` / index** | Machine-readable sitemap for agents (envzero pattern); point to QUICKSTART, SYSTEM_PROMPT, tool matrix |
| **Security overview** | Public client audit posture; hosted data boundaries; link [docs/security/](./security/) where appropriate |
| **Status & trial** | External links: driftguard.org status, `/start`, `/pricing` |

**Priority:** P1 (`llms.txt`), P2 (product changelog hub) · **Status:** Shipped — [llms.txt](./llms.txt), root [llms.txt](../llms.txt) pointer, [changelog/README.md](./changelog/README.md), [security/README.md](./security/README.md)

### Implementation phases

| Phase | Deliverable | Priority |
|-------|-------------|----------|
| **1 — Foundation** | Overview landing, unified getting-started funnel, glossary, MCP/CLI reference index | P0 · **Shipped** — [docs/README.md](./README.md), [getting-started.md](./getting-started.md), [glossary.md](./glossary.md), [reference/](./reference/) |
| **2 — Practitioner** | CI + drift-management guides, integrations catalog, gate ladder page | P1 · **Shipped** — [guides/](./guides/), [integrations/](./integrations/), [policies/gate-ladder.md](./policies/gate-ladder.md) |
| **3 — Funnel & agents** | `llms.txt`, adoption/migration paths, product changelog section | P2 · **Shipped** — [llms.txt](./llms.txt), [../llms.txt](../llms.txt), [migrate/](./migrate/), [changelog/](./changelog/) |
| **4 — Hosted depth** | API reference, webhooks, alert routing, semantic drift docs (hosted launch) | P2–P3 · **Partial (OSS)** — [hosted-api.md](./reference/hosted-api.md), [webhooks-alerts.md](./reference/webhooks-alerts.md); full OpenAPI, payload schemas, semantic drift — **blocked on hosted launch** |

### Open questions

- **Hosting:** GitHub Pages from `docs/` vs dedicated docs site (search, versioning)?
  - **Recommendation (OSS hub only):** Publish `docs/` via GitHub Pages (`/docs` folder on `main`) for the open-core funnel — zero infra, tracks repo PRs. Use `docs.driftguard.org` CNAME when ready. Keep **hosted API OpenAPI, webhook signing, and console walkthroughs** on driftguard.org; OSS hub links out ([hosted-api.md](./reference/hosted-api.md)). Add dedicated search/versioning only if traffic outgrows static markdown.
- **Boundary:** Keep hosted API/console docs on driftguard.org only, with OSS hub linking out? **Yes** — aligns with [OPEN_CORE.md](../OPEN_CORE.md); Phase 4 OSS pages are indexes only.
- **Versioning:** Pin docs to npm/MCP server version (envzero ties API reference to product version)?
