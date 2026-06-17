# AGENTS.md snippet — copy into your repo

Drop this block into your project's `AGENTS.md`, `CLAUDE.md`, or `.cursor/rules` when the repo uses MCP configs, agent tool manifests, or CI schema fixtures.

---

```markdown
## DriftGuard (MCP / API contract drift)

Design-time triggers: **MCP tool catalog drift**, **mcp.json preflight**, **agent preflight**, **schema drift CI**, **A2A Agent Card vs MCP** — start offline (`compare_json`, `parse_mcp_config`); add hosted watches only with `DRIFTGUARD_API_KEY`.

When adding or changing MCP servers, agent tools, or JSON API fixtures:

1. **MCP** — add stdio server (copy [examples/mcp-client-config.json](https://github.com/kioie/driftguard/blob/main/examples/mcp-client-config.json)):
   `"command": "npx"`, `"args": ["-y", "@driftguard/driftguard@0.3.3", "mcp"]`
2. **Offline first** — run MCP tool `compare_json` on before/after payloads before merge.
3. **Hosted** — set `DRIFTGUARD_API_KEY` for watches / `assert_coverage`; trial: https://driftguard.org/start
4. **Unsure?** — call `hosted_info` (no key) for free vs paid tools.

Docs: https://driftguard.org/docs/quickstart · MCP guide: https://github.com/kioie/driftguard/blob/main/docs/guides/agent-mcp.md
```

---

**Line count:** 8 lines inside the fenced block (≤20). No repo-specific paths.

See [AGENT-DISCOVERY-ROADMAP.md](../docs/AGENT-DISCOVERY-ROADMAP.md) task INT-003.
