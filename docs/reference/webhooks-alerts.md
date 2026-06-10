# Webhooks & alerts

Conceptual guide to **drift notifications** on hosted DriftGuard. Payload schemas, signing secrets, and channel setup are configured in the [hosted console](https://driftguard.org/console) — not specified in this OSS repo.

**Start trial:** [driftguard.org/start](https://driftguard.org/start)

---

## What triggers an alert

Hosted watches run on a schedule (and on-demand via `check_watch`). When a check finds a schema change vs the stored baseline, the service:

1. **Records a drift event** — breaking / additive classification, snapshots, timestamps
2. **Opens or updates an incident** — triage state on the watch (`get_watch_status`)
3. **Notifies configured channels** — Slack, email, per-watch webhook

One-off local diffs (`compare_json`, CLI `diff`) do **not** emit drift events or webhooks.

---

## Event concepts (not full schemas)

Fields vary by watch type and tier; typical drift event / webhook payload themes:

| Concept | Meaning |
|---------|---------|
| `watchId` | Which watch detected the change |
| `breakingCount` / severity | Whether consumers should block deploys |
| `changes` | Structural diff summary (aligned with OSS diff semantics) |
| `incident` | Open / acknowledged state — `acknowledge_drift` clears ack-gated blocks |
| `detectedAt` | When the scheduled or manual check ran |
| `baseline` / `after` references | Snapshot ids — history in console |

Agent impact: `list_affected_agents` after drift. Policy: [Glossary](../glossary.md), [drift management guide](../guides/drift-management.md).

**Authoritative payload docs:** hosted API reference at [driftguard.org](https://driftguard.org) when published.

---

## Delivery channels

| Channel | Configuration | OSS touchpoint |
|---------|---------------|----------------|
| **Per-watch webhook** | `webhookUrl` on `register_watch` or console | MCP `register_watch` optional field |
| **Slack** | Console integrations | — |
| **Email** | Console notification settings | — |

Catalog: [Integrations — notifications](../integrations/README.md#notifications-hosted). Admin flow: [Platform admin — alerts](../guides/platform-admin.md#alerts-hosted).

---

## Retry behavior (generic)

Hosted webhook delivery follows common SaaS patterns (exact timings on hosted docs):

- **Retries** on non-2xx responses or timeouts, with backoff over a bounded window
- **Idempotency** — receivers should tolerate duplicate posts for the same drift event id
- **Signing** — verify HMAC or shared secret when the console provides one (hosted site)

Do not rely on this page for retry counts or header names — confirm in console setup or hosted API reference at launch.

---

## OSS boundary

| In this repo | Hosted only |
|--------------|-------------|
| `webhookUrl` input on `register_watch` | Delivery workers, retry queues, Slack OAuth |
| Drift event **listing** via MCP `list_drift_events` | Alert routing UI, email templates |
| `explain_drift` remediation | PagerDuty-style escalation (future) |

See [OPEN_CORE.md](../../OPEN_CORE.md).

---

## Related

| Doc | Purpose |
|-----|---------|
| [Hosted API index](./hosted-api.md) | Watch and drift routes |
| [MCP — register_watch](./README.md#register_watch) | Optional `webhookUrl` |
| [CI funnel](../CI.md) | Preview/gate — not webhook delivery |
