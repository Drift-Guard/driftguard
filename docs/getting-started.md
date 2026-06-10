# Getting started

A progressive checklist from **first local diff** to **optional hosted monitoring**. Each step builds on the previous one; skip ahead only if you already completed earlier steps.

**Prerequisites:** Node.js 20+, git. No account required until step 6.

**Boundary:** This repo is the open-source **client** (diff + MCP connector). Continuous watches, MCP polling, alerts, and the console are [hosted Pro/Team](https://driftguard.org/pricing) — see [OPEN_CORE.md](../OPEN_CORE.md).

---

## 1. Install the OSS client

Clone, install dependencies, and compile TypeScript to `dist/`.

```bash
git clone https://github.com/kioie/driftguard.git
cd driftguard
npm ci
npm run build
```

Verify the CLI:

```bash
npm run check -- version
```

**Next:** Run your first schema diff (step 2).

---

## 2. Run your first diff

Compare two JSON payloads. Exit code `1` means at least one **breaking** change was detected.

```bash
npm run check -- diff '{"user":{"id":1}}' '{"user":{"id":1,"email":"a@b.com"}}'
```

Use this for CI fixtures, API response snapshots, or MCP tool output — any before/after JSON pair.

| Output field | Meaning |
|--------------|---------|
| `breakingCount` | Changes that can break existing consumers |
| `additiveCount` | Safe additions (new optional fields, etc.) |
| `changes` | Per-field change list |

Diff semantics: [Reference — diff rules](./reference/README.md#diff-semantics).

**Next:** Connect an MCP client (step 3).

---

## 3. Connect an MCP client

Add DriftGuard to Cursor, Claude Desktop, Windsurf, or Zed via stdio.

1. Copy [examples/mcp-client-config.json](../examples/mcp-client-config.json).
2. Set the **absolute path** to `dist/mcp/server.js` on your machine.
3. Restart the MCP client.

**Cursor** — `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "driftguard": {
      "command": "node",
      "args": ["/Users/you/driftguard/dist/mcp/server.js"]
    }
  }
}
```

**Offline tools work immediately** (no API key):

- `compare_json` — same diff as the CLI
- `parse_mcp_config` — preview watch URLs from `mcp.json`
- `hosted_info` — OSS vs hosted matrix and upgrade links
- `explain_drift` — remediation hints after breaking diffs

Start the server manually if needed:

```bash
npm run mcp
# or: node dist/cli/check.js mcp
```

More detail: [QUICKSTART.md](./QUICKSTART.md#3-connect-cursor-mcp).

**Next:** Preview dependencies from `mcp.json` (step 4).

---

## 4. Preview MCP dependencies (offline)

Before registering watches, see what URLs DriftGuard would monitor.

Ask your agent to call **`parse_mcp_config`** with your project's `mcp.json` contents, or pass free text containing `https://` URLs.

- **Does:** List watch candidates from HTTPS URLs in config or text.
- **Does not:** Create watches, run checks, or poll remote MCP over stdio.
- **Sibling tool:** `suggest_watches` (hosted, step 6) for catalog matching and auto-import.

Stdio-only MCP servers without URLs need hosted MCP polling — not available in this repo.

**Next:** Optional CI hook (step 5).

---

## 5. Optional — add a CI hook

Pin a version and add breaking-diff detection to your pipeline. Start with the free **hook** layer; upgrade through preview → trial → gate when ready.

**Simplest path:** copy [examples/workflows/driftguard-starter.yml](../examples/workflows/driftguard-starter.yml) to `.github/workflows/driftguard.yml`.

```yaml
- uses: kioie/driftguard/.github/actions/drift-diff@v0.3.3
  with:
    before: '{"status":"ok","data":{"id":1}}'
    after: '{"status":"ok","data":{"id":1,"name":"test"}}'
```

**Funnel tiers:**

| Tier | Blocks CI? | API key |
|------|------------|---------|
| Hook (`drift-diff`) | On breaking diff only | No |
| Preview (`drift-coverage-preview`) | No (by default) | No |
| Gate (`drift-coverage`) | Yes — deps must be watched | Pro key or trial |

Full model: [CI.md](./CI.md). GitLab: [GITLAB_CI.md](./GITLAB_CI.md).

**Next:** Upgrade to hosted monitoring (step 6).

---

## 6. Upgrade — trial, API key, watches

When you need continuous checks, drift history, or CI coverage gates:

1. **Start a trial** — [driftguard.org/start](https://driftguard.org/start) (one endpoint, full Pro in console).
2. **Get an API key** — [driftguard.org/pricing](https://driftguard.org/pricing) after trial or checkout.
3. **Set env** — add `DRIFTGUARD_API_KEY` to MCP `env` or CI secrets.
4. **Import watches** — call `suggest_watches` with `create: true`, or `register_watch` per URL.

| Tool | Purpose |
|------|---------|
| `suggest_watches` | Import `mcp.json` with catalog matching; optional create |
| `register_watch` | Register one URL for continuous monitoring |
| `list_watches` | List watches and health |
| `check_watch` | Immediate check on a watch |
| `list_drift_events` | Drift history |
| `assert_coverage` | CI gate — all discovered deps must be watched |

Call **`hosted_info`** anytime to confirm which tools are available without a key.

---

## Checklist summary

- [ ] `npm ci && npm run build`
- [ ] First `diff` with breaking vs additive output understood
- [ ] MCP client connected; `compare_json` works in agent
- [ ] `parse_mcp_config` run on project `mcp.json`
- [ ] (Optional) CI hook or preview workflow added
- [ ] (Optional) Trial or API key; `suggest_watches` or `register_watch`

---

## Next steps

| Goal | Doc |
|------|-----|
| Guides by role | [guides/README.md](./guides/README.md) |
| Term definitions | [Glossary](./glossary.md) |
| MCP + CLI contracts | [Reference](./reference/README.md) |
| Agent tool selection | [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md) |
| Registry listings | [DISCOVERY.md](./DISCOVERY.md) |
| Documentation hub | [docs/README.md](./README.md) |
