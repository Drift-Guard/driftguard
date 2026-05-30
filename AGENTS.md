# DriftGuard — Agent instructions

Guidance for AI coding agents working in this repository. For a compact tool/API cheat sheet, see [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md).

## Commands

| Command | Description |
|---------|-------------|
| `npm ci && npm run build` | Install and compile TypeScript → `dist/` |
| `npm test` | Run unit tests (`node --test`) |
| `npm run check -- diff '<before>' '<after>'` | Local JSON schema diff (exit 1 if breaking) |
| `npm run mcp` | Start MCP server on stdio (after build) |
| `npm run dev:mcp` | Start MCP via tsx (development) |

## Layout

```
src/core/diff.ts       # Schema inference + diff engine (public OSS)
src/cli/check.ts       # CLI entry (diff, mcp)
src/mcp/server.ts      # MCP server — local + hosted proxy tools
src/mcp/constants.ts   # Version, hosted URLs, server instructions
src/mcp/parse-mcp-json.ts  # Local mcp.json URL preview (no network)
examples/              # MCP client config templates
docs/                  # Quick start, discovery
```

## Open core boundary

| In this repo | Hosted only (not in public repo) |
|--------------|----------------------------------|
| `compare_json`, local CLI diff | Continuous cron/queue checks |
| `parse_mcp_config` preview | MCP tools/list polling |
| MCP proxy to hosted API | Multi-tenant watches, billing, console |
| `explain_drift` (public endpoint) | Alert routing, drift history export |

Do not document or implement hosted infrastructure in this repo. Funnel continuous monitoring to [hosted trial](https://driftguard.eddy-d55.workers.dev/start) and [pricing](https://driftguard.eddy-d55.workers.dev/pricing).

## MCP tool conventions

Follow the **when / when-not / siblings** pattern in tool descriptions (see [tiny-go-mcp-server](https://github.com/kioie/tiny-go-mcp-server) for reference):

- **Names:** `snake_case`
- **Offline first:** agents should prefer `compare_json` and `parse_mcp_config` before calling hosted tools
- **Hosted tools:** must fail clearly with trial/pricing URLs when `DRIFTGUARD_API_KEY` is missing
- **Version:** read from `package.json` via `src/mcp/constants.ts` — keep in sync

## Code style

- ESM + TypeScript strict mode
- No secrets in tool responses
- MCP logs go to **stderr** only (stdio is the protocol)
- Match existing patterns in `src/core/diff.ts` for tests

## CI expectations

PRs should pass: `npm ci`, `npm run build`, `npm test`, and `bash .github/scripts/check-coverage.sh 60`.

Non-draft PRs may receive an automated OpenRouter code review when `OPENROUTER_API_KEY` is configured (`.github/workflows/openrouter-pr-review.yml`). Comment `/review` to re-run.

## Publishing

- Registry metadata: [server.json](server.json)
- Discovery steps: [docs/DISCOVERY.md](docs/DISCOVERY.md)
- npm publish is optional; document clone + build path until published
