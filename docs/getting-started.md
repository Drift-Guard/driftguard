# Getting started

A step-by-step checklist from **your first local diff** to **optional hosted monitoring**. Do each step in order unless you already finished the earlier ones.

**Before you start:** Node.js 20+, git. No account needed until step 6.

**What's in this repo:** The free **client** (diff + MCP connector). Scheduled checks, MCP polling, alerts, and the console are [hosted Pro/Team](https://driftguard.org/pricing) — see [OPEN_CORE.md](../OPEN_CORE.md).

**Design-time:** If you are evaluating **contract observability**, start with offline **mcp.json preflight** (`parse_mcp_config`) and **schema drift CI** (`compare_json` in CI). Add **API contract monitoring** when you need continuous hosted watches.

---

## 1. Install the free client

Clone, install dependencies, and build.

```bash
git clone https://github.com/kioie/driftguard.git
cd driftguard
npm ci
npm run build
```

Check the CLI works:

```bash
npm run check -- version
```

**Next:** Run your first schema diff (step 2).

---

## 2. Run your first diff

Compare two JSON payloads. Exit code `1` means at least one **breaking** change was found.

```bash
npm run check -- diff '{"user":{"id":1}}' '{"user":{"id":1,"email":"a@b.com"}}'
```

Use this for CI fixtures, API response snapshots, or MCP tool output — any before/after JSON pair.

| Output field | Meaning |
|--------------|---------|
| `breakingCount` | Changes that can break existing apps |
| `additiveCount` | Safe additions (new optional fields, etc.) |
| `changes` | Per-field change list |

Diff rules: [Reference — diff rules](./reference/README.md#diff-semantics).

**Next:** Connect an MCP client (step 3).

---

## 3. Connect an MCP client

Add DriftGuard to Cursor, Claude Desktop, Windsurf, or Zed via stdio.

1. Copy [examples/mcp-client-config.json](../examples/mcp-client-config.json) into your MCP client config.
2. Restart the MCP client — no absolute paths to edit.

**Cursor** — `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "driftguard": {
      "command": "npx",
      "args": ["-y", "driftguard@0.3.3", "mcp"],
      "env": {
        "DRIFTGUARD_API_KEY": ""
      }
    }
  }
}
```

**These tools work right away** (no API key):

- `compare_json` — same diff as the CLI
- `parse_mcp_config` — preview watch URLs from `mcp.json`
- `hosted_info` — what's free vs paid and upgrade links
- `explain_drift` — fix suggestions after breaking diffs

**Contributors** working in a clone: `npm run mcp` after `npm run build` — see [AGENTS.md](../AGENTS.md).

More detail: [QUICKSTART.md](./QUICKSTART.md#3-connect-cursor-mcp).

**Add to your agent instructions:** copy [examples/AGENTS-snippet.md](../examples/AGENTS-snippet.md) into your project's `AGENTS.md` or `.cursor/rules`.

**Next:** Preview dependencies from `mcp.json` (step 4).

---

## 4. Preview MCP dependencies (offline)

Before you register scheduled checks, see what URLs DriftGuard would monitor.

Ask your agent to call **`parse_mcp_config`** with your project's `mcp.json` contents, or pass free text containing `https://` URLs.

- **Does:** List watch candidates from HTTPS URLs in config or text.
- **Does not:** Create watches, run checks, or poll remote MCP over stdio.
- **Related tool:** `suggest_watches` (hosted, step 6) for catalog matching and auto-import.

Stdio-only MCP servers without URLs need hosted MCP polling — not available in this repo.

**Next:** Optional CI hook (step 5).

---

## 5. Optional — add a CI hook

Pin a version and add breaking-diff detection to your pipeline. Start with the free **hook** layer; add preview → trial → gate when you're ready.

**Simplest path:** copy [examples/workflows/driftguard-starter.yml](../examples/workflows/driftguard-starter.yml) to `.github/workflows/driftguard.yml`.

```yaml
- uses: kioie/driftguard/.github/actions/drift-diff@v0.3.3
  with:
    before: '{"status":"ok","data":{"id":1}}'
    after: '{"status":"ok","data":{"id":1,"name":"test"}}'
```

**CI tiers:**

| Tier | Blocks CI? | API key |
|------|------------|---------|
| Hook (`drift-diff`) | On breaking diff only | No |
| Preview (`drift-coverage-preview`) | No (by default) | No |
| Gate (`drift-coverage`) | Yes — deps must be watched | Pro key or trial |

Full model: [CI.md](./CI.md). GitLab: [GITLAB_CI.md](./GITLAB_CI.md).

**Next:** Upgrade to hosted monitoring (step 6).

---

## 6. Upgrade — trial, API key, watches

When you need scheduled checks, change history, or CI coverage gates:

1. **Start a trial** — [driftguard.org/start](https://driftguard.org/start) (one endpoint, full Pro in console).
2. **Get an API key** — [driftguard.org/pricing](https://driftguard.org/pricing) after trial or checkout.
3. **Set env** — add `DRIFTGUARD_API_KEY` to MCP `env` or CI secrets.
4. **Import watches** — call `suggest_watches` with `create: true`, or `register_watch` per URL.

| Tool | What it does |
|------|--------------|
| `suggest_watches` | Import `mcp.json` with catalog matching; optional create |
| `register_watch` | Register one URL for continuous monitoring |
| `list_watches` | List watches and health |
| `check_watch` | Run one check now |
| `list_drift_events` | Change history |
| `assert_coverage` | CI gate — all discovered deps must be watched |

Call **`hosted_info`** anytime to see which tools need an API key.

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
