# Drift management guide

Find, review, and fix changes when a watched contract changes. JSON diff is free; change history, alerts, and ack workflows are hosted.

**Before you start:** At least one watch registered — [Getting started step 6](../getting-started.md#6-upgrade--trial-api-key-watches) or [Platform admin](./platform-admin.md). Trial: [driftguard.org/start](https://driftguard.org/start).

What's free vs paid: [OPEN_CORE.md](../../OPEN_CORE.md) — no self-hosted console in this repo.

---

## Overview

```
  Find it            Review             Fix it
  ───────            ──────             ──────
  check_watch        list_drift_events  explain_drift (free hint)
  scheduled checks   breaking vs safe   PR / baseline update
  drift alerts       link to incident   acknowledge_drift (hosted)
```

---

## Find changes

| Method | Tool / surface | Notes |
|--------|----------------|-------|
| **Check now** | `check_watch` | On-demand diff against last baseline |
| **On a schedule** | Hosted cron | Automatic — Pro/Team console |
| **CI hook** | `compare_json` / `drift-diff` | Catches breaking changes in fixtures before deploy |
| **MCP polling** | Hosted only | Remote `tools/list` and schema extraction |

List watches: `list_watches`. Status: `get_watch_status` (ok, incident open, latest event).

---

## Review changes

1. **Fetch history** — `list_drift_events` for the watch (or console drift timeline).
2. **Classify** — breaking changes block consumers; additive changes are usually safe to absorb.
3. **Correlate** — link drift event to deploying PR, dependency version bump, or upstream API change.

Terms: [Glossary — drift event, breaking](../glossary.md).

For one-off payloads (no watch yet), use free `compare_json` then `explain_drift` when `breakingCount > 0`.

---

## Fix it

| Scenario | Action |
|----------|--------|
| **Breaking API change** | Update client code or pin dependency; use `explain_drift` hints for field-level guidance |
| **Intentional contract change** | Update baseline snapshot in repo; re-run CI hook |
| **False positive / accepted risk** | `acknowledge_drift` in hosted console (unblocks ack-gated agent policies) |
| **Unwatched dependency** | `register_watch` or `suggest_watches` import; enable CI gate when ready |

Fix suggestions: `explain_drift` (public endpoint, no API key) — [Developer guide](./developer.md#fix-suggestions-after-breaking-diffs).

---

## Hosted-only capabilities

These are not in the public repo; use the console or MCP hosted tools with `DRIFTGUARD_API_KEY`:

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
