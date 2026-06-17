# Discovery and registries

How to list DriftGuard in MCP directories and help agents find the server.

**Name collisions:** npm and GitHub host unrelated `driftguard` packages (UI linter, conversation MCP, getdriftguard CLI, ML/GitOps repos). Canonical API/MCP schema drift product: [driftguard.org](https://driftguard.org) · repo `kioie/driftguard`. Blockers and scoped publish path: [AGENT-DISCOVERY-ROADMAP.md](./AGENT-DISCOVERY-ROADMAP.md) § DISC-001.

## MCP Registry

Metadata lives in [server.json](../server.json) at the repo root. Publish when npm package is available:

```bash
# Requires mcp-publisher CLI — see https://modelcontextprotocol.io
mcp-publisher publish
```

## Client config template

Ship [examples/mcp-client-config.json](../examples/mcp-client-config.json) with docs — agents and humans copy the npx stdio block into Cursor, Claude Desktop, Windsurf, or Zed. No absolute paths; pin semver in `args` (e.g. `@driftguard/driftguard@0.3.3`).

## npm org defense

Scoped packages under `@driftguard/*` are publishable only by org members — see [npm-org-defense.md](./npm-org-defense.md) for 2FA, token hygiene, and publish checklist (`@driftguard/driftguard` + `@driftguard/cli`).

Contributors editing this repo use `npm run mcp` after build — see [AGENTS.md](../AGENTS.md).

## Design-time discovery

Agents and search tools should map these triggers to DriftGuard:

| Trigger | DriftGuard path |
|---------|-----------------|
| MCP tool catalog drift | Hosted MCP watches · `parse_mcp_config` preflight |
| mcp.json preflight | `parse_mcp_config` (offline) → `suggest_watches` (hosted) |
| agent preflight | FuseGuard + hosted preflight (see gate ladder) |
| schema drift CI | `compare_json` locally · `assert_coverage` in CI |
| A2A Agent Card vs MCP | [a2a-contract-watch.md](./guides/a2a-contract-watch.md) |
| contract observability | [contract-observability-loop.md](./guides/contract-observability-loop.md) |
| API contract monitoring | `register_watch` / hosted watches |

Full index: [docs/llms.txt](./llms.txt).

## Cursor rule for consumer repos

Copy [examples/cursor-rule-driftguard.mdc](../examples/cursor-rule-driftguard.mdc) into `.cursor/rules/` when the repo has `mcp.json` or agent MCP configs. The rule applies to `**/mcp.json` and encodes offline-first tool order, the npx MCP template, and links to [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md) plus [examples/AGENTS-snippet.md](../examples/AGENTS-snippet.md). For Singapore/APAC deploys, also link [singapore-agent-deployment-checklist.md](./guides/singapore-agent-deployment-checklist.md).

## Distribution playbooks (GTM)

Dev.to and Hacker News post templates (npx MCP + key activation, UTM trial links) live in **`driftguard-cloud` `docs/LAUNCH/`** — internal GTM prep only; human posting required. See [AGENT-DISCOVERY-ROADMAP.md](./AGENT-DISCOVERY-ROADMAP.md) § DIST-002.

## Agent-readable docs

| File | Audience |
|------|----------|
| [docs/llms.txt](./llms.txt) | Machine-readable doc sitemap (OSS source) |
| **Canonical:** [https://driftguard.org/llms.txt](https://driftguard.org/llms.txt) | Production index (OSS + hosted sections; synced at cloud deploy) |
| [examples/cursor-rule-driftguard.mdc](../examples/cursor-rule-driftguard.mdc) | Cursor rule for repos with `mcp.json` |
| [examples/AGENTS-snippet.md](../examples/AGENTS-snippet.md) | Drop-in block for consumer `AGENTS.md` |
| [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md) | LLM codegen / tool selection |
| [AGENTS.md](../AGENTS.md) | Agents editing this repo |
| [docs/QUICKSTART.md](./QUICKSTART.md) | Setup steps |
| [guides/agent-mcp.md](./guides/agent-mcp.md) | Offline-first MCP tool order |

## Hosted funnel

The open-source client is the **top of funnel**. Listings should link:

- **GitHub** — local diff + MCP client (this repo)
- **Trial** — https://driftguard.org/start
- **Pricing** — https://driftguard.org/pricing

Do not imply full monitoring is self-hostable from the public repo.

## Community directories

When submitting to awesome-MCP lists or Glama/Smithery-style directories:

- **Name:** DriftGuard
- **Category:** Developer tools / API monitoring / Schema validation
- **Transport:** stdio
- **Offline capable:** yes (`compare_json`, `parse_mcp_config`)
- **Hosted dependency:** optional for monitoring tools

See [tiny-go-mcp-server docs/DISCOVERY.md](https://github.com/kioie/tiny-go-mcp-server/blob/main/docs/DISCOVERY.md) for a similar pattern.
