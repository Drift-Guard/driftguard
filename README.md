# DriftGuard

**Catch schema drift before your integrations break.**

DriftGuard monitors APIs and MCP servers for breaking changes. This repo is the **open-source client** — a local JSON diff tool and MCP connector. Continuous monitoring, MCP tool tracking, and alerts run on **hosted DriftGuard** (Pro/Team).

## What's in this repo (public)

| Component | Description |
|-----------|-------------|
| CLI | Diff two JSON payloads locally |
| MCP server | `compare_json` runs locally; monitoring tools call hosted API |
| Tests | Core schema diff engine |

## What's hosted (not in this repo)

- Continuous endpoint monitoring
- MCP server tool schema tracking
- Alert routing and drift history
- Billing and team features

## Quick start

```bash
git clone https://github.com/kioie/driftguard
cd driftguard && npm install && npm run build
```

### CLI

```bash
npm run check -- diff '{"id":1,"email":"a@b.com"}' '{"id":1}'
```

### MCP server (Cursor)

```json
{
  "mcpServers": {
    "driftguard": {
      "command": "node",
      "args": ["/path/to/driftguard/dist/mcp/server.js"],
      "env": {
        "DRIFTGUARD_API_KEY": "your-pro-api-key"
      }
    }
  }
}
```

- **`compare_json`** — works offline, no API key needed
- **Monitoring tools** — require a Pro/Team API key from [DriftGuard pricing](https://driftguard.dev/pricing)

## Pricing

Hosted plans start at **$19/mo**. See [driftguard.dev/pricing](https://driftguard.dev/pricing).

## Open core model

We open-source the local diff client to build trust and integrate with developer workflows. The hosted monitoring pipeline — especially MCP-native continuous tracking — is proprietary.

## License

MIT — applies to files in this repository only.
