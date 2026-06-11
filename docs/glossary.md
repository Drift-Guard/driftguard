# Glossary

DriftGuard terms in plain language. For what's free vs paid see [OPEN_CORE.md](../OPEN_CORE.md).

---

## Core concepts

| DriftGuard term | Plain meaning | Notes |
|-----------------|---------------|-------|
| **Schema drift** | An API or data contract changed | Detected when a watched or compared payload's inferred schema changes |
| **Structural diff** | Compare JSON shapes and flag what changed | The free default; labels changes as breaking or safe — not natural-language classification |
| **Breaking change** | Change that breaks existing apps | e.g. removed field, type change, new required field — fails CI when `breakingCount > 0` |
| **Additive change** | Safe, backward-compatible change | e.g. new optional field — usually fine for consumers |
| **Watch** | A URL we check on a schedule | A registered API, OpenAPI, or remote MCP endpoint — **hosted only** |
| **Drift event** | A record that something changed | Created when a watch finds a change vs its baseline — **hosted only** |
| **Watch preview** | Dry-run discovery | Output of `parse_mcp_config` — candidates only, no watches created |
| **Coverage** | Are all your dependencies watched? | Whether every endpoint in `mcp.json` (or scan paths) has an active watch |
| **Baseline** | Last known-good snapshot | Previous payload or schema a watch compares against |

---

## Client & deployment

| DriftGuard term | Plain meaning | Notes |
|-----------------|---------------|-------|
| **OSS client** | Free CLI + MCP connector | This public repo — not the full monitoring product |
| **Hosted DriftGuard** | Paid managed service | Scheduled checks, alerts, console, billing — not in public repo |
| **Open core** | Free client, paid monitoring | Try offline free; pay for continuous checks |
| **MCP client** | Cursor, Claude Desktop, Windsurf, Zed | Runs `dist/mcp/server.js` over stdio |
| **API key** | Service token (`dg_…`) | Unlocks hosted MCP tools and CI gates |

You cannot self-host the full product from the public repository.

---

## MCP tools (short names)

| Tool | What it does |
|------|--------------|
| `compare_json` | Local before/after JSON diff |
| `parse_mcp_config` | Offline URL preview from `mcp.json` |
| `hosted_info` | What's free vs paid and upgrade links |
| `explain_drift` | Fix suggestions for breaking changes |
| `register_watch` | Create a hosted watch |
| `suggest_watches` | Import `mcp.json` with optional create |
| `check_watch` | Run one check now |
| `list_watches` | List watches and status |
| `list_drift_events` | Change history |
| `assert_coverage` | CI gate — deps must be watched |

Full when / when-not catalog: [Reference — MCP tools](./reference/README.md#mcp-tools).

---

## CI tiers

| DriftGuard term | Plain meaning | Notes |
|-----------------|---------------|-------|
| **Hook** | Free CI step that diffs JSON | `drift-diff` / `compare_json` — fails on breaking changes only |
| **Preview** | Report that doesn't block CI | `drift-coverage-preview` — lists unwatched deps + console links |
| **Gate** | Required check that blocks merges | `drift-coverage` / `assert_coverage` — fails until all deps watched |
| **Trial session** | Limited-time CI credential | One endpoint on trial; multi-dep repos need Pro |

Details: [CI.md](./CI.md).

---

## Gate packages (coverage ladder)

Optional packages for contract testing in repos. Package READMEs have implementation detail.

| Gate | Package | Purpose |
|------|---------|---------|
| **Gate 1 — MockDrift** | [mockdrift/](./mockdrift/) | Test assertions for mock/snapshot tests |
| **Gate 2A — FuseGuard** | [packages/fuseguard](../packages/fuseguard/README.md) | Stop runaway agent tool loops before schema checks |
| **Gate 2B — A2A Contract Watch** | [PRODUCT-ROADMAP.md](../PRODUCT-ROADMAP.md) | Agent Card vs MCP correlation (planned) |
| **Gate 3A — ToolChange** | [packages/toolchange](../packages/toolchange/README.md) | Lint MCP tool manifest changes in CI (alpha) |
| **Gate 4A — SchemaSync** | [packages/schemasync](../packages/schemasync/README.md) | Check prompts still match schema fields (partial) |

---

## Agent features (hosted)

| DriftGuard term | Plain meaning | Notes |
|-----------------|---------------|-------|
| **Agent binding** | Which agent uses which watch | Maps agents to watched contracts |
| **Drift status** | Health and incident state | `get_watch_status` — ok, incident open, latest event |
| **Acknowledge drift** | Mark an incident reviewed | `acknowledge_drift` — unblocks ack-gated agent policies |

---

## A2A (Agent-to-Agent)

| DriftGuard term | Plain meaning | Notes |
|-----------------|---------------|-------|
| **Agent Card** | A2A discovery document | Usually `/.well-known/agent.json` — declares skills and I/O schemas |
| **A2A Contract Watch** | Card + MCP + API reconciliation | Detects silent mismatch between declared skills and runtime tools |
| **skillToolMap** | Manifest mapping | A2A skill id → MCP tool name(s) in `.driftguard/agents.yaml` |
| **Silent skew** | Runtime changed, declaration didn't | e.g. MCP tool schema changed; Agent Card unchanged — warning rule A2A-SKEW-001 |
| **Correlation finding** | Rule-based contract mismatch | e.g. `A2A-MCP-002` — skill requires field MCP tool lacks |

Guide: [A2A Contract Watch](./guides/a2a-contract-watch.md). Implementation tasks: [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md).

- [Getting started](./getting-started.md) — use these terms in the onboarding steps
- [Reference](./reference/README.md) — exact tool and CLI contracts
- [docs/README.md](./README.md) — documentation hub
