# Agent / MCP guide

How AI agents should use DriftGuard MCP tools: **free tools first**, clear **when / when-not / siblings**, and hosted tools only after you opt into trial or Pro.

**Companion:** [SYSTEM_PROMPT.md](../../SYSTEM_PROMPT.md) — compact tool matrix and decision flow.

**Before you start:** MCP client connected per [Getting started step 3](../getting-started.md#3-connect-an-mcp-client). Config template: [examples/mcp-client-config.json](../../examples/mcp-client-config.json).

---

## Overview

The free MCP server exposes local diff and config preview without network. **Works offline** for `compare_json` and `parse_mcp_config`; `DRIFTGUARD_API_KEY` enables continuous watches and CI gates. Call **`hosted_info`** when you ask about self-hosting, pricing, or why a hosted tool failed.

For **agent preflight**, pair offline `compare_json` with FuseGuard runtime checks (see [gate ladder](../policies/gate-ladder.md)). For **MCP tool catalog drift**, use hosted watches after **mcp.json preflight** with `parse_mcp_config`.

What's free vs paid: [OPEN_CORE.md](../../OPEN_CORE.md).

---

## Free tools first (recommended order)

```
1. compare_json        — one-off before/after JSON diff (no key)
2. parse_mcp_config    — preview URLs from mcp.json (no key)
3. hosted_info         — explain free vs paid, trial, pricing (no key)
4. explain_drift       — fix suggestions after breaking diff (public endpoint, no key)

— you opt into hosted —

5. suggest_watches     — import mcp.json + optional create (key)
6. register_watch      — register one URL (key)
7. check_watch / list_watches / list_drift_events (key)
8. assert_coverage     — CI gate: deps must be watched (key)
```

Full catalog: [Reference — MCP tools](../reference/README.md#mcp-tools).

---

## When / when-not / siblings

Each tool description in `src/mcp/server.ts` follows this pattern. Read sibling hints before calling a hosted tool.

| Tool | When | When not | Siblings |
|------|------|----------|----------|
| `compare_json` | One-off JSON schema diff | Continuous monitoring | `explain_drift`; `register_watch` for watches |
| `parse_mcp_config` | Preview watch candidates offline | Creating watches | `suggest_watches` (hosted import) |
| `hosted_info` | Free vs paid, API keys, trial | Substitute for running a diff | All tools — returns capability matrix |
| `explain_drift` | After breaking `compare_json` | Watch registration | `compare_json` first |
| `suggest_watches` | Auto-import from mcp.json | One-off diff only | `parse_mcp_config` preview first |
| `assert_coverage` | CI: fail if deps unwatched | Local diff | `parse_mcp_config` / preview in CI |

---

## Decision flow

```
Need one-off schema diff?
  → compare_json

Need URLs mcp.json would monitor?
  → parse_mcp_config
  → want auto-import? → suggest_watches (key)

Need continuous monitoring / alerts / MCP tool tracking?
  → hosted_info → trial or API key → register_watch / suggest_watches

CI: fail if deps unwatched?
  → assert_coverage (key)
```

Same flow in [SYSTEM_PROMPT.md](../../SYSTEM_PROMPT.md#agent-decision-flow).

---

## Environment

Set **`DRIFTGUARD_API_KEY`** once to unlock all hosted tools — no other activation variables required.

| Variable | Purpose |
|----------|---------|
| `DRIFTGUARD_API_KEY` | Primary activation — unlocks hosted tools (`dg_…`) |
| `DRIFTGUARD_API` | **Advanced:** override API base (default `https://driftguard.org`) |
| `DRIFTGUARD_ALLOW_CUSTOM_API` | Set `1` with custom API — prevents hostile configs redirecting tokens |

Hosted tools **fail clearly** with trial and pricing URLs when the key is missing. Do not retry hosted calls without your consent.

Trial: [driftguard.org/start](https://driftguard.org/start) · Pricing: [driftguard.org/pricing](https://driftguard.org/pricing)

---

## MCP client config

```json
{
  "mcpServers": {
    "driftguard": {
      "command": "npx",
      "args": ["-y", "driftguard@0.3.3", "mcp"],
      "env": {
        "DRIFTGUARD_API_KEY": "dg_…"
      }
    }
  }
}
```

Copy-paste from [examples/mcp-client-config.json](../../examples/mcp-client-config.json) — no absolute paths.

Omit `DRIFTGUARD_API_KEY` for fully offline use (`compare_json`, `parse_mcp_config`, `hosted_info`).

Per-client setup: [Integrations — MCP clients](../integrations/mcp-clients.md).

### Cursor rule (consumer repos)

For repos with `mcp.json`, copy [examples/cursor-rule-driftguard.mdc](../../examples/cursor-rule-driftguard.mdc) to `.cursor/rules/`. It scopes to `**/mcp.json` and mirrors this guide's offline-first order plus the npx config and [AGENTS-snippet.md](../../examples/AGENTS-snippet.md).

---

## Next steps

| Goal | Doc |
|------|-----|
| Human onboarding | [Getting started](../getting-started.md) |
| Registry / discovery | [DISCOVERY.md](../DISCOVERY.md) |
| Machine-readable index | [llms.txt](../llms.txt) |
| Contributing to this repo | [AGENTS.md](../../AGENTS.md) |
