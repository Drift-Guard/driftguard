# Platform admin guide

Manage scheduled checks, team API keys, and alerts for **hosted** DriftGuard. The public repo is the free client only — provisioning and console live on driftguard.org.

**Before you start:** Pro or Team plan — [pricing](https://driftguard.org/pricing). Trial covers one endpoint: [start](https://driftguard.org/start).

What's free vs paid: [OPEN_CORE.md](../../OPEN_CORE.md).

---

## Overview

You manage **what** is watched, **who** can register watches, and **where** alerts go. Agents and CI use the same API key scoped to your tenant.

---

## API keys

| Use | Secret location |
|-----|-----------------|
| **MCP client** | `DRIFTGUARD_API_KEY` in `mcp.json` env |
| **GitHub Actions** | Repository or org secret |
| **GitLab CI** | Masked CI variable |
| **Local CLI** | Shell env for `assert-coverage` |

Key format: `dg_…`. Without a key, hosted MCP tools fail with trial and pricing URLs — by design.

Env reference: [Reference — environment variables](../reference/README.md#environment-variables).

**Do not** commit keys. Rotate via console if exposed — [security checklist](../security/SECRET-ROTATION-CHECKLIST.md).

---

## Watch lifecycle

### Create

| Path | Tool |
|------|------|
| Single URL | `register_watch` — `name`, `url`, `watchType` (`api` \| `mcp`) |
| Bulk from mcp.json | `suggest_watches` with `create: true` after `parse_mcp_config` preview |
| Console | driftguard.org — guided import from CI deep links |

Preview offline first: [Getting started step 4](../getting-started.md#4-preview-mcp-dependencies-offline).

### Operate

- **List** — `list_watches`
- **Check now** — `check_watch`
- **Status** — `get_watch_status` (health, open incidents)
- **History** — `list_drift_events`

Scheduling and MCP `tools/list` polling run on hosted infrastructure — not configurable from this repo.

### Retire

Remove or pause watches in the console when dependencies are decommissioned. Update CI `scan-paths` so `assert_coverage` does not expect retired endpoints.

---

## Coverage policy

Enforce that every discovered dependency in CI is watched:

- GitHub: `drift-coverage` action with `DRIFTGUARD_API_KEY`
- GitLab: `driftguard assert-coverage`
- MCP: `assert_coverage`

Trial gates allow **one** endpoint; multi-dependency repos need Pro. Steps: [CI/CD guide](./ci-cd.md).

Policy concepts: [Policies](../policies/README.md).

---

## Alerts (hosted)

Alert delivery (Slack, email, webhooks) is configured in the hosted console — not in the free repo.

| Channel | Config surface |
|---------|----------------|
| Slack | Console integrations |
| Email | Console notification settings |
| Webhook | Per-watch `webhookUrl` on `register_watch` or console |

Event shapes and retry behavior are documented on the hosted site at launch. This hub links out only.

Index: [Integrations — notifications](../integrations/README.md#notifications-hosted).

---

## Team operations

| Concern | Notes |
|---------|-------|
| **SSO / audit** | Team tier — [pricing](https://driftguard.org/pricing) |
| **Agent bindings** | Map agents to watches; ack-gated policies — [Glossary](../glossary.md#agent-features-hosted) |
| **Drift ack** | `acknowledge_drift` after human review |

---

## Next steps

| Goal | Doc |
|------|-----|
| Drift triage workflow | [Drift management](./drift-management.md) |
| CI gate setup | [CI/CD guide](./ci-cd.md) |
| Free-only evaluation | [Getting started](../getting-started.md) |
| Security posture | [security/](../security/) |
