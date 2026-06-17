# Reference

Exact contracts for the free client: MCP tools, CLI commands, and diff rules. For step-by-step guides see [Guides](../guides/README.md), [Getting started](../getting-started.md), and [CI.md](../CI.md).

**Agent quick ref:** [SYSTEM_PROMPT.md](../../SYSTEM_PROMPT.md) — decision flow and env vars in one page.

**Source of truth for tool behavior:** `src/mcp/server.ts` (descriptions follow when / when-not / siblings pattern).

---

## Environment variables

**Primary activation:** `DRIFTGUARD_API_KEY` — one Pro/Team key unlocks all hosted MCP tools and CI coverage gates.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DRIFTGUARD_API_KEY` | Hosted tools only | Pro/Team API key (`dg_…`) |
| `DRIFTGUARD_API` | No | **Advanced:** override hosted base URL (default: `https://driftguard.org`) |
| `DRIFTGUARD_ALLOW_CUSTOM_API` | With custom `DRIFTGUARD_API` | Set to `1` to opt in; prevents hostile MCP configs from redirecting your token |
| `DRIFTGUARD_FILES_JSON` | CI scan | JSON array of `{path, content}` for coverage commands |
| `DRIFTGUARD_SCAN_PATHS` | CI scan | Comma-separated paths (alternative to `FILES_JSON`) |
| `DRIFTGUARD_TRIAL_SESSION` | Trial CI gate | One-endpoint trial credential |

---

## MCP tools

### Offline (no API key)

#### `compare_json`

| | |
|---|---|
| **When** | One-off before/after JSON diff — CI fixtures, API responses, MCP tool output |
| **When not** | Continuous monitoring (use `register_watch`) |
| **Siblings** | `explain_drift` after breaking results; hosted `/api/diff` is not needed offline |
| **Inputs** | `before`, `after` — JSON strings |
| **Network** | No |

#### `parse_mcp_config`

| | |
|---|---|
| **When** | Preview watch candidates from `mcp.json` or HTTPS URLs before creating watches |
| **When not** | Creating watches or running checks |
| **Siblings** | `suggest_watches` (hosted + key) for import with catalog; `compare_json` for diff only |
| **Inputs** | `text`, `urls`, `mcpJson` (optional) |
| **Network** | No |

Stdio MCP servers without URLs are skipped — hosted MCP polling is required for those.

#### `hosted_info`

| | |
|---|---|
| **When** | You ask about self-hosting, API keys, trials, or why a hosted tool failed |
| **When not** | Substitute for running an actual diff or watch operation |
| **Siblings** | All tools — returns free vs paid matrix |
| **Network** | No |

#### `explain_drift`

| | |
|---|---|
| **When** | After `compare_json` when `breakingCount > 0` — fix suggestions |
| **When not** | Registering watches or replacing local diff |
| **Inputs** | `changesJson` — array of SchemaChange objects from diff output |
| **Network** | Yes (public hosted endpoint, no API key) |

---

### Hosted (requires `DRIFTGUARD_API_KEY`)

Fails with trial/pricing URLs when the key is missing. Do not document hosted infrastructure in this repo — use upgrade links only.

#### `register_watch`

| | |
|---|---|
| **When** | Register a URL for continuous drift monitoring after `parse_mcp_config` preview |
| **When not** | One-off JSON diff (`compare_json`) |
| **Inputs** | `name`, `url`, `watchType` (`api` \| `mcp`), optional `webhookUrl` |

#### `check_watch`

| | |
|---|---|
| **When** | Run one check now on a registered watch |
| **When not** | One-off JSON comparison |
| **Inputs** | `watchId` (UUID) |

#### `list_watches`

| | |
|---|---|
| **When** | List watches and health before `check_watch` or `list_drift_events` |
| **Inputs** | none |

#### `get_watch_status`

| | |
|---|---|
| **When** | Drift status, incident state, latest event, agent actions for one watch |
| **When not** | Local diff only workflows |
| **Inputs** | `watchId` |

#### `get_agent_status`

| | |
|---|---|
| **When** | Agent binding contract status before agent runs |
| **Inputs** | `agentId` |

#### `list_affected_agents`

| | |
|---|---|
| **When** | After drift on a watch — which agent bindings are impacted |
| **Inputs** | `watchId` |

#### `acknowledge_drift`

| | |
|---|---|
| **When** | Human reviewed drift; unblock ack-gated agents |
| **Inputs** | `watchId` |

#### `list_drift_events`

| | |
|---|---|
| **When** | Change history from continuous monitoring |
| **When not** | One-off JSON comparison |
| **Inputs** | optional `watchId`, `limit` (1–50, default 10) |

#### `suggest_watches`

| | |
|---|---|
| **When** | Parse `mcp.json` with catalog matching; optionally create watches |
| **When not** | Offline preview only (use `parse_mcp_config`) |
| **Inputs** | `text`, `urls`, `mcpJson`, optional `create` |

#### `assert_a2a_coverage`

| | |
|---|---|
| **When** | CI gate — every `agents.yaml` `watches[]` URL must be registered |
| **When not** | Offline manifest lint only |
| **Inputs** | `manifestYaml` |
| **Siblings** | GitHub Action `drift-a2a-coverage`; CLI `assert-a2a-coverage` |

#### `assert_coverage`

| | |
|---|---|
| **When** | CI gate — discovered dependencies must be watched |
| **When not** | Local diff |
| **Inputs** | `text`, `mcpJson` |
| **Siblings** | GitHub Action `drift-coverage`; CLI `assert-coverage` |

---

### Agent decision flow

```
Need one-off schema diff?
  → compare_json

Need URLs mcp.json would monitor?
  → parse_mcp_config
  → auto-import? → suggest_watches (hosted + key)

Need continuous monitoring / alerts?
  → hosted_info → trial or API key → register_watch / suggest_watches

CI: fail if deps unwatched?
  → assert_coverage (hosted + key)

CI: fail if agents.yaml watches unwatched?
  → lint-agents (offline) → assert_a2a_coverage (hosted + key)
```

---

## CLI

Entry: `node dist/cli/check.js <command>` or `npm run check -- <command>`.

| Command | API key | Exit code notes |
|---------|---------|-----------------|
| `diff '<before>' '<after>'` | No | **1** if `breakingCount > 0` |
| `openapi-diff base.yaml target.yaml [--remote]` | No | OpenAPI structural diff |
| `openapi-changelog base.yaml target.yaml` | No | Release notes from OpenAPI diff |
| `coverage-preview` | No | Scan repo; console/trial links |
| `assert-coverage` | Pro or trial | **1** if coverage incomplete |
| `assert-a2a-coverage [path]` | Pro/Team | **1** unwatched manifest URLs; **2** invalid manifest |
| `lint-agents [path]` | No | **1** if manifest invalid |
| `login --api-key dg_…` | Yes | Verify hosted key |
| `init [--yes]` | No | Write `.driftguard.yml` |
| `version [--json]` | No | Version + CI pin hints |
| `mcp` | No | Start MCP server on stdio |

Examples:

```bash
npm run build
npm run check -- diff '{"a":1}' '{"a":1,"b":2}'
npm run check -- version --json
npm run mcp
```

CI embed paths and version pinning: [CI.md](../CI.md).

---

## Diff rules

Standard rules live in `@driftguard/diff-core` ([packages/diff-core](../../packages/diff-core/README.md)).

| Concept | Rule of thumb |
|---------|---------------|
| **Breaking** | Removed fields, type changes, stricter constraints, new required fields |
| **Additive** | New optional fields, relaxed constraints |
| **Profiles** | `cli` (free) vs `hosted` — inference options may differ; contract vectors keep repos aligned |

Free adapter: `src/core/diff.ts` over diff-core. Golden vectors: `packages/diff-core/contract/vectors.json`.

Gate package schemas: [mockdrift/ASSERTION-V2.md](../mockdrift/ASSERTION-V2.md).

---

## Hosted API & alerts (link only)

REST routes for watches, coverage, drift, and notifications are **not** duplicated as OpenAPI in this repo per [OPEN_CORE.md](../../OPEN_CORE.md).

| Doc | Content |
|-----|---------|
| [hosted-api.md](./hosted-api.md) | Route families, auth, MCP mapping |
| [webhooks-alerts.md](./webhooks-alerts.md) | Drift events, channels, retry overview |
| [CI.md — API reference](../CI.md#api-reference-hosted) | Coverage preview/assert tiers |

**Upgrade URLs:** [driftguard.org/start](https://driftguard.org/start) · [pricing](https://driftguard.org/pricing) · [console](https://driftguard.org/console) · full API docs on hosted site when published

---

## Related

| Doc | Purpose |
|-----|---------|
| [Glossary](../glossary.md) | Term definitions |
| [DISCOVERY.md](../DISCOVERY.md) | MCP Registry (`server.json`) |
| [QUICKSTART.md](../QUICKSTART.md) | Install and MCP config |
| [docs/README.md](../README.md) | Documentation hub |
