# Intellectual property & public disclosure policy

**Applies to:** `kioie/driftguard` (public OSS) and `kioie/driftguard-cloud` (private product)  
**Status:** Active — review quarterly or before major launches  
**Canonical:** This file in the OSS repo (contributor-facing). Cloud copy: `driftguard-cloud/docs/policies/IP-BOUNDARY-POLICY.md`.

High-level boundary: [OPEN_CORE.md](../../OPEN_CORE.md). Agent rules: [AGENTS.md](../../AGENTS.md) § Intellectual property.

---

## Purpose

1. Keep **competitive moat**, product strategy, and hosted implementation detail in **`driftguard-cloud`** only.
2. Keep the **public repo** useful for developers (CLI, MCP, gates, integration guides) without leaking what we build next or how we position against others.
3. Avoid **public statements** that a DriftGuard product surface was **modeled on, copied from, or inspired by** a specific third-party commercial product — reduces legal and competitive exposure.

When in doubt: **cloud first**, link out from OSS at user-facing depth only.

---

## Cloud-only (never in public OSS)

| Category | Examples | Where it belongs |
|----------|----------|------------------|
| **Roadmap & sequencing** | CP-*, LAB-*, GTM-*, HANDBOOK-*, MED-*, MKT-*, sprint plans, council rulings | `driftguard-cloud/docs/PRODUCT-ROADMAP.md`, `PRODUCT-BUILD.md`, `product/` |
| **Pricing & packaging** | COGS, margin, tier math, founding caps, affiliate/referral economics, grandfathering rules | `driftguard-cloud/docs/gtm/`, billing specs |
| **GTM & distribution** | Launch queues, social calendars, outreach scripts, partnership models, competitive teardowns | `driftguard-cloud/docs/LAUNCH/`, `docs/gtm/` |
| **Handbook & ICP** | Mission, operating metrics, enterprise playbooks, sales motion | `driftguard-cloud/docs/handbook/` |
| **Hosted implementation** | Console IA redesign specs, watch pipeline internals, admin/ops runbooks, D1 schemas for multi-tenant features | `driftguard-cloud` code + `docs/` |
| **Design research on other products** | Screenshot audits, “gap vs X dashboard”, pattern catalogs mapped to a named competitor UI | `driftguard-cloud/docs/design/` |
| **Security operations** | Production URLs, break-glass paths, incident runbooks, secret rotation for hosted | `driftguard-cloud/docs/security/`, `docs/admin/` |
| **Moat language** | “Differentiation vs competitors”, revenue/strategic verdicts, win/loss analysis | Cloud assessments only |
| **Internal task IDs in user-facing OSS text** | `CP-5.6b`, `FG-2A`, `ARCH-H01` in public guides (use gate names or public feature names instead) | Cloud specs; OSS may reference **shipped** public gate IDs in `gate-ladder.md` only |

---

## OK in public OSS (with limits)

| Category | OK | Not OK |
|----------|-----|--------|
| **User guides** | How to run `compare_json`, CI gates, MCP setup, ingress validate | Hosted console wireframes, funnel hook inventory, pricing rationale |
| **Technical ADRs** | OSS client seams, `diff-core`, local MCP — **no hosted D1/console kernel detail** | ADRs describing private worker architecture (move to cloud) |
| **Integration facts** | “Works alongside Confluent Schema Registry for Kafka” (factual coexistence) | “Our console IA follows [Vendor] dashboard” |
| **Public vendor links** | Link to vendor’s **public** blog/docs for a **generic pattern** (e.g. OpenAPI producer CI) | “Notion-style”, “Railway-style”, “env0-inspired” in titles, PRs, or marketing |
| **Hosted API index** | Link to `driftguard.org` trial, pricing, public API reference | Console feature parity matrices vs named products |
| **Gate ladder** | Public gate package names and OSS-shipped behavior | Unshipped cloud-only gates framed as OSS roadmap |

---

## Naming & communication (all repos, PRs, issues, comments)

### Branch names

| Avoid | Prefer |
|-------|--------|
| `feat/cf-audit-console`, `env0-ia-parity` | `feat/console-insights-tile`, `docs/settings-tabs` |
| `railway-referral-clone` | `docs/referral-program-research` (cloud only) |

Use **feature outcome** or **public gate name** — not a competitor or audit source.

### PR titles & descriptions

- Describe **what DriftGuard does**, not what it imitates.
- Do **not** write: “Cloudflare-style nav”, “PostHog parity”, “Notion producer gate clone”, “env0 workflows”.
- Do write: “Collapse console nav to Monitor/Tools/Settings”, “Add producer OpenAPI CI example”, “Funnel event for watch created”.

### Commit messages

Same rule as PRs. No competitor product names unless fixing a **factual integration doc** (e.g. “Document Confluent registry coexistence”).

### Issues & review comments

- No competitive positioning, MRR targets, or “we’re behind X on Y” in **public** issues.
- Use private cloud issues or internal docs for strategy discussion.

### Code comments

- No “copied from [Vendor]” in OSS.
- Generic pattern names OK: “section hub layout”, “two-level scope nav”, “retention-window empty state”.

---

## Third-party products — legal-safe framing

| Allowed | Avoid in public OSS |
|---------|---------------------|
| Factual integration: “Validate before writing to Kafka; use Schema Registry for topic schemas” | “Modeled after [Company]’s dashboard / referral / onboarding” |
| Link to vendor **public** documentation or blog for a **technique** | Screenshot tours or UX audits of a named competitor product |
| Neutral category: “infrastructure-grade dark UI”, “job-based sidebar” | “[Vendor]-orange”, “[Vendor] audit P12”, “parity with [Vendor]” |
| Private cloud research comparing products | Publishing that research or codenames in OSS |

**Rule of thumb:** OSS may say what DriftGuard **integrates with**; it must not say what DriftGuard **was designed to resemble**.

---

## Pre-merge checklist (OSS PRs)

Reviewers and agents should block merge if the diff adds or expands:

- [ ] CP-/LAB-/GTM-/HANDBOOK- task IDs outside `gate-ladder.md` / stub redirect docs
- [ ] Pricing, COGS, commission %, founding tier strategy
- [ ] Hosted console/admin implementation specs (routes, D1 tables, cron jobs)
- [ ] Competitive moat, “vs competitors”, or revenue verdict sections
- [ ] UX/design docs auditing or mapping to a **named** commercial product
- [ ] PR title, branch, or commit message claiming “X-inspired” or “X parity”
- [ ] Ops secrets, internal hostnames (`ops.*`), or break-glass procedures

**Allowed without cloud review:** OSS CLI/MCP changes, public gate packages, user integration guides (neutral framing), ADRs scoped to OSS client only.

---

## Known OSS remediation backlog (2026-06 audit)

**Completed 2026-06-20:** MGFA assessments, `SINGAPORE-MGFA-PRODUCT-FIT`, `AGENT-DISCOVERY-ROADMAP`, and ADR 0002 moved to `driftguard-cloud`; OSS stubs + link rewrites.

Ongoing hygiene:

| Area | Action |
|------|--------|
| New PRs | Run [pre-merge checklist](#pre-merge-checklist-oss-prs) |
| `scratch/` | Do not commit; local experiments only |
| Package READMEs | Avoid internal task IDs (`CP-*`, `FG-*`) — use gate ladder names |

---

## Cloud repo rules

- All categories in **Cloud-only** live here by default.
- Mirror this policy at `docs/policies/IP-BOUNDARY-POLICY.md`.
- Public marketing (`driftguard.org`) follows the same **no “modeled after [Vendor]”** rule unless counsel approves.
- When publishing OSS docs, run the **Pre-merge checklist** mentally — cloud PRs that sync copies into OSS need extra scrutiny.

---

## Related

- [OPEN_CORE.md](../../OPEN_CORE.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [security/PUBLIC-REPO-AUDIT.md](../security/PUBLIC-REPO-AUDIT.md)
- [gate-ladder.md](./gate-ladder.md)

**Revision log**

| Date | Change |
|------|--------|
| 2026-06-20 | Initial policy — OSS leak review, naming rules, remediation backlog |
