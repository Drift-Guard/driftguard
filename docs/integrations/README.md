# Integrations

How DriftGuard connects to CI platforms, MCP clients, registries, and hosted notification channels.

**What's free:** This repo ships client configs and workflow templates. Alert routing and console integrations are hosted — [OPEN_CORE.md](../../OPEN_CORE.md).

---

## CI/CD

| Integration | Summary | Doc |
|-------------|---------|-----|
| **GitHub Actions** | Composite actions: diff hook, coverage preview, assert gate | [github-actions.md](./github-actions.md) |
| **GitLab CI** | Same CLI tiers; job summary parity | [gitlab-ci.md](./gitlab-ci.md) |
| **GitHub Marketplace** | Listing path for published actions | [GITHUB_MARKETPLACE.md](../GITHUB_MARKETPLACE.md) |

CI tiers: [CI.md](../CI.md) · Guide: [CI/CD](../guides/ci-cd.md).

---

## MCP & agents

| Integration | Summary | Doc |
|-------------|---------|-----|
| **MCP clients** | Cursor, Claude Desktop, Windsurf, Zed — stdio config | [mcp-clients.md](./mcp-clients.md) |
| **MCP Registry** | `server.json` publish path, directory listings | [DISCOVERY.md](../DISCOVERY.md) |

Agent tool selection: [Agent / MCP guide](../guides/agent-mcp.md) · [SYSTEM_PROMPT.md](../../SYSTEM_PROMPT.md).

---

## Notifications (hosted)

Set up Slack, email, and webhooks in the **hosted console** — not in this public repo.

| Channel | Free repo | Hosted |
|---------|----------|--------|
| Slack | — | Console integration |
| Email | — | Console notification settings |
| Per-watch webhook | `webhookUrl` on `register_watch` | Delivered by hosted service |

Start monitoring: [driftguard.org/start](https://driftguard.org/start) · [Platform admin guide](../guides/platform-admin.md#alerts-hosted).

---

## Future (P3)

IDP / portal integrations (e.g. Backstage-style watch registration from service catalog) — tracked in [ROADMAP](../ROADMAP.md).

---

## Next steps

| Goal | Doc |
|------|-----|
| First pipeline hook | [Getting started step 5](../getting-started.md#5-optional--add-a-ci-hook) |
| Gate packages in repo | [Gate ladder](../policies/gate-ladder.md) |
| Documentation hub | [docs/README.md](../README.md) |
