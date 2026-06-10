# Drift management guide

From **detection** through **triage** to **fix** when a watched contract changes. Structural diff is OSS; drift history, alerts, and ack workflows are hosted.

**Prerequisites:** At least one watch registered — [Getting started step 6](../getting-started.md#6-upgrade--trial-api-key-watches) or [Platform admin](./platform-admin.md). Trial: [driftguard.org/start](https://driftguard.org/start).

Boundary: [OPEN_CORE.md](../../OPEN_CORE.md) — no self-hosted console in this repo.

---

## Overview

```
  Detection          Triage              Fix
  ─────────          ──────              ───
  check_watch        list_drift_events   explain_drift (OSS hint)
  scheduled checks   breaking vs add.    PR / baseline update
  drift alerts       link to incident    acknowledge_drift (hosted)
```

---

## Detection

| Method | Tool / surface | Notes |
|--------|----------------|-------|
| **Immediate check** | `check_watch` | On-demand diff against last baseline |
| **Scheduled** | Hosted cron | Automatic — Pro/Team console |
| **CI hook** | `compare_json` / `drift-diff` | Catches breaking changes in fixtures before deploy |
| **MCP polling** | Hosted only | Remote `tools/list` and schema extraction |

List watches: `list_watches`. Status: `get_watch_status` (ok, incident open, latest event).

---

## Triage

1. **Fetch history** — `list_drift_events` for the watch (or console drift timeline).
2. **Classify** — breaking changes block consumers; additive changes are usually safe to absorb.
3. **Correlate** — link drift event to deploying PR, dependency version bump, or upstream API change.

Terms: [Glossary — drift event, breaking](../glossary.md).

For one-off payloads (no watch yet), use OSS `compare_json` then `explain_drift` when `breakingCount > 0`.

---

## Fix

| Scenario | Action |
|----------|--------|
| **Breaking API change** | Update client code or pin dependency; use `explain_drift` hints for field-level guidance |
| **Intentional contract change** | Update baseline snapshot in repo; re-run CI hook |
| **False positive / accepted risk** | `acknowledge_drift` in hosted console (unblocks ack-gated agent policies) |
| **Unwatched dependency** | `register_watch` or `suggest_watches` import; enable CI gate when ready |

Remediation hints: `explain_drift` (public endpoint, no API key) — [Developer guide](./developer.md#remediation-after-breaking-diffs).

---

## Hosted-only capabilities

These are not implemented in the public repo; use the console or MCP hosted tools with `DRIFTGUARD_API_KEY`:

- Alert routing (Slack, email, webhooks)
- Drift history export and audit
- Agent binding and ack-gated policies

Upgrade: [driftguard.org/pricing](https://driftguard.org/pricing)

---

## Next steps

| Goal | Doc |
|------|-----|
| Create and schedule watches | [Platform admin](./platform-admin.md) |
| CI coverage enforcement | [CI/CD guide](./ci-cd.md) |
| Local diff only | [Developer guide](./developer.md) |
| Notification channels | [Integrations — notifications](../integrations/README.md#notifications-hosted) |
