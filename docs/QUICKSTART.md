# Quick start

Get DriftGuard running locally for **schema diff** and **MCP integration**. Continuous monitoring requires [hosted Pro/Team](https://driftguard.org/pricing).

**Requirements:** Node.js 20+

## 1. Install

**Recommended** — no clone required (Node.js 20+):

```bash
npx @drift-guard/driftguard@latest version
```

Pin a semver for reproducible CI (`@0.3.3`) or use `@latest` for convenience.

> **Until `@drift-guard` is published on npm:** build from source instead:
>
> ```bash
> git clone https://github.com/Drift-Guard/driftguard.git
> cd driftguard && npm ci && npm run build
> npm run check -- version
> ```

## 2. Try local diff (CLI)

```bash
npx @drift-guard/driftguard@latest diff '{"user":{"id":1}}' '{"user":{"id":1,"email":"a@b.com"}}'
```

From a local clone, use `npm run check -- diff …` instead.

Exit code `1` means breaking changes were detected.

**schema drift CI:** add `compare_json` or the drift-diff Action to your pipeline — see [CI.md](./CI.md).

## 3. Connect Cursor (MCP)

Copy [examples/mcp-client-config.json](../examples/mcp-client-config.json) into your MCP client config — **no path edits required**.

**Offline tools work immediately** — no API key:

- `compare_json` — diff two JSON strings
- `parse_mcp_config` — **mcp.json preflight** (preview URLs from mcp.json)
- `hosted_info` — tool matrix and upgrade paths
- `explain_drift` — remediation hints (calls public hosted endpoint)

**Monitoring tools** need `DRIFTGUARD_API_KEY` from [pricing](https://driftguard.org/pricing) or start a [free trial](https://driftguard.org/start).

### Cursor `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "driftguard": {
      "command": "npx",
      "args": ["-y", "@drift-guard/driftguard@0.3.3", "mcp"],
      "env": {
        "DRIFTGUARD_API_KEY": ""
      }
    }
  }
}
```

Set `"DRIFTGUARD_API_KEY": "dg_…"` when you upgrade. Pin the semver in `args` (shown) or use `@latest` for convenience.

### Verify your key (hosted)

After trial or checkout, confirm the key before registering watches:

```bash
export DRIFTGUARD_API_KEY="dg_…"

curl -sf "https://driftguard.org/api/me" \
  -H "Authorization: Bearer $DRIFTGUARD_API_KEY"
```

Expect HTTP 200 with `plan`, `apiKeyHint` (masked), and `status` — never the full key. Or run `driftguard login` locally (same endpoint). Details: [hosted API — authentication](./reference/hosted-api.md#authentication).

**Contributors** editing this repo: use `npm run mcp` or `node dist/mcp/server.js` after `npm run build` — see [AGENTS.md](../AGENTS.md).

## 4. Typical agent workflows

### Pre-commit / CI (offline)

```bash
npm run build
node dist/cli/check.js diff "$BEFORE_JSON" "$AFTER_JSON"
```

### Preview MCP dependencies (offline)

Ask your agent to call `parse_mcp_config` with your project's `mcp.json` contents.

### Continuous monitoring (hosted)

1. Start trial or get Pro API key
2. Set `DRIFTGUARD_API_KEY` in MCP env
3. Use `suggest_watches` with `create: true` or `register_watch`

## 5. What you cannot self-host from this repo

This repository does **not** include:

- Scheduled endpoint checks
- MCP `tools/list` polling
- Web console, billing, or team features

See [OPEN_CORE.md](../OPEN_CORE.md). For agents: call `hosted_info` for the current capability matrix.

## Next steps

- [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md) — tool reference for AI agents
- [AGENTS.md](../AGENTS.md) — contributing with agents
- [docs/DISCOVERY.md](./DISCOVERY.md) — MCP registries and listings
