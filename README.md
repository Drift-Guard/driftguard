# DriftGuard

[![CI](https://github.com/kioie/driftguard/actions/workflows/ci.yml/badge.svg)](https://github.com/kioie/driftguard/actions/workflows/ci.yml)

**Catch schema drift before your integrations break.**

Open-source **local JSON schema diff** + **MCP client** for developers and AI agents. Continuous API/MCP monitoring, alerts, and history run on **[hosted DriftGuard Pro/Team](https://driftguard.org/pricing)**.

> **Not full self-host:** this repo is the client layer (diff + MCP connector). The monitoring pipeline is a managed service — see [OPEN_CORE.md](OPEN_CORE.md).

---

## Why this repo?

| | **This repo (OSS client)** | **Hosted DriftGuard** |
|---|---|---|
| **Goal** | Test locally, integrate with agents | Production monitoring |
| **Diff JSON schemas** | ✅ CLI + MCP | ✅ + history |
| **Parse mcp.json preview** | ✅ offline | ✅ + auto-import |
| **Continuous checks** | ❌ | ✅ cron + queues |
| **MCP tools/list polling** | ❌ | ✅ |
| **Alerts & console** | ❌ | ✅ |

Use the OSS client to **try and integrate**. Upgrade when you need **always-on monitoring**.

---

## Quick start

```bash
git clone https://github.com/kioie/driftguard
cd driftguard && npm ci && npm run build
```

### CLI

```bash
npm run check -- diff '{"id":1,"email":"a@b.com"}' '{"id":1}'
# exit 1 if breaking changes
```

### MCP server (Cursor, Claude, Windsurf)

See [docs/QUICKSTART.md](docs/QUICKSTART.md) and [examples/mcp-client-config.json](examples/mcp-client-config.json).

```json
{
  "mcpServers": {
    "driftguard": {
      "command": "node",
      "args": ["/absolute/path/to/driftguard/dist/mcp/server.js"]
    }
  }
}
```

Add `"DRIFTGUARD_API_KEY": "dg_…"` under `env` for monitoring tools.

---

## MCP tools

| Tool | API key | Purpose |
|------|---------|---------|
| `compare_json` | No | Local before/after JSON schema diff |
| `parse_mcp_config` | No | Preview watch URLs from mcp.json (no create) |
| `hosted_info` | No | Offline vs hosted matrix, trial/pricing links |
| `explain_drift` | No | Remediation hints for breaking changes |
| `register_watch` | **Pro** | Continuous monitoring |
| `check_watch` | **Pro** | Immediate check |
| `list_watches` | **Pro** | List watches |
| `list_drift_events` | **Pro** | Drift history |
| `suggest_watches` | **Pro** | Import mcp.json + optional create |
| `assert_coverage` | **Pro** | CI gate — deps must be watched |

**Agents:** read [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) for when-to-use guidance.

---

## CI integration

Pin the client version in your pipeline:

```yaml
- uses: kioie/driftguard/.github/actions/drift-diff@v0.3.1
  with:
    before: '{"id":1,"email":"a@b.com"}'
    after: '{"id":1}'
```

```bash
npx driftguard@0.3.1 diff "$BEFORE" "$AFTER"
npx driftguard@0.3.1 assert-coverage   # Pro/Team — needs DRIFTGUARD_API_KEY
driftguard version --json              # prints embed paths for agents
```

Full model: [docs/CI.md](docs/CI.md) · Examples: [examples/workflows/](examples/workflows/)

---

1. **Try offline** — `compare_json`, `parse_mcp_config` in Cursor (no signup)
2. **Start trial** — [driftguard.org/start](https://driftguard.org/start) (full Pro on one endpoint)
3. **Add API key** — set `DRIFTGUARD_API_KEY` in MCP env → monitoring tools unlock
4. **Team** — [pricing](https://driftguard.org/pricing) for more watches, audit export, SSO

Optional: override hosted URL with `DRIFTGUARD_API` (default: workers.dev).

---

## Project structure

```
src/core/          # Schema inference + diff (MIT)
src/cli/           # driftguard diff | mcp
src/mcp/           # MCP server (local + hosted proxy)
examples/          # MCP client config template
docs/              # Quick start, discovery
AGENTS.md          # Agent contribution guide
SYSTEM_PROMPT.md   # Agent tool reference
server.json        # MCP Registry metadata
OPEN_CORE.md       # Public vs hosted boundary
```

---

## For AI agents

| Doc | Use |
|-----|-----|
| [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) | Tool matrix, decision flow, config |
| [docs/CI.md](docs/CI.md) | Version-pinned CI paths (Actions, npx, assert) |
| [AGENTS.md](AGENTS.md) | Editing this repo |
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Setup steps |

Call MCP tool **`hosted_info`** at runtime for current URLs and capability matrix.

---

## Design

Brand kit: [docs/DESIGN.md](docs/DESIGN.md)

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) — public client only.

## License

MIT — [LICENSE](LICENSE). Applies to this repository only; hosted service is separate.
