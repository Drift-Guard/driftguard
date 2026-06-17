# Hosted API (index)

High-level map of the **hosted DriftGuard REST API**. Exact request/response schemas, rate limits, and console setup live on [driftguard.org](https://driftguard.org) — not duplicated here per [OPEN_CORE.md](../../OPEN_CORE.md).

**Try hosted:** [free trial](https://driftguard.org/start) · **Plans:** [pricing](https://driftguard.org/pricing) · **Console:** [driftguard.org/console](https://driftguard.org/console)

---

## OSS vs hosted

| Access | What you get |
|--------|--------------|
| **OSS client** | Proxies selected routes when `DRIFTGUARD_API_KEY` is set — see [MCP tools](./README.md#hosted-requires-driftguard_api_key) |
| **Direct REST** | Same backend; use from CI, scripts, or integrations |
| **This doc** | Route families and auth — not OpenAPI |

Do not document hosted infrastructure (Workers, D1, queues) in the public repo.

---

## Authentication

| Credential | Use |
|------------|-----|
| **API key** (`dg_…`) | Pro/Team — watches, drift history, gates, agent status |
| **Trial session** | CI gate limited to one endpoint — see [CI.md](../CI.md) |
| **None** | Public/rate-limited routes only (`explain_drift`, coverage preview, health) |

Send the key as `Authorization: Bearer dg_…` or `X-Api-Key: dg_…`.

### Verify your API key

After [trial](https://driftguard.org/start) or Pro checkout, confirm the key works:

```bash
export DRIFTGUARD_API_KEY="dg_…"   # never commit real keys

curl -sf "https://driftguard.org/api/me" \
  -H "Authorization: Bearer $DRIFTGUARD_API_KEY"
```

**200 response shape** (values redacted):

```json
{
  "email": "you@example.com",
  "plan": "pro",
  "apiKeyHint": "dg_…••••abcd",
  "status": "active"
}
```

The full key is never returned — only `apiKeyHint` for console display. **401** means missing, invalid, or inactive key.

CLI shortcut: `driftguard login` (same `GET /api/me` call).

**Agent install metadata (public, no auth):** `GET https://driftguard.org/api/public/agent-config` — npx MCP command, docs URLs, offline tool list.

Authoritative REST index: [driftguard.org/docs/api](https://driftguard.org/docs/api).

Env vars: [Reference — environment](./README.md#environment-variables).

---

## Route families

Routes below are inferred from the OSS MCP proxy and CI client — authoritative specs on the hosted site at launch.

### Watches

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/watches` | Register watch (`name`, `url`, `watchType`, optional `webhookUrl`) |
| `GET` | `/api/watches` | List watches and health |
| `POST` | `/api/watches/{id}/check` | Immediate check |
| `GET` | `/api/watches/{id}/status` | Drift status, incident, latest event, agent actions |
| `POST` | `/api/watches/suggest` | Parse `mcp.json` / URLs; optional create |
| `POST` | `/api/watches/import-ci` | Bulk import from CI scan (console flow) |

MCP: `register_watch`, `check_watch`, `list_watches`, `get_watch_status`, `suggest_watches`.

#### Watch health SLOs (Pro/Team)

Scheduled checks run at each watch's `intervalMinutes` (plan minimum: Pro 15m, Critical 1m, Fleet 5m). **Contract drift** (`driftStatus: drifted`) and **poll health** are separate signals — a watch can be healthy while reporting drift, or degraded while the baseline is unchanged.

| Field | Source | Meaning |
|-------|--------|---------|
| `driftStatus` | `list_watches`, `get_watch_status` | `ok` · `drifted` · `error` · `never_run` · `disabled` |
| `health.band` | Same (Pro/Team) | `healthy` — recent successful poll · `degraded` — error, never run, or stale poll · `unknown` — disabled |
| `health.isStaleCheck` | Same | `true` when `lastCheckedAt` is older than **2×** `intervalMinutes` (missed poll SLO) |
| `failureClass` / `failureLabel` | `get_watch_status`, `list_watches` | Check failure taxonomy — e.g. `mcp_handshake_failed`, `timeout`, `http_error` |

**Operational guidance:** Treat sustained `error` or `health.isStaleCheck: true` as upstream MCP/API reachability — not contract drift. Run `check_watch` after fixing URL, auth, or network. MCP `tools/list` polling depends on server implementation; handshake failures surface as `mcp_handshake_failed`.

Console **Portfolio compass** (`GET /api/portfolio/compass`) lists `neverRun`, `error`, and long-idle watches for fleet triage. Pair with [drift management — incident lifecycle](../guides/drift-management.md#incident-lifecycle).

### Drift & incidents

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/drift` | List drift events (`watchId`, `limit`) |
| `POST` | `/api/drift/explain` | Remediation hints (public, no key) |
| `POST` | `/api/watches/{id}/incident/ack` | Acknowledge open incident (unblocks ack-gated agents) |
| `POST` | `/api/watches/{id}/incident/resolve` | Manually resolve open/acknowledged incident |

MCP: `list_drift_events`, `explain_drift`, `acknowledge_drift`.

#### Incident lifecycle states

| `incident.status` | Set by | Next steps |
|-------------------|--------|------------|
| `open` | Drift detected on scheduled/manual check | Review `list_drift_events`; route webhook to SOAR |
| `acknowledged` | `acknowledge_drift` / `POST …/incident/ack` | Human reviewed; ack-gated agent policies unblock |
| `resolved` | Manual `POST …/incident/resolve`, or auto when breaking drift clears on next ok check | Incident closed; baseline may still differ if additive drift remains |

Auto-resolve runs when a check finds no breaking changes vs baseline. Additive-only drift may remain while the incident closes — confirm in console or `get_watch_status`.

#### Drift history and audit (Team)

Pro and Team tiers export drift events with watch lifecycle metadata for governance workflows. Fleet / legacy Team adds HMAC-signed audit JSON with incident acknowledgement trail.

| Access | Auth | Scope |
|--------|------|-------|
| `GET /api/drift` / `list_drift_events` MCP | API key | Per-watch event list (50 rows max per request) |
| `GET /api/drift/export?format=json` | API key (Pro+) | Structured JSON — schema `driftguard-drift-export-v1` |
| `GET /api/drift/export?format=csv` | API key (Pro+) | CSV with `watchName`, `incidentStatus`, `changesJson` |
| `GET /api/drift/export?format=audit` | API key (Fleet / Team) | Signed audit JSON — schema `driftguard-drift-audit-v1` + `ackTrail` |
| `GET /api/drift/export/incident-packet?eventId=…` | API key (Fleet / Team) | Single-event evidence packet with trace + activity |
| Console export | Session login | Same formats via Insights panel |

**Query params:** `watchId` (optional filter), `limit` (capped by plan — 500 Pro, 5,000 Fleet/Team).

**Retention (hosted):**

| Plan | Drift history | Export row cap |
|------|---------------|----------------|
| Pro / Critical | 180 days | 500 |
| Fleet / Fleet+ / Team (legacy) | 365 days | 5,000 |

Drift rows are append-only for the retention window. Signed audit exports include an `immutabilityNote` — copy to your WORM/SIEM for long-term legal hold; DriftGuard does not provide WORM storage.

**JSON export fields (per event):** `id`, `watchId`, `watchName`, `watchUrl`, `watchType`, `vendor`, `category`, `incidentStatus`, `breakingCount`, `warningCount`, `infoCount`, `detectedAt`, `changes`.

**Signed audit extras:** `ackTrail[]` (`incident.opened` / `incident.acknowledged` / `incident.resolved`), `signature` (HMAC-SHA256), `retentionDays`, `exportedAt`.

Programmatic history without bulk export: paginate `GET /api/drift?watchId=…` or MCP `list_drift_events`. Pair with ack webhooks ([webhooks-alerts](./webhooks-alerts.md#incident-acknowledgement-trail)) for SOAR ingest.

### Agents (orchestration)

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/agents/{id}/status` | Binding contract status |
| `GET` | `/api/watches/{id}/affected-agents` | Agents impacted by watch drift |

MCP: `get_agent_status`, `list_affected_agents`. Terms: [Glossary — agent](../glossary.md).

### CI & coverage

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/coverage/preview` | Rate-limited | Discover endpoints; funnel links |
| `POST` | `/api/coverage/assert` | Key or trial | Fail when deps unwatched |
| `POST` | `/api/trial/session` | CI context | Mint trial session for gate |

Documented in [CI.md — API reference](../CI.md#api-reference-hosted). CLI: `coverage-preview`, `assert-coverage`.

### Utility

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/me` | Validate API key |
| `GET` | `/health` | Deploy smoke |
| `POST` | `/api/openapi/diff/remote` | Remote OpenAPI structural diff (CLI) |

---

## Funnel responses

Coverage preview/assert responses include `upgrade.*` deep links (`start`, `console`, `pricing`, `activate`) — see [CI.md — Upgrade URLs](../CI.md#upgrade-urls).

---

## Related

| Doc | Purpose |
|-----|---------|
| [Webhooks & alerts](./webhooks-alerts.md) | Notification channels and event concepts |
| [MCP tools](./README.md#mcp-tools) | Agent-facing hosted proxies |
| [Platform admin guide](../guides/platform-admin.md) | Watches, keys, alerts |
| [OPEN_CORE.md](../../OPEN_CORE.md) | Private control plane boundary |

**Full API reference (hosted site):** [driftguard.org](https://driftguard.org) — use trial or docs link from console when published.
