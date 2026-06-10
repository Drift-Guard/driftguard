# Glossary

DriftGuard terms mapped to familiar equivalents. For product boundaries see [OPEN_CORE.md](../OPEN_CORE.md).

---

## Core concepts

| DriftGuard term | Familiar equivalent | Notes |
|-----------------|---------------------|-------|
| **Schema drift** | API contract change, breaking change | Detected when a watched or compared payload's inferred schema changes |
| **Structural diff** | JSON schema diff, OpenAPI diff | OSS default; classifies breaking vs additive — not NL/semantic classification |
| **Breaking change** | Backward-incompatible change | e.g. removed field, type change, new required field — fails CI when `breakingCount > 0` |
| **Additive change** | Backward-compatible change | e.g. new optional field — usually safe for consumers |
| **Watch** | Monitored endpoint, uptime check on a contract | A registered URL (API JSON, OpenAPI, or remote MCP) checked on a schedule — **hosted only** |
| **Drift event** | Alert incident, detected schema change record | Emitted when a watch finds a change vs its baseline — **hosted only** |
| **Watch preview** | Dry-run discovery | Output of `parse_mcp_config` — candidates only, no watches created |
| **Coverage** | Dependency monitoring completeness | Whether every endpoint discovered in `mcp.json` (or scan paths) has an active watch |
| **Baseline** | Golden snapshot, pinned schema | Previous known-good payload or schema a watch compares against |

---

## Client & deployment

| DriftGuard term | Familiar equivalent | Notes |
|-----------------|---------------------|-------|
| **OSS client** | CLI + MCP connector, local tooling | This public repo — not the full monitoring product |
| **Hosted DriftGuard** | Managed SaaS, control plane | Watches, scheduling, alerts, console, billing — not in public repo |
| **Open core** | Open client, commercial backend | Try offline free; pay for continuous monitoring |
| **MCP client** | Cursor, Claude Desktop, Windsurf, Zed | Runs `dist/mcp/server.js` over stdio |
| **API key** | Service token (`dg_…`) | Unlocks hosted MCP tools and CI gates |

Avoid calling the full product **self-host** — it is not available from the public repository.

---

## MCP tools (short names)

| Tool | One-line meaning |
|------|------------------|
| `compare_json` | Local before/after JSON diff |
| `parse_mcp_config` | Offline URL preview from `mcp.json` |
| `hosted_info` | OSS vs hosted matrix and funnel URLs |
| `explain_drift` | Remediation hints for breaking changes |
| `register_watch` | Create a hosted watch |
| `suggest_watches` | Import `mcp.json` with optional create |
| `check_watch` | Run one immediate check |
| `list_watches` | List watches and status |
| `list_drift_events` | Drift history |
| `assert_coverage` | CI gate — deps must be watched |

Full when / when-not catalog: [Reference — MCP tools](./reference/README.md#mcp-tools).

---

## CI funnel

| DriftGuard term | Familiar equivalent | Notes |
|-----------------|---------------------|-------|
| **Hook** | Free CI step, lint on diff | `drift-diff` / `compare_json` — fails on breaking changes only |
| **Preview** | Non-blocking report, nudge | `drift-coverage-preview` — lists unwatched deps + console links |
| **Gate** | Required check, policy enforcement | `drift-coverage` / `assert_coverage` — fails until all deps watched |
| **Trial session** | Limited-time CI credential | One endpoint on trial; multi-dep repos need Pro |

Details: [CI.md](./CI.md).

---

## Gate packages (coverage ladder)

Progressive adoption packages for contract testing in repos. Package READMEs hold implementation detail.

| Gate | Package | Purpose |
|------|---------|---------|
| **Gate 1 — MockDrift** | [mockdrift/](./mockdrift/) | Assertion v2 contract for mock/snapshot tests |
| **Gate 2A — FuseGuard** | [packages/fuseguard](../packages/fuseguard/README.md) | Fuse breaking checks into existing test flows |
| **Gate 3A — ToolChange** | [packages/toolchange](../packages/toolchange/README.md) | MCP tool schema change lint (alpha) |
| **Gate 4A — SchemaSync** | [packages/schemasync](../packages/schemasync/README.md) | NL/schema lint alignment (partial) |

---

## Agent & orchestration (hosted)

| DriftGuard term | Familiar equivalent | Notes |
|-----------------|---------------------|-------|
| **Agent binding** | Service dependency on a watch | Which agents consume which watched contracts |
| **Drift status** | Health + incident state | `get_watch_status` — ok, incident open, latest event |
| **Acknowledge drift** | Incident resolution, human approval | `acknowledge_drift` — unblocks ack-gated agent policies |

---

## Next steps

- [Getting started](./getting-started.md) — apply terms in the onboarding funnel
- [Reference](./reference/README.md) — exact tool and CLI contracts
- [docs/README.md](./README.md) — documentation hub
