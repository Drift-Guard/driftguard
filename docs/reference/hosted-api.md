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

Verify a key: CLI `driftguard login` → `GET /api/me` (hosted).

**Agent install metadata (public, no auth):** `GET https://driftguard.org/api/public/agent-config` — npx MCP command, docs URLs, offline tool list.

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

### Drift & incidents

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/drift` | List drift events (`watchId`, `limit`) |
| `POST` | `/api/drift/explain` | Remediation hints (public, no key) |
| `POST` | `/api/watches/{id}/incident/ack` | Acknowledge open incident |

MCP: `list_drift_events`, `explain_drift`, `acknowledge_drift`.

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
