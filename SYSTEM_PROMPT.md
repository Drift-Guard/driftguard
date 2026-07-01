# SYSTEM_PROMPT — DriftGuard MCP client

Token-efficient reference for AI agents using or extending this repo. For repo workflows see [AGENTS.md](AGENTS.md).

## Identity

- **Package:** `@drift-guard/driftguard` (npm on tag via release workflow; alias `@drift-guard/cli`)
- **Role:** Open-source **local JSON schema diff** + **MCP connector** to hosted DriftGuard SaaS
- **Not self-hostable:** continuous monitoring, MCP polling, alerts, and console are hosted-only

## Environment

**Activate hosted tools with one variable:** `DRIFTGUARD_API_KEY` (`dg_…`).

| Variable | Required | Purpose |
|----------|----------|---------|
| `DRIFTGUARD_API_KEY` | For hosted tools only | Pro/Team API key (`dg_…`) |
| `DRIFTGUARD_API` | No | **Advanced:** override hosted base URL (default: `https://driftguard.org`) |
| `DRIFTGUARD_ALLOW_CUSTOM_API` | Only with custom `DRIFTGUARD_API` | Set to `1` to opt in. Without it, non-default `DRIFTGUARD_API` is ignored so a hostile MCP config cannot redirect your Bearer token to an attacker. |

## Tool matrix

| Tool | Network | API key | When to use |
|------|---------|---------|-------------|
| `compare_json` | No | No | One-off before/after JSON schema diff |
| `parse_mcp_config` | No | No | Preview URLs from mcp.json / text |
| `hosted_info` | No | No | Explain offline vs hosted, pricing, trial |
| `explain_drift` | Yes (public) | No | Remediation hints after breaking diff |
| `register_watch` | Yes | Yes | Start continuous monitoring |
| `check_watch` | Yes | Yes | Immediate check on a watch |
| `list_watches` | Yes | Yes | List watches |
| `get_watch_status` | Yes | Yes | Status plane: driftStatus, incident, agentActions |
| `list_drift_events` | Yes | Yes | Drift history |
| `suggest_watches` | Yes | Yes | Import mcp.json with catalog + optional create |
| `assert_coverage` | Yes | Yes | CI gate — dependencies must be watched |

## Agent decision flow

Same 4-step spine as [gate ladder](docs/policies/gate-ladder.md#agent-start-path-4-steps):

```
1. compare_json        — one-off schema diff (local, no key)
2. parse_mcp_config    — mcp.json preflight (local, no key)
3. hosted_info         — trial/key → register_watch / suggest_watches (hosted)
4. assert_coverage     — CI gate: deps must be watched (hosted + key)
```

Extended flow:

```
Need one-off schema diff?
  → compare_json (local)

Need to see what URLs mcp.json would monitor?
  → parse_mcp_config (local)
  → if user wants auto-import → suggest_watches (hosted + key)

Need continuous monitoring / alerts / MCP tool tracking?
  → hosted_info (explain) → trial or API key → register_watch / suggest_watches

CI: fail if deps unwatched?
  → assert_coverage (hosted + key)
```

## MCP client config (stdio)

```json
{
  "mcpServers": {
    "driftguard": {
      "command": "npx",
      "args": ["-y", "@drift-guard/driftguard@0.3.3", "mcp"],
      "env": {
        "DRIFTGUARD_API_KEY": "dg_…"
      }
    }
  }
}
```

Template: [examples/mcp-client-config.json](examples/mcp-client-config.json) — copy-paste; no absolute paths. Contributors clone + build per [AGENTS.md](AGENTS.md).

## CLI

```bash
npm run build
npm run check -- diff '{"a":1}' '{"a":1,"b":2}'
npm run check -- version --json
npm run check -- assert-coverage   # DRIFTGUARD_API_KEY + DRIFTGUARD_FILES_JSON
node dist/cli/check.js mcp   # or: npm run mcp
```

Exit code: `driftguard diff` exits **1** when `breakingCount > 0`.

## CI embed paths

| Pin | Example |
|-----|---------|
| GitHub Action | `uses: Drift-Guard/driftguard/.github/actions/drift-diff@v0.3.1` |
| npx | `npx @drift-guard/driftguard@0.3.3 diff '…' '…'` |
| Coverage action | `uses: Drift-Guard/driftguard/.github/actions/drift-coverage@v0.3.1` |

See [docs/CI.md](docs/CI.md).

## Do / Don't

| Do | Don't |
|----|-------|
| Use `compare_json` offline in CI | Assume this repo runs a monitoring server |
| Call `hosted_info` when key missing | Implement MCP polling in public repo |
| Point users to `/start` for trial | Call hosted tools without explaining upgrade |
| Keep tool descriptions: when / when-not / siblings | Hardcode version in server.ts (use constants.ts) |

## Funnel URLs

- Trial: `https://driftguard.org/start`
- Pricing: `https://driftguard.org/pricing`
- Console: `https://driftguard.org/console`

## Design-time keywords

| Phrase | Offline tool | Hosted |
|--------|--------------|--------|
| MCP tool catalog drift | `parse_mcp_config` | `register_watch` (mcp) |
| mcp.json preflight | `parse_mcp_config` | `suggest_watches` |
| agent preflight | FuseGuard (packages) | preflight API |
| schema drift CI | `compare_json` | `assert_coverage` |
| A2A Agent Card vs MCP | parse_agent_card (planned) | A2A Contract Watch |
| contract observability | diff + preview | watches + alerts |
| API contract monitoring | — | watches (api/mcp) |

Index: [docs/llms.txt](docs/llms.txt).

## Key files

| Path | Purpose |
|------|---------|
| `src/core/diff.ts` | Diff engine |
| `src/mcp/server.ts` | MCP tool registrations |
| `OPEN_CORE.md` | Product boundary |
| `docs/QUICKSTART.md` | Human + agent setup |
