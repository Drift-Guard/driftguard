# DriftGuard

[![CI](https://github.com/Drift-Guard/driftguard/actions/workflows/ci.yml/badge.svg)](https://github.com/Drift-Guard/driftguard/actions/workflows/ci.yml)

**Catch API and schema changes before your integrations break.**

> **Start hosted trial (no credit card):** [**driftguard.org/start**](https://driftguard.org/start?utm_source=github&utm_medium=readme&utm_campaign=dg-readme-trial) — full Pro on one endpoint, ~2 minutes.  
> **10-min MCP drift lab:** [Dev.to tutorial](https://dev.to/kioiek/catch-mcp-tool-schema-drift-in-10-minutes-live-demo-optional-watch-4ao2?utm_source=github&utm_medium=readme&utm_campaign=dg-readme-tutorial) · [ToolSchema Kit](https://github.com/kioie/toolschema-kit)

DriftGuard compares JSON contracts locally (free CLI and MCP client) and runs scheduled checks with alerts when you need always-on **API contract monitoring** and **contract observability** on **[hosted Pro/Team](https://driftguard.org/pricing)**.

Use **schema drift CI** (`compare_json`, GitHub Actions) before merge; use hosted watches when you need **MCP tool catalog drift** detection in production.

> **Not full self-host:** this repo is the client layer (diff + MCP connector). The monitoring pipeline is a managed service — see [OPEN_CORE.md](OPEN_CORE.md).

### Not to be confused with

Many projects share the name **DriftGuard**. This repo ([Drift-Guard/driftguard](https://github.com/Drift-Guard/driftguard)) is **API and MCP schema drift** monitoring — canonical product: [driftguard.org](https://driftguard.org).

- **[npm `driftguard`](https://www.npmjs.com/package/driftguard)** — UI linter (sjamcox), not schema drift.
- **[npm `driftguard-mcp`](https://www.npmjs.com/package/driftguard-mcp)** — conversation-drift MCP (jschoemaker), not contract monitoring.
- **[getdriftguard](https://www.npmjs.com/package/driftguard-cli)** — API schema CLI under npm user `driftguard`; different vendor and scope.
- **GitHub orgs / ML libs** — assorted `driftguard` repos (GitOps, Python ML, etc.); verify `Drift-Guard/driftguard` or driftguard.org before integrating.

See [docs/DISCOVERY.md](docs/DISCOVERY.md) and [docs/npm-org-chase.md](docs/npm-org-chase.md) for the `@driftguard` scoped npm publish path.

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

**CI:** one-file starter — [examples/workflows/driftguard-starter.yml](examples/workflows/driftguard-starter.yml) · GitLab — [docs/GITLAB_CI.md](docs/GITLAB_CI.md) · GitHub Marketplace path — [docs/GITHUB_MARKETPLACE.md](docs/GITHUB_MARKETPLACE.md)

---

## Quick start

```bash
npx @driftguard/driftguard@latest version
npx @driftguard/driftguard@latest diff '{"id":1,"email":"a@b.com"}' '{"id":1}'
# exit 1 if breaking changes
```

Until `@driftguard` is on npm, clone and build — see [docs/QUICKSTART.md](docs/QUICKSTART.md#1-install).

### CLI

Same commands as above; from a local clone use `npm run check -- diff …` after `npm run build`.

### MCP server (Cursor, Claude, Windsurf)

See [docs/QUICKSTART.md](docs/QUICKSTART.md), [examples/mcp-client-config.json](examples/mcp-client-config.json), and [examples/AGENTS-snippet.md](examples/AGENTS-snippet.md) for consumer repos.

**From a local clone** (after `npm run build`):

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

**Or via npx** (no clone — copy from [examples/mcp-client-config.json](examples/mcp-client-config.json)):

```json
{
  "mcpServers": {
    "driftguard": {
      "command": "npx",
      "args": ["-y", "@driftguard/driftguard@0.3.3", "mcp"]
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

Pin the client version and follow the **hook → preview → trial → gate** funnel:

```yaml
# 1. Hook (free)
- uses: Drift-Guard/driftguard/.github/actions/drift-diff@v0.3.3
  with:
    before: '{"id":1}'
    after: '{"id":1,"name":"x"}'

# 2. Preview (free — links to console, non-blocking)
- uses: Drift-Guard/driftguard/.github/actions/drift-coverage-preview@v0.3.3
  with:
    files-json: '[{"path":"mcp.json","content":"..."}]'

# 3. Gate (Pro API key — blocks until all deps watched)
- uses: Drift-Guard/driftguard/.github/actions/drift-coverage@v0.3.3
  with:
    api-key: ${{ secrets.DRIFTGUARD_API_KEY }}
    files-json: '...'
```

Full model: [docs/CI.md](docs/CI.md)

---

1. **Try offline** — `compare_json`, `parse_mcp_config` in Cursor (no signup)
2. **Start trial** — [driftguard.org/start](https://driftguard.org/start) (full Pro on one endpoint)
3. **Add API key** — set `DRIFTGUARD_API_KEY` in MCP env → monitoring tools unlock
4. **Team** — [pricing](https://driftguard.org/pricing) for more watches, audit export, SSO

**Advanced (rare):** override hosted URL with `DRIFTGUARD_API` (default `https://driftguard.org`). Non-default values require `DRIFTGUARD_ALLOW_CUSTOM_API=1` — otherwise the client pins to the official host so a malicious MCP config cannot exfiltrate your API key.

---

## Project structure

```
src/core/          # Schema inference + diff (MIT)
src/cli/           # driftguard diff | mcp
src/mcp/           # MCP server (local + hosted proxy)
examples/          # MCP client config template
docs/              # Documentation hub, quick start, reference
AGENTS.md          # Agent contribution guide
SYSTEM_PROMPT.md   # Agent tool reference
server.json        # MCP Registry metadata
OPEN_CORE.md       # Public vs hosted boundary
```

---

## For AI agents

| Doc | Use |
|-----|-----|
| [docs/README.md](docs/README.md) | Documentation hub — pillars, OSS vs hosted, nav |
| [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) | Tool matrix, decision flow, config |
| [docs/getting-started.md](docs/getting-started.md) | Progressive onboarding funnel |
| [docs/reference/](docs/reference/README.md) | MCP + CLI reference index |
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
