# DriftGuard

**Catch API and MCP schema changes before they break production.**

DriftGuard monitors REST API responses and MCP server tool definitions for breaking schema drift. Built for the post-Optic era and AI agent developers who depend on third-party APIs and MCP tools.

## Why DriftGuard?

- **Optic is dead** — teams need a replacement for continuous API drift detection
- **MCP is exploding** — no tool focused on monitoring MCP server tool schema changes
- **AI agents break silently** — when a tool's input schema changes, your agent fails in production

## Features

- REST API response schema inference and diffing
- MCP server `tools/list` monitoring
- Breaking / warning / info change classification
- MCP server for Cursor, Claude, and any MCP client
- Webhook alerts on drift detection
- Self-hosted or hosted (Pro)

## Quick start

```bash
git clone https://github.com/kioie/driftguard
cd driftguard
npm install
npm run dev
```

Open http://localhost:3000

### CLI diff

```bash
npm run check -- diff '{"id":1,"name":"a"}' '{"id":1}'
```

### MCP server (Cursor)

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "driftguard": {
      "command": "node",
      "args": ["/path/to/driftguard/dist/mcp/server.js"],
      "env": {
        "DRIFTGUARD_DB": "/path/to/driftguard/driftguard.db"
      }
    }
  }
}
```

Build first: `npm run build && npm run mcp`

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/diff` | Diff two JSON payloads |
| POST | `/api/snapshot` | Capture schema from URL |
| POST | `/api/watches` | Register continuous watch |
| GET | `/api/watches` | List watches |
| POST | `/api/watches/:id/check` | Run check now |
| GET | `/api/drift` | List drift events |

## Pricing

| Plan | Price | Watches | Check interval |
|------|-------|---------|----------------|
| Free | $0 | 3 | Daily |
| Pro | $19/mo | 25 | Hourly |
| Team | $49/mo | 100 | 15 min |

## Deploy to Fly.io

```bash
fly volumes create driftguard_data --size 1
fly secrets set CRON_SECRET=$(openssl rand -hex 32)
fly deploy
```

## Monetization

See [MONETIZATION.md](./MONETIZATION.md) for the full go-to-market playbook.

## License

MIT — core engine and MCP server are open source. Hosted monitoring is a paid service.
