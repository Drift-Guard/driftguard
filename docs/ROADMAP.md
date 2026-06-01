# DriftGuard roadmap

Public direction for the open-source client and hosted monitoring service. Timelines are directional — we ship when the quality bar is met, not on calendar dates.

**Feedback:** [GitHub Discussions](https://github.com/kioie/driftguard/discussions) or comments on [Dev.to](https://dev.to/kioiek) — recent community input on **semantic drift** directly shaped the flagship item below.

---

## Shipped today

| Area | What you get |
|------|----------------|
| **Contract drift** | Fields added/removed, types changed, required-ness shifts on live JSON, OpenAPI, and MCP `tools/list` |
| **Classification** | Breaking / warning / info on every diff — not raw JSON noise |
| **MCP-native** | Tool removed, `inputSchema` structure changes, resources/prompts fleet diff |
| **Hosted watches** | Scheduled snapshots, Slack/webhooks/PagerDuty, 90-day history (Pro) |
| **CI funnel** | Free preview → trial → Pro gate (`drift-diff`, `drift-coverage`, console import) |
| **OSS client** | Local `compare_json`, MCP connector, MIT diff engine |

**Scope today:** structural and schema-level changes on dependencies you watch but do not own. HTTP 200 with a **broken contract** — field gone, type narrowed, tool removed.

**Not yet:** same JSON shape, different **meaning** (see below).

---

## Next flagship — Semantic drift detection

> *"Schema-valid JSON that means something different … is the nasty case OpenAPI diffing alone won't catch."* — Dev.to community feedback, May 2026

### The problem

REST breaks throw status codes your monitoring catches. **Agents break quietly:** HTTP 200, valid JSON, plausible wrong output — no exception, no alert, expensive discovery downstream.

Contract-level diffing misses:

| Failure mode | Example | Contract diff sees it? |
|--------------|---------|----------------------|
| **Unit / scale flip** | `amount` still a number, was dollars, now cents | ❌ |
| **Enum expansion / repurposing** | New enum value your agent mishandles; old value now means something else | ⚠️ partial (OpenAPI enum only if spec documents it) |
| **Default behavior change** | Field optional, vendor changes server default; shape unchanged | ❌ |
| **Stable shape, shifted distribution** | Same types, values cluster differently (A/B backend rollout) | ❌ |
| **MCP tool output semantics** | Tool returns same schema, different business meaning in nested fields | ❌ |

This is the guardrail layer agent platforms and integration teams need as standard — watching **contracts you depend on but don't own**, including when the contract **parses but lies**.

### What we're building

**Semantic drift** — a second diff layer on top of today's schema engine:

1. **Value fingerprints** — per-field histograms, enum sets, numeric ranges, string patterns, null rates from consecutive snapshots
2. **Semantic change types** — classified events beyond `type_changed` / `removed`:
   - `enum_set_changed` (added/removed allowed values)
   - `distribution_shift` (median/range moved beyond threshold)
   - `unit_suspect` (magnitude jump consistent with cents↔dollars, ms↔s)
   - `exemplar_drift` (canonical sample payloads diverged with stable schema)
3. **Same severity model** — breaking / warning / info with **breaking-only alerts** default
4. **Agent-oriented context** — drift events include *what an agent would have assumed* vs *what the payload implies now*

### Example alerts (target UX)

```
SEMANTIC · stripe-webhooks · POST /v1/events
  $.data.object.amount — numeric range shifted 100× (possible unit change)
  classified: breaking · was ~10–5000, now ~1000–500000

SEMANTIC · cursor-mcp-tools · tool create_task
  $.priority enum gained value "urgent" — agent prompt may not handle
  classified: warning
```

### Rollout plan

| Phase | Deliverable |
|-------|-------------|
| **Design** | Fingerprint schema, thresholds, false-positive policy (in progress) |
| **Alpha** | Hosted watches only — semantic layer on JSON + MCP tool **response** snapshots |
| **Beta** | Console timeline + export; opt-in per watch (`semantic: true`) |
| **GA** | Default-on for Pro; OSS `compare_json` gets optional `--semantic` for local fixtures |

**Target:** first alpha on hosted Pro watches **Q3 2026**. [Follow the roadmap page](https://driftguard.eddy-d55.workers.dev/roadmap) for updates.

### What stays contract-only (for now)

- OpenAPI **spec URL** watches diff the published spec, not live traffic semantics
- CI `drift-diff` on fixtures remains structural unless you opt into semantic mode later
- We will **not** page on every numeric jitter — tunable thresholds and breaking-only defaults

---

## On deck (after semantic drift alpha)

| Initiative | Rationale |
|------------|-----------|
| **Custom domain + driftguard.dev** | Production URLs, webhook trust |
| **Agent platform hooks** | Standard webhook shape for Moonshift-style orchestrators |
| **Watch templates marketplace** | One-click Stripe, GitHub, Shopify, common MCP servers |
| **Team SSO + signed audit** | Enterprise procurement checklist |
| **Self-serve enum baselines** | Pin allowed enum sets per watch from first snapshot |

---

## Explicit non-goals

- Full self-host of the monitoring pipeline (see [OPEN_CORE.md](../OPEN_CORE.md))
- Replacing your OpenAPI design-time linter — we watch **live** vendor behavior
- Paging on every info-level cosmetic change

---

## How to influence priority

1. Comment on Dev.to or open a Discussion with a **real anonymized example** of semantic drift you hit
2. Pro/Team customers: mention it in support — we prioritize by incident cost
3. Star/watch [kioie/driftguard](https://github.com/kioie/driftguard) for release notes
