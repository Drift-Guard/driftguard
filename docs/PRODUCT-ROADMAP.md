# DriftGuard product roadmap (hosted control plane)

**Audience:** Engineers and agents implementing hosted features. **Boundary:** Implementation code for watches, preflight, and console lives in **`driftguard-cloud`** (private). This file holds **product specs, task breakdowns, and acceptance tests** safe to share with OSS integrators.

**OSS companion:** [ROADMAP.md](./ROADMAP.md) (public docs hub) · [OPEN_CORE.md](../OPEN_CORE.md) (client vs hosted)

**Control plane phases (summary):** **Phase 0** status + alerts (in progress — see below) → Phase 1 preflight/KV → **Phase 2 agent bindings + policies** → Phase 3 FuseGuard enforcement → Phase 4 remediation PRs → Phase 5 scale. A2A Contract Watch ships primarily in **Phase 2**, with OSS MCP/CI surfaces in this repo.

**GTM (pre-revenue):** [Founding Lab](#founding-lab-gtm) → [Pricing architecture](#pricing-architecture-freshness-vs-breadth) (Critical / Fleet / Enterprise / Custom) → Phase 0 deploy → npm + Marketplace. See [Distribution & forum funnel](#distribution--forum-funnel).

**Agent handoff:** Implement Phase 0 in private **`driftguard-cloud`** on branch `feat/cp-phase-0-status-alerts`. OSS sync tasks in [CP-0-OSS](#cp-0-oss--oss-release-train-post-phase-0).

---

## Documentation rule (all implementers)

> **Document as you ship.** Every task below lists a **Doc deliverable**. Do not mark a task done until the doc PR is merged or updated in the same release train.

| When | Where | What |
|------|-------|------|
| New watch type or API field | `docs/reference/hosted-api.md` + cloud OpenAPI | Request/response shapes, auth |
| New MCP tool | `docs/reference/README.md`, `SYSTEM_PROMPT.md`, `docs/guides/agent-mcp.md` | When/when-not/siblings |
| New CI gate or manifest key | `docs/guides/ci-cd.md`, `docs/policies/gate-ladder.md` | Copy-paste workflow snippet |
| New webhook event | `docs/reference/webhooks-alerts.md` | Event name + conceptual fields |
| User-facing concept | `docs/glossary.md` | Term + one-line definition |
| Agent discoverability | `docs/llms.txt` | Link to new page |

Hosted-only UI copy: `driftguard-cloud` console help strings; link from OSS hub, do not duplicate secrets or internal runbooks here.

---

## Control Plane Phase 0 — status + alert enrichment

**Status:** Spec ready · **Next:** agent implementation in `driftguard-cloud`  
**Branch:** `feat/cp-phase-0-status-alerts`  
**DoD:** `npm run test:all` green in cloud repo; deploy staging → prod; refresh scrub mirror.

**Known bug (fix in CP-0.3):** `watcher-check.ts` enriches changes with `agentAction` for D1 storage but passes raw `diff` to `deliverAlerts` / PagerDuty / Jira — webhooks lack remediation hints.

### CP-0.0 — Pre-flight audit

| Step | Action |
|------|--------|
| 0.1 | Confirm private main is source of truth; scrub is sanitized mirror only |
| 0.2 | Baseline `npm run test:all` |
| 0.3 | Confirm `GET /api/watches/:id/status` missing today |
| 0.4 | Confirm alert enrichment bug in `watcher-check.ts` |

### CP-0.1 — `watch-status` service

| Field | Value |
|-------|--------|
| **Repo** | cloud |
| **File** | `src/services/watch-status.ts` |
| **Work** | `buildWatchStatus()` → canonical `WatchStatusPayload` with `driftStatus`, `incident`, `lastCheck`, `latestDriftEvent`, `agentActions[]`, `policy.recommendedAction` |
| **driftStatus enum** | `unknown` \| `ok` \| `drifted` \| `warning` \| `check_error` \| `resolved` |
| **Priority** | `check_error` > open/ack incident > resolved+recent drift > unknown > ok |
| **Depends on** | CP-0.7 `getLatestDriftEventForWatch` |
| **Test** | `src/services/watch-status.test.ts` — WS-U-001..008 |

### CP-0.2 — `GET /api/watches/:id/status`

| Field | Value |
|-------|--------|
| **Repo** | cloud |
| **Route** | `GET /api/watches/:id/status` — auth same as other watch routes |
| **Response** | `{ status: WatchStatusPayload }` |
| **MCP parity** | OSS `get_watch_status` proxies this route |
| **Test** | `tests/integration/watch-status.test.ts` — CP0-I-001..007 |

### CP-0.3 — Alert enrichment fix

| Field | Value |
|-------|--------|
| **Repo** | cloud |
| **Work** | After `enrichChangesWithAgentActions`, pass `alertDiff` (enriched changes) to `deliverAlerts` → `deliverIncidents`; PagerDuty `custom_details.changes` must include `agentAction` |
| **Test** | `src/services/watcher-alerts.test.ts` AL-U-001..003; `tests/integration/alert-enrichment.test.ts` CP0-I-010..012 |

### CP-0.4 — Webhook contract v1

| Field | Value |
|-------|--------|
| **Repo** | cloud (+ oss summary) |
| **Work** | Stable `drift.detected` payload: add `driftEventId`, `detectedAt`; every change includes `agentAction` |
| **Doc** | cloud `docs/WEBHOOK-CONTRACT.md`; oss [webhooks-alerts.md](./reference/webhooks-alerts.md) |
| **Test** | AL-U-001 asserts new fields |

### CP-0.5 — Console status badge (minimal)

| Field | Value |
|-------|--------|
| **Repo** | cloud |
| **Work** | Watch detail: `driftStatus` badge; top 3 `agentActions`; copy-to-clipboard |
| **Test** | E2E `CON-030` in `tests/e2e/console-tools.spec.ts` |

### CP-0.6 — Phase 2 stubs (no 404)

| Field | Value |
|-------|--------|
| **Repo** | cloud |
| **Routes** | `GET /api/agents/:id/status`, `GET /api/watches/:id/affected-agents`, `POST /api/watches/:id/trigger_remediation` → **501** `{ error, code: "not_implemented", phase: 2 }` |
| **Test** | CP0-I-020 |

### CP-0.7 — DB helper

| Field | Value |
|-------|--------|
| **Repo** | cloud |
| **Work** | `getLatestDriftEventForWatch(db, watchId)` in `src/db/d1/drift-events.ts` |

### CP-0.8 — Release

| Step | Action |
|------|--------|
| 1 | Bump cloud version (patch) |
| 2 | `npm run test:all` |
| 3 | Deploy staging → `smoke:trial` → prod |
| 4 | Run `scripts/export-scrub.sh` (or manual scrub refresh) |
| 5 | OSS doc PR: [hosted-api.md](./reference/hosted-api.md) if response shape final |

### Phase 0 acceptance

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Trial watch, baseline check | `GET /status` → `driftStatus: ok` |
| 2 | Fixture URL schema break on 2nd check | `drifted`, `latestDriftEvent.changes[].agentAction` set |
| 3 | Webhook on drift | Payload changes include `agentAction`; `driftEventId` present |
| 4 | MCP `get_watch_status` | Same shape as REST |
| 5 | `get_agent_status` before Phase 2 | 501 with stable JSON, not 404 |

---

## Control plane phases 1–5 (summary)

| Phase | Focus | Key deliverables | FuseGuard |
|-------|--------|------------------|-----------|
| **1** | Preflight / KV | `POST /api/preflight`, cache TTL, block reason `contract_drift_blocked` | Client already in OSS FuseGuard README |
| **2** | Agent bindings | `agent_bindings`, `agents.yaml` ingest, `get_agent_status` (real) | — |
| **3** | FuseGuard enforce | Cloud trip ingest, drift correlation in console | **Bundled Pro/Team** — not separate SKU |
| **4** | Remediation | SchemaSync draft PRs, `trigger_remediation` (real) | — |
| **5** | Scale | Fleet policies, analytics, SSO depth | — |

**FuseGuard monetization (locked):** OSS FuseGuard stays free (loop/budget fuse). Hosted **preflight + trip correlation** ships as **Pro/Team capability**, not a separate product. Defer separate SKU until ~10 paying teams ask for runtime-only.

**A2A:** Spec + docs only until multi-agent customer pull; do not homepage or Lab CTA until Phase 2 slice ships.

**Sequence after Phase 0:** Phase 1 preflight → [CP-0-OSS](#cp-0-oss--oss-release-train-post-phase-0) npm + Marketplace → Founding Lab cohort 1 feedback → Phase 2 + A2A implementation.

---

## CP-0-OSS — OSS release train (post Phase 0)

| ID | Repo | Work | DoD |
|----|------|------|-----|
| OSS-1 | oss | Verify `get_watch_status` MCP matches CP-0.2 response | `server.test.ts` contract test |
| OSS-2 | oss | Publish **`@kioie/driftguard-mcp`** (scoped; bare `driftguard` npm name taken) | `npx -y @kioie/driftguard-mcp@X.Y.Z` works |
| OSS-3 | oss | MCP Registry publish (`server.json` → scoped package) | Listed on MCP registry |
| OSS-4 | oss | GitHub Marketplace: `drift-coverage-preview` | Listing live; README badge |
| OSS-5 | oss | Update QUICKSTART, SYSTEM_PROMPT, examples to npm one-liner | No clone required for MCP |
| OSS-6 | oss | Chase `@driftguard` npm org async; migrate when acquired | Redirect docs |

**Marketplace timing:** Immediately after Phase 0 deploy + OSS-2 npm publish.

---

## Founding Lab (GTM)

**Context:** Pre-revenue; no manual design-partner outreach. Async, self-serve cohort.

| Element | Value |
|---------|--------|
| **Name** | DriftGuard Founding Lab |
| **Price** | **$5/month** recurring (covers ops; filters tire-kickers) |
| **Cap** | **20 seats** — show counter on landing (“N of 20 remaining”) |
| **Duration** | **90 days Team-equivalent** features |
| **Post-90d** | Offer **Founding Pro $29/mo locked** (first 50) or cancel |
| **Landing** | `driftguard.org/lab` |
| **Checkout** | LemonSqueezy / existing billing — webhook sets `plan: lab`, `lab_expires_at`, `lab_seat_number` |
| **Support** | Async only (GitHub Discussions / email) — no calls |
| **Marketing honesty** | Dev.to postmortems are **design targets** until Lab member #1; rewrite “customer-reported” → “architecture we built for” + Lab CTA |

### Lab implementation tasks (cloud)

| ID | Work | Test |
|----|------|------|
| LAB-1 | `/lab` landing page + seat counter | E2E: CTA visible |
| LAB-2 | Billing product $5/mo + webhook → `lab` plan flags | Integration: checkout webhook creates customer |
| LAB-3 | Post-checkout email: API key + `/ci/setup` + Cursor rule template | Manual smoke |
| LAB-4 | Day 7/30/83 lifecycle emails (watches configured nudge) | Queue/cron or ESP template |
| LAB-5 | Waitlist after 20 seats | Form + “cohort 2” capture |

### ICP (locked)

| Horizon | Buyer |
|---------|--------|
| **6 months** | Platform team (primary payer) |
| **Funnel** | Solo agent builder → CI preview → Lab / trial → **Critical / Fleet** → Enterprise |

---

## Pricing architecture (Freshness vs Breadth)

**Status:** Spec — implement after Phase 0, before new Lemon Squeezy SKUs.  
**Goal:** Self-serve tiers at **~85–96% gross margin** on hosted COGS; **Custom** at **150–200% markup on COGS** (~60–67% gross margin) with **funnel to Fleet**; **Enterprise** visible, **no list price**, **$3k–$50k+/yr** ACV.

### COGS model (internal)

```text
checks/mo = watches × (43_200 / interval_minutes)
COGS/mo   = checks/mo × COGS_PER_CHECK

COGS_PER_CHECK (planning): $0.00001  (stress: $0.000018)
```

---

### Self-serve tiers

| Tier | Axis | Price/mo | Watches (max) | Min interval | ~Checks/mo (full) | Target gross margin |
|------|------|----------|---------------|--------------|-------------------|---------------------|
| **Free** | Funnel | $0 | 3 | daily | 90 | — |
| **Pro** | Builder | **$59** | 30 | 15 min | 86k | ~98% |
| **Critical** | **Freshness** | **$149** | **12** | **1 min** | 518k | ~96% |
| **Fleet** | **Breadth** | **$179** | **75** | 5 min | 648k | ~96% |
| **Fleet+** | Heavy catalog | **$279** | **150** | 5 min | 1.30M | ~95% |

Annual: **20% off** prepay. Founding Pro **$29/mo locked** (first 50) unchanged.

**Engineering:** Critical **1-min** requires cron `*/1 * * * *` (today `*/5` caps effective interval at 5 min).

**Do not sell sub-minute** on self-serve or Custom — sub-minute / high fan-out → **Enterprise**.

---

### Enterprise (visible · contact only · no advertised price)

**Pricing page:** fourth column or full-width band **below** self-serve cards.

| UI rule | Value |
|---------|--------|
| **Price shown** | **None** — copy: *“Custom pricing for your organization”* |
| **Primary CTA** | **Contact us** → `/enterprise` form or `mailto:hello@driftguard.org?subject=Enterprise` |
| **Secondary CTA** | *“Schedule a call”* (Cal.com/Calendly when ready) |
| **Never** | Dollar amounts, “starting at”, or Lemon Squeezy checkout on Enterprise |

**Commercial target:** **$3,000–$50,000+/yr** ($250–$4,200+/mo equivalent). Goal is **thousands to tens of thousands** ACV, not self-serve ARPU.

**Enterprise = full deal** — everything in product + services buyers need to standardize contract observability org-wide:

| Category | Included |
|----------|----------|
| **Monitoring** | Unlimited watches (contractual cap), **1-min default**, custom SLA down to 30s only by SRE review |
| **Control plane** | Phase 0–5: status, preflight, agent bindings, policies, FuseGuard trip ingest, SchemaSync remediation PRs |
| **A2A** | Contract Watch, correlation rules, `assert_a2a_coverage`, registry dual-watch |
| **Identity & governance** | SSO/SAML, SCIM (when shipped), org API keys, audit export, DPA |
| **Integrations** | PagerDuty, Jira, Slack, webhooks, SIEM export |
| **Support** | Named CSM, onboarding workshop, Slack shared channel (optional), **99.9% SLA** (negotiated) |
| **Commercial** | Annual invoice, PO, security questionnaire, custom MSA |

**Qualification hints on `/enterprise`:** 50+ watches, multi-team agents, regulated industry, need SSO, need &lt;1 min on many endpoints.

**Implementation note:** Enterprise is **not** a `plan` enum checkout — `plan: enterprise` set manually after signed order; optional custom `interval_minutes` + watch cap in `customers` metadata.

---

### Custom quote (configurator · self-serve estimate)

**Purpose:** Capture **non-standard** configs (e.g. 2 watches @ 1 min) at **cost-plus** pricing while **funneling** configs that match **Critical / Fleet** to those tiers.

**Surface:** `/pricing#custom` widget on pricing page + `POST /api/billing/quote` (public, rate-limited).

#### Input bounds (hard validation)

| Parameter | Min | Max | Notes |
|-----------|-----|-----|-------|
| **Watches** | 1 | **12** | Above 12 → “Contact Enterprise” |
| **Interval** | **1 min** | 60 min | **No sub-minute** (reject 1 sec, 30 sec with message) |
| **At 1-min interval** | 1 watch | **12 watches** | “Max 12 watches at 1-minute checks” |

```text
if interval_minutes < 1:
  error → "Minimum check interval is 1 minute. Sub-minute monitoring → Enterprise."

if watches > 12:
  error → "More than 12 watches → Fleet or Enterprise."

if watches > 12 && interval_minutes === 1:
  error → "Max 12 watches at 1-minute interval on Custom."
```

#### Pricing formula (150–200% markup on COGS)

**Markup** = percentage **on top of** COGS (cost-plus), not gross margin:

```text
markup_rate = clamp(user_tier_preference, 1.50, 2.00)   # default 1.75 (175%)

monthly_cogs = watches × (43200 / interval_minutes) × COGS_PER_CHECK
monthly_quote = monthly_cogs × (1 + markup_rate)

floor: monthly_quote = max(monthly_quote, CUSTOM_QUOTE_FLOOR_USD)   # e.g. $49
ceiling hint: if monthly_quote > FLEET_LIST_USD → show Fleet funnel (below)
```

| Markup on COGS | Multiplier | Gross margin on COGS |
|----------------|------------|----------------------|
| 150% | 2.5× | 60% |
| 175% (default) | 2.75× | ~63.6% |
| 200% | 3.0× | 66.7% |

Self-serve Critical/Fleet stay **~90%+** margin; Custom is **deliberately lower** margin but higher absolute $ only for odd small configs.

**Example (planning COGS $0.00001/check, 175% markup):**

| Config | Checks/mo | COGS | Custom quote/mo |
|--------|-----------|------|-----------------|
| 2 watches @ 1 min | 86,400 | $0.86 | **max($49 floor, $2.37)** → **$49** (floor) |
| 12 watches @ 1 min | 518,400 | $5.18 | **$14.25** → floor **$49** or funnel to **Critical $149** |
| 12 watches @ 1 min @ 200% | 518,400 | $5.18 | **$15.54** → still below Critical — **must funnel** |

When custom quote **&lt; Critical list** but config ⊆ Critical bounds → **do not sell Custom** — show Critical only.

#### Funnel rules (always show recommendation card)

Evaluate after quote; **prefer tier checkout** over Custom when tier is cheaper or within **10%** of quote:

```text
1. If watches ≤ 12 AND interval_minutes == 1:
     recommend Critical ($149/mo) — "Best value for 1-minute monitoring"

2. If watches ≥ 40 AND interval_minutes >= 5:
     recommend Fleet ($179/mo) — "Cover more watches for less"

3. If watches > 12 OR interval_minutes < 1 OR monthly_quote > $400:
     recommend Enterprise — Contact us

4. If monthly_quote >= FLEET_LIST_USD (179) AND watches >= 20:
     recommend Fleet — "Your config fits Fleet; save X% vs custom"

5. Else:
     show Custom estimate + "Still exploring? Start Fleet trial" secondary CTA
```

**UX copy when Custom &lt; tier price:**

> *“Your setup (N watches · M-min) is included in **Critical** at $149/mo — no custom plan needed.”*  
> Primary button: **Get Critical** · Link: “Why not Custom?”

**Checkout:** Custom quotes **do not** auto-checkout on v1 — email capture + optional manual LS invoice, OR generate time-limited LS custom variant (PRICE-6). Default: **lead form** → sales sends link.

---

### Pricing page layout (target)

```text
[ Monthly | Annual (−20%) ]

┌─────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────────────┐
│  Pro    │ │ Critical  │ │  Fleet   │ │    ENTERPRISE       │
│  $59    │ │  $149     │ │  $179    │ │  Custom pricing     │
│ breadth │ │ freshness │ │ breadth  │ │  Full platform      │
│ light   │ │ 1-min     │ │ 75@5min  │ │  [ Contact us → ]   │
└─────────┘ └───────────┘ └──────────┘ └─────────────────────┘
     Fleet+ $279 (150 watches) — link, not fifth column hero

┌──────────────────────────────────────────────────────────────┐
│  BUILD YOUR PLAN (Custom estimate)                           │
│  Watches [1–12]  Interval [1–60 min]  →  Est. $__/mo         │
│  ⚡ Better deal: Critical $149/mo includes your config      │
└──────────────────────────────────────────────────────────────┘
```

Enterprise card **same visual weight** as Fleet (not hidden footer).

---

### Pricing implementation tasks (cloud + web)

| ID | Repo | Work | Test |
|----|------|------|------|
| **PRICE-1** | cloud | `PLAN_CATALOG`: add `critical`, rename display `team`→`fleet`, `fleet_plus`; `minIntervalMinutes` per tier | `plans.test.ts` |
| **PRICE-2** | cloud | Cron `*/1` when any customer has 1-min watches OR split cron tiers | Load test queue backlog |
| **PRICE-3** | web | `/pricing` Enterprise card — **no price**, Contact CTA | E2E: no `$` in enterprise card |
| **PRICE-4** | web | `/enterprise` landing — full-deal feature list, form, no checkout | E2E |
| **PRICE-5** | cloud | `POST /api/billing/quote` — validate bounds, return `{ quoteUsd, cogsUsd, markup, recommendations[] }` | `quote.test.ts` QUOTE-001..010 |
| **PRICE-6** | web | Custom configurator on pricing — sliders + funnel cards | E2E: 2@1min → recommends Critical |
| **PRICE-7** | cloud | Lemon Squeezy variants: Critical, Fleet, Fleet+ (+ annual) | `lemonsqueezy-audit.mjs` |
| **PRICE-8** | oss | `docs/reference/hosted-api.md` + glossary: Critical, Fleet, Enterprise, Custom | Link only |
| **PRICE-9** | cloud | `CUSTOM_QUOTE_FLOOR_USD`, `COGS_PER_CHECK` env vars | Document in cloud `.env.example` |

#### Quote API acceptance tests

| ID | Input | Expected |
|----|-------|------------|
| QUOTE-001 | 2 watches, 1 min | `recommendations` includes `critical`; quote ≥ floor |
| QUOTE-002 | interval 0.5 min | 400, message re Enterprise |
| QUOTE-003 | 13 watches, 5 min | 400, funnel `enterprise` |
| QUOTE-004 | 12 watches, 1 min | `critical` primary; custom quote &lt; $149 |
| QUOTE-005 | 75 watches, 5 min | funnel `fleet` (out of custom bounds → enterprise or fleet message) |
| QUOTE-006 | markup 150% vs 200% | quote scales 2.5× vs 3× COGS |
| QUOTE-007 | 40 watches, 5 min | out of custom max watches → enterprise/contact |

---

## Distribution & forum funnel

**Zero-touch priority (no manual DMs):**

| P | Channel | When |
|---|---------|------|
| 1 | `/lab` + checkout | Parallel with Phase 0 |
| 2 | Scoped npm + MCP Registry | After Phase 0 |
| 3 | GitHub Marketplace | After OSS-2 |
| 4 | Compare page: lockfiles vs live monitoring | OSS `/compare/lockfiles-vs-live-monitoring` |
| 5 | Dev.to Founding Lab post (honest pre-revenue) | After `/lab` live |
| **Defer** | Product Hunt, fake case studies, cold LinkedIn | Until ≥1 Lab member + Phase 0 live |

**Complementary OSS (do not compete — integrate in docs):**

| Tool | Role | DriftGuard line |
|------|------|-----------------|
| bellwether, mcp-lock, mcp-sentinel, mcpdiff | CI lockfile for **your** MCP server | DriftGuard watches **third-party** live MCP/API URLs |
| FlareCanary / API monitors | Vendor API polling | Differentiate MCP `tools/list` + `assert_coverage` + agent loop |

**Forum pain threads (monitor + templated helpful replies — no spam):**

| Pain | Where |
|------|--------|
| Stale `tools/list` cache (client-side) | anthropic/claude-code, openai/codex, microsoft/vscode MCP issues |
| Third-party MCP tool removed / schema changed | dev.to MCP postmortem intents, GitHub agent framework issues |
| Third-party API undocumented schema change | FlareCanary-style dev.to, Medium contract-testing posts |
| Tool poisoning / description drift | mcp-lock, mcpdiff communities |

**Automation:** Google Alerts for `"tools/list" MCP`, `"schema drift" API third party`; GitHub watch on MCP-tagged issues in major agent IDEs.

**Comment template (approved before post):** Acknowledge pain → DriftGuard watches live vendor MCP/API (not client cache) → free CI preview Action → Lab link for hosted fleet.

---

## Repo hygiene (cloud)

| Repo | Role |
|------|------|
| **`driftguard-cloud` (private main)** | Source of truth; all CP-* / LAB-* implementation |
| **`driftguard-cloud-scrub`** | Sanitized read mirror after each release — not implementation target |
| **`driftguard` (OSS)** | MCP/CI client; must match **deployed** hosted API |

Add `scripts/export-scrub.sh` on cloud release tags. OSS `hosted_info` must not advertise routes that return 404 (501 stubs OK per CP-0.6).

---

## A2A Contract Watch

**Problem:** [Agent2Agent (A2A)](https://github.com/a2aproject/A2A) Agent Cards declare skills and I/O schemas; specialists execute via **MCP** and HTTP APIs. Cards and registries update manually. **Silent mismatch** — card says skill X, runtime tool Y changed — causes multi-agent tasks to hang, retry, or poison downstream hops without failing at the A2A boundary.

**DriftGuard wedge:** Deterministic **declared vs actual** reconciliation across Agent Card, MCP `tools/list`, and optional OpenAPI — same diff engine as existing watches, plus **correlation rules** and **agent binding** scope from Control Plane Phase 2.

**Not in scope:** A2A transport, agent identity, token exchange (IdP/gateway lane).

### Architecture

```
.driftguard/agents.yaml  ──► agent_bindings (hosted)
        │
        ├── watch: a2a_card  (/.well-known/agent.json)
        ├── watch: mcp       (tools/list + inputSchema)
        └── watch: api       (optional OpenAPI per skill)
                │
                ▼
        correlate_card_mcp()  ──► breaking | warning | info
                │
                ├── alert (Slack / webhook + affectedAgents[])
                ├── preflight block (Phase 2 policy)
                └── CI: assert_a2a_coverage (fail PR)
```

---

### Watch types

| `watchType` | Source URL | Poll target | Baseline |
|-------------|------------|-------------|----------|
| **`a2a_card`** | Agent Card URL (e.g. `https://agent.example/.well-known/agent.json`) | Full JSON document | Prior snapshot; fingerprint of `skills[]` + per-skill `inputSchema` / `outputSchema` |
| **`mcp`** (existing) | MCP SSE/HTTP endpoint | `tools/list` normalized schema | Existing pipeline |
| **`api`** (existing) | OpenAPI or JSON schema URL | Spec or response shape | Existing pipeline |
| **`a2a_registry`** (optional P2) | Registry catalog entry URL | Cached card JSON vs live `wellKnownUrl` | Dual snapshot diff |

**Agent Card normalization (for diff):** Extract stable paths only — ignore transport metadata that does not affect contract:

- `name`, `version`, `url`, `skills[].id`, `skills[].name`, `skills[].description`
- `skills[].inputSchema`, `skills[].outputSchema` (JSON Schema subset)
- `authentication.schemes` (for AUTH-SURFACE lint only; not deep OAuth diff)

Store raw JSON in snapshot; diff uses normalized projection in `@driftguard/diff-core` (new profile: `a2a_card`).

---

### Agent binding manifest (Phase 2)

Committed at repo root or path in binding record:

```yaml
# .driftguard/agents.yaml
version: 1
agents:
  - id: billing-refund-v3
    slug: billing-refund-v3
    environment: production
    policy: production-guard
    a2a:
      cardUrl: https://billing-agent.example/.well-known/agent.json
      # Optional registry mirror to watch for cache skew
      registryUrl: https://registry.example/agents/billing-refund-v3
    mcp:
      configPath: .cursor/mcp.json
      # Explicit map: A2A skill id → MCP tool name(s)
      skillToolMap:
        process_refund: [stripe_refund, internal_ledger_post]
    watches:
      - type: a2a_card
        url: https://billing-agent.example/.well-known/agent.json
      - type: mcp
        url: https://mcp.internal.example/sse
    apis: []  # optional OpenAPI urls backing skills
```

Hosted **`agent_bindings`** + **`agent_binding_watches`** tables (Phase 2 CP-2.1) ingest this manifest via API or CI upload.

---

### Correlation rules

Rules run **after** individual watch diffs, on scheduled check or on-demand `correlate`. Output: `CorrelationFinding[]` with `ruleId`, `severity`, `message`, `agentAction`.

| Rule ID | Severity | Condition | `agentAction` template |
|---------|----------|-----------|-------------------------|
| **A2A-CARD-001** | breaking | Agent Card URL fetch fails 3 consecutive checks | Verify card endpoint and TLS; A2A discovery broken |
| **A2A-MCP-001** | breaking | Skill in `skillToolMap` references MCP tool name not in latest `tools/list` | Remove skill from card or restore tool; update map |
| **A2A-MCP-002** | breaking | Required property in skill `inputSchema` not present in mapped MCP tool `inputSchema` | Align card skill schema with MCP tool or update agent code |
| **A2A-MCP-003** | breaking | MCP tool removed (existing MCP watch breaking) while card skill still advertises capability | Update Agent Card or rollback MCP deploy |
| **A2A-SKEW-001** | warning | MCP schema fingerprint changed since last card snapshot; card fingerprint unchanged ≥ N hours | Silent skew — update Agent Card to match runtime |
| **A2A-SKEW-002** | warning | Card fingerprint changed; no corresponding PR touching `agents.yaml` or manifest | Verify deployment coordination |
| **A2A-REG-001** | breaking | Registry cached card ≠ live `wellKnownUrl` card | Refresh registry or fix stale catalog |
| **A2A-TASK-001** | breaking | Committed task fixture JSON ⊄ skill `inputSchema` (see CI) | Fix orchestrator payload or card schema |
| **A2A-OUT-001** | warning | Skill `outputSchema` required fields ⊄ OpenAPI response schema for mapped API | Align output contract |
| **A2A-AUTH-001** | warning | Card declares read-only scopes; MCP exposes tools matching write pattern (`delete_*`, `refund_*`, …) | Narrow MCP access or update card authentication block |

**Correlation inputs:**

- `skillToolMap` from manifest (required for A2A-MCP-*)
- Latest snapshots per bound watch
- Optional: `fixtures/a2a/{agentId}/*.json` task payloads in customer repo (CI only for A2A-TASK-001)

---

### CI gate: `assert_a2a_coverage`

**Purpose:** Fail PRs that introduce A2A/agent/MCP dependencies without watches and correlation pass (extends `assert_coverage`).

**Trigger files:** `.driftguard/agents.yaml`, `mcp.json`, `**/agent.json`, changes to `fixtures/a2a/**`

**Steps (hosted `POST /api/a2a/coverage/assert`):**

1. Parse `agents.yaml` (or inline body).
2. For each agent: ensure every `watches[]` entry exists on account (or trial allowlist).
3. Run **offline correlation** against latest **cached** snapshots (no live fetch in CI) OR live fetch if `assert_live: true` (Pro).
4. Return `{ ok, agents: [{ id, missingWatches[], findings[] }] }`.

**GitHub Action (OSS):** `.github/actions/a2a-coverage` — inputs: `manifest`, `api-key`, `fail-on` (`breaking`|`warning`).

**Exit codes:** `0` pass; `1` breaking finding or missing watch; `2` invalid manifest.

---

### MCP tools (OSS client)

| Tool | Phase | Purpose |
|------|-------|---------|
| `parse_agent_card` | A2A-3 | Local: fetch or parse Agent Card JSON; preview skills/schemas (no key) |
| `correlate_card_mcp` | A2A-6 | Hosted: run correlation rules for one agent binding (key) |
| `assert_a2a_coverage` | A2A-8 | Hosted: CI gate (key) |
| `get_agent_status` | CP-2.2 | Composite OK/Drifted/Blocked (includes A2A findings) |

Extend **`SYSTEM_PROMPT.md`** and **`docs/guides/agent-mcp.md`** when each tool ships.

---

## Implementation tasks (agent-sized)

Tasks are ordered by dependency. **Repo:** `oss` = this repo · `cloud` = `driftguard-cloud`.

### Stream A — Spec & docs foundation

#### A2A-1 — Glossary and concept page

| Field | Value |
|-------|--------|
| **Repo** | oss |
| **Depends on** | — |
| **Work** | Add glossary entries: Agent Card, A2A Contract Watch, skillToolMap, silent skew. Add `docs/guides/a2a-contract-watch.md` (overview + diagram linking MCP vs A2A). |
| **Outcome** | Reader understands declared vs actual for Agent Cards. |
| **Test** | `docs/README.md` links to guide; `llms.txt` includes new page; markdown links resolve. |
| **Doc deliverable** | This task *is* doc; cross-link from [gate-ladder.md](./policies/gate-ladder.md) as future Gate 2B. |

#### A2A-2 — Manifest JSON Schema

| Field | Value |
|-------|--------|
| **Repo** | oss |
| **Depends on** | A2A-1 |
| **Work** | Add `docs/schemas/agents.manifest.schema.json` (YAML described as JSON Schema). Validate examples in `examples/a2a/agents.yaml`. |
| **Outcome** | Invalid manifests fail local validation with clear errors. |
| **Test** | `npm run validate:agents-manifest` (new script) passes on example; fails on missing `skillToolMap` when skills present. |
| **Doc deliverable** | Schema field table in `docs/guides/a2a-contract-watch.md`. |

---

### Stream B — Diff & parse (OSS)

#### A2A-3 — `parse_agent_card` MCP tool

| Field | Value |
|-------|--------|
| **Repo** | oss |
| **Depends on** | A2A-2 |
| **Work** | MCP tool: input `url` or `cardJson`; output normalized skills list + fingerprint. No API key. Register in `server.ts`, `constants.ts`, tests in `server.test.ts`. |
| **Outcome** | Agents preview Agent Card contracts offline. |
| **Test** | Fixture `examples/a2a/sample-agent.json`; tool returns ≥1 skill; invalid JSON → `isError`. |
| **Doc deliverable** | [reference/README.md](./reference/README.md) MCP table; [agent-mcp.md](./guides/agent-mcp.md) when/when-not. |

#### A2A-4 — `a2a_card` diff profile in diff-core

| Field | Value |
|-------|--------|
| **Repo** | oss (`packages/diff-core` or `src/core/diff.ts`) |
| **Depends on** | A2A-3 normalization spec |
| **Work** | Profile `a2a_card`: normalize card JSON; classify breaking (removed skill, removed required input field, type change on skill id). |
| **Outcome** | `compare_json` works on two Agent Card snapshots with A2A-aware classification. |
| **Test** | Unit tests: remove skill → breaking; add optional output field → info; rename skill id → breaking. |
| **Doc deliverable** | [reference/README.md](./reference/README.md) — diff semantics § A2A card. |

---

### Stream C — Hosted watches (cloud)

#### A2A-5 — Watch type `a2a_card`

| Field | Value |
|-------|--------|
| **Repo** | cloud |
| **Depends on** | A2A-4 |
| **Work** | Migration: allow `watch_type = 'a2a_card'`. Fetcher: GET card URL with existing safe-fetch + SSRF policy. Snapshot via `a2a_card` normalizer. |
| **Outcome** | Users register Agent Card URL as first-class watch. |
| **Test** | Integration: register sample card URL → first snapshot OK → mutate fixture server → second check → drift event with breaking. |
| **Doc deliverable** | `hosted-api.md` + cloud OpenAPI `watchType` enum. |

#### A2A-6 — Correlation engine `correlate_card_mcp`

| Field | Value |
|-------|--------|
| **Repo** | cloud (+ oss MCP proxy) |
| **Depends on** | A2A-5, Phase 2 CP-2.1 bindings table |
| **Work** | Service `a2a-correlation.ts`: load binding + snapshots; evaluate rules A2A-MCP-001..003, A2A-SKEW-001..002, A2A-REG-001. API `POST /api/a2a/correlate`. MCP `correlate_card_mcp`. |
| **Outcome** | One call returns all findings for an agent binding. |
| **Test** | Integration matrix: (1) tool removed (2) required field added on MCP only (3) card stale warning. Each maps to expected `ruleId`. |
| **Doc deliverable** | Correlation rule table in `docs/guides/a2a-contract-watch.md` (sync with this file). |

#### A2A-7 — Alerts include A2A findings

| Field | Value |
|-------|--------|
| **Repo** | cloud |
| **Depends on** | A2A-6, CP-0.2 alert enrichment |
| **Work** | On correlation breaking after MCP/card check: attach `correlationFindings[]`, `affectedAgents[]` to webhook payload (`eventSchema: 2`). |
| **Outcome** | Slack/webhook shows “Agent Card / MCP mismatch” not just raw MCP diff. |
| **Test** | Webhook fixture test: payload contains `ruleId: A2A-MCP-002` and `agentAction`. |
| **Doc deliverable** | [webhooks-alerts.md](./reference/webhooks-alerts.md) — A2A fields. |

---

### Stream D — Agent bindings & CI (Phase 2 alignment)

#### A2A-8 — `assert_a2a_coverage` API + Action

| Field | Value |
|-------|--------|
| **Repo** | cloud + oss action |
| **Depends on** | A2A-6, CP-2.1 manifest ingest |
| **Work** | `POST /api/a2a/coverage/assert`; MCP tool; GitHub Action `a2a-coverage`; extend `repo-scan.ts` to parse `agents.yaml`. |
| **Outcome** | PR fails when manifest unwatched or correlation breaking (cached snapshots). |
| **Test** | Action e2e: PR adding agent without watch → fail; adding watch + green snapshots → pass. |
| **Doc deliverable** | [ci-cd.md](./guides/ci-cd.md) § A2A gate; starter workflow under `examples/workflows/`. |

#### A2A-9 — `get_agent_status` includes A2A

| Field | Value |
|-------|--------|
| **Repo** | cloud + oss MCP |
| **Depends on** | A2A-6, CP-2.2 |
| **Work** | Agent status = worst of watch statuses + open correlation findings. Return `blockedReason: a2a_contract_drift`. |
| **Outcome** | Orchestrator preflight can block delegate to drifted specialist. |
| **Test** | API test: seed binding with A2A-MCP-001 → status `drifted` or `blocked` per policy. |
| **Doc deliverable** | [hosted-api.md](./reference/hosted-api.md); preflight section in a2a guide. |

#### A2A-10 — Registry dual-watch (optional)

| Field | Value |
|-------|--------|
| **Repo** | cloud |
| **Depends on** | A2A-5 |
| **Work** | `a2a_registry` watch type; rule A2A-REG-001. |
| **Outcome** | Enterprise catalog skew detected. |
| **Test** | Two URLs, divergent JSON → A2A-REG-001 breaking. |
| **Doc deliverable** | Enterprise subsection in a2a guide. |

---

### Stream E — Task fixtures & auth lint

#### A2A-11 — Task fixture gate (A2A-TASK-001)

| Field | Value |
|-------|--------|
| **Repo** | oss (`packages/toolchange` or new `packages/a2a-bind`) |
| **Depends on** | A2A-8 |
| **Work** | CLI `a2a lint-tasks --manifest agents.yaml --fixtures fixtures/a2a/` validates each fixture against skill `inputSchema` from parsed card. |
| **Outcome** | Orchestrator payloads checked against card before deploy. |
| **Test** | Fixture missing required field → exit 1 with skill id in message. |
| **Doc deliverable** | [a2a-contract-watch.md](./guides/a2a-contract-watch.md) § task fixtures. |

#### A2A-12 — AUTH-SURFACE pack (A2A-AUTH-001)

| Field | Value |
|-------|--------|
| **Repo** | oss `packages/toolchange` |
| **Depends on** | A2A-6 |
| **Work** | Advisory/breaking lint: card auth scopes vs MCP tool name patterns. `--suite a2a-auth-surface-v1`. |
| **Outcome** | GRC-friendly “card says read-only, MCP has write tools” report. |
| **Test** | TC-A2A-001..003 in pytest; manifest with read scope + `delete_user` tool → warning. |
| **Doc deliverable** | [gate-ladder.md](./policies/gate-ladder.md) Gate 3A extension. |

---

### Stream F — Console & preflight integration

#### A2A-13 — Console A2A binding view

| Field | Value |
|-------|--------|
| **Repo** | cloud |
| **Depends on** | A2A-9 |
| **Work** | Fleet row: agent slug, card status, MCP status, correlation summary; link to findings. |
| **Outcome** | Operator sees silent skew without reading raw JSON. |
| **Test** | E2E console spec: seed binding → displays Drifted badge when A2A-SKEW-001. |
| **Doc deliverable** | Screenshot + steps in hosted help (cloud); link from OSS drift-management guide. |

#### A2A-14 — Preflight + FuseGuard agent_id path

| Field | Value |
|-------|--------|
| **Repo** | cloud + oss fuseguard |
| **Depends on** | A2A-9, CP-3.1 |
| **Work** | `POST /api/preflight` accepts `agentId`; returns blocked if A2A correlation breaking. FuseGuard `FUSEGUARD_AGENT_ID` documented (see fuseguard README). |
| **Outcome** | Specialist agent stops tool calls when card/MCP contract drifted. |
| **Test** | FuseGuard integration test with mocked preflight 409 + `contract_drift_blocked`. |
| **Doc deliverable** | [packages/fuseguard/README.md](../packages/fuseguard/README.md), a2a guide § runtime block. |

---

## Acceptance: “A2A Contract Watch fits”

Ship the **minimum lovable** slice when **all** of the following pass:

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Register `a2a_card` + MCP watches from `agents.yaml` | Both snapshots stored; fingerprints visible in console |
| 2 | MCP tool removes required field; card unchanged | A2A-MCP-002 or A2A-SKEW-001 fires within one poll cycle |
| 3 | Webhook / Slack | Payload includes `correlationFindings`, `agentAction`, `affectedAgents` |
| 4 | CI `assert_a2a_coverage` | PR with unwatched card URL fails; fixed watch passes |
| 5 | MCP `correlate_card_mcp` | Returns same findings as hosted check (parity test) |
| 6 | `get_agent_status` | Returns `drifted`/`blocked` with `ruleId` when correlation breaking |
| 7 | Docs | `a2a-contract-watch.md` + glossary + MCP reference updated; `llms.txt` entry |
| 8 | OSS boundary | No cloud secrets in OSS; open-core funnel preserved per OPEN_CORE |

Optional stretch (not required for v1): A2A-REG-001, A2A-OUT-001, A2A-12 auth pack.

---

## Task dependency graph

```
CP-0.1..0.8 (Phase 0) ─► OSS-1..6 (npm, Marketplace)
                    ─► LAB-1..5 (/lab GTM)
                    ─► PRICE-1..9 (Critical/Fleet/Enterprise/Custom)
                    ─► Phase 1 preflight

A2A-1 ─► A2A-2 ─► A2A-3 ─► A2A-4 ─► A2A-5 ─► A2A-6 ─┬► A2A-7
                                                      ├► A2A-8 ─► A2A-11
                                                      ├► A2A-9 ─► A2A-13
                                                      │              └► A2A-14
                                                      └► A2A-10 (optional)
A2A-6 ─► A2A-12
CP-2.1 (bindings) ─► A2A-6, A2A-8, A2A-9  [Phase 2 control plane]
CP-0.2 ─► A2A-7 (alert enrichment prerequisite)
```

---

## Revision history

| Date | Change |
|------|--------|
| 2026-06-08 | A2A Contract Watch: watch types, correlation rules, CI gate, 14 implementation tasks, doc-as-you-go rule |
| 2026-06-08 | **Phase 0** full spec (CP-0.0..0.8), OSS release train (OSS-1..6), **Founding Lab** (LAB-1..5), distribution/forum funnel, FuseGuard monetization policy, repo hygiene |
| 2026-06-11 | **Pricing architecture:** Critical (freshness) vs Fleet (breadth), **Enterprise** (visible, contact-only, $3k–50k+ ACV), **Custom quote** (1–12 watches, 1-min floor, 150–200% COGS markup, funnel to Fleet/Critical), PRICE-1..9 |
