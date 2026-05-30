# Discovery and registries

How to list DriftGuard in MCP directories and help agents find the server.

## MCP Registry

Metadata lives in [server.json](../server.json) at the repo root. Publish when npm package is available:

```bash
# Requires mcp-publisher CLI — see https://modelcontextprotocol.io
mcp-publisher publish
```

## Client config template

Ship [examples/mcp-client-config.json](../examples/mcp-client-config.json) with docs — agents and humans copy absolute paths into Cursor, Claude Desktop, Windsurf, or Zed.

## Agent-readable docs

| File | Audience |
|------|----------|
| [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md) | LLM codegen / tool selection |
| [AGENTS.md](../AGENTS.md) | Agents editing this repo |
| [docs/QUICKSTART.md](./QUICKSTART.md) | Setup steps |

## Hosted funnel

The open-source client is the **top of funnel**. Listings should link:

- **GitHub** — local diff + MCP client (this repo)
- **Trial** — https://driftguard.eddy-d55.workers.dev/start
- **Pricing** — https://driftguard.eddy-d55.workers.dev/pricing

Do not imply full monitoring is self-hostable from the public repo.

## Community directories

When submitting to awesome-MCP lists or Glama/Smithery-style directories:

- **Name:** DriftGuard
- **Category:** Developer tools / API monitoring / Schema validation
- **Transport:** stdio
- **Offline capable:** yes (`compare_json`, `parse_mcp_config`)
- **Hosted dependency:** optional for monitoring tools

See [tiny-go-mcp-server docs/DISCOVERY.md](https://github.com/kioie/tiny-go-mcp-server/blob/main/docs/DISCOVERY.md) for a similar pattern.
