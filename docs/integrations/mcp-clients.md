# MCP clients

DriftGuard runs as a **stdio** MCP server. Copy [examples/mcp-client-config.json](../../examples/mcp-client-config.json) — npx-based, no absolute paths.

**Guide:** [Agent / MCP](../guides/agent-mcp.md) · **Setup:** [QUICKSTART.md](../QUICKSTART.md#3-connect-cursor-mcp)

---

## Supported clients

| Client | Config file | Notes |
|--------|-------------|-------|
| **Cursor** | `.cursor/mcp.json` | Project or user scope |
| **Claude Desktop** | `claude_desktop_config.json` | User config directory |
| **Windsurf** | MCP settings (stdio) | Same JSON shape |
| **Zed** | Agent settings MCP block | Same JSON shape |

---

## Minimal config (offline)

```json
{
  "mcpServers": {
    "driftguard": {
      "command": "npx",
      "args": ["-y", "driftguard@0.3.3", "mcp"]
    }
  }
}
```

Requires Node.js 20+ and network for first `npx` fetch. **Contributors** clone this repo and use `npm run mcp` after build.

**Works without API key:** `compare_json`, `parse_mcp_config`, `hosted_info`, `explain_drift`.

---

## Hosted tools

Add `DRIFTGUARD_API_KEY` to `env` when you have a Pro/Team key or trial workflow:

```json
"env": {
  "DRIFTGUARD_API_KEY": "dg_…"
}
```

Trial: [driftguard.org/start](https://driftguard.org/start)

---

## Registry discovery

Publish metadata from [server.json](../../server.json) when npm package is available — [DISCOVERY.md](../DISCOVERY.md).

Agent index: [llms.txt](../llms.txt) · [SYSTEM_PROMPT.md](../../SYSTEM_PROMPT.md).

---

## Next steps

| Goal | Doc |
|------|-----|
| Tool selection order | [agent-mcp.md](../guides/agent-mcp.md) |
| CI scan of mcp.json | [CI/CD guide](../guides/ci-cd.md) |
| Integrations index | [README.md](./README.md) |
