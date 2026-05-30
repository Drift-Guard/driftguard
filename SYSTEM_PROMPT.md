# SYSTEM_PROMPT — DriftGuard MCP client

Token-efficient reference for AI agents using or extending this repo. For repo workflows see [AGENTS.md](AGENTS.md).

## Identity

- **Package:** `driftguard` (npm, not yet published — clone + build)
- **Role:** Open-source **local JSON schema diff** + **MCP connector** to hosted DriftGuard SaaS
- **Not self-hostable:** continuous monitoring, MCP polling, alerts, and console are hosted-only

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `DRIFTGUARD_API_KEY` | For hosted tools only | Pro/Team API key (`dg_…`) |
| `DRIFTGUARD_API` | No | Override hosted base URL (default: `https://driftguard.eddy-d55.workers.dev`) |

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
| `list_drift_events` | Yes | Yes | Drift history |
| `suggest_watches` | Yes | Yes | Import mcp.json with catalog + optional create |
| `assert_coverage` | Yes | Yes | CI gate — dependencies must be watched |

## Agent decision flow

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
      "command": "node",
      "args": ["/absolute/path/to/driftguard/dist/mcp/server.js"],
      "env": {
        "DRIFTGUARD_API_KEY": "dg_…"
      }
    }
  }
}
```

Template: [examples/mcp-client-config.json](examples/mcp-client-config.json)

## CLI

```bash
npm run build
npm run check -- diff '{"a":1}' '{"a":1,"b":2}'
node dist/cli/check.js mcp   # or: npm run mcp
```

Exit code: `driftguard diff` exits **1** when `breakingCount > 0`.

## Do / Don't

| Do | Don't |
|----|-------|
| Use `compare_json` offline in CI | Assume this repo runs a monitoring server |
| Call `hosted_info` when key missing | Implement MCP polling in public repo |
| Point users to `/start` for trial | Call hosted tools without explaining upgrade |
| Keep tool descriptions: when / when-not / siblings | Hardcode version in server.ts (use constants.ts) |

## Funnel URLs

- Trial: `https://driftguard.eddy-d55.workers.dev/start`
- Pricing: `https://driftguard.eddy-d55.workers.dev/pricing`
- Console: `https://driftguard.eddy-d55.workers.dev/console`

## Key files

| Path | Purpose |
|------|---------|
| `src/core/diff.ts` | Diff engine |
| `src/mcp/server.ts` | MCP tool registrations |
| `OPEN_CORE.md` | Product boundary |
| `docs/QUICKSTART.md` | Human + agent setup |
