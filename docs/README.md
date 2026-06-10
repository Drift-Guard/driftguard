# DriftGuard documentation

Catch API and schema changes before your integrations break. This hub walks you from **try it locally** → **add CI checks** → **free trial** → **paid monitoring**.

**What you need:** Node.js 20+ for the free open-source client. Hosted tools need a [free trial](https://driftguard.org/start) or [Pro/Team API key](https://driftguard.org/pricing).

---

## What DriftGuard does

| Feature | What it does | Where it runs |
|--------|--------------|---------------|
| **Schema comparison** | Compare two JSON payloads and flag breaking vs safe changes | Free CLI + MCP (`compare_json`) |
| **MCP config preview** | List HTTPS URLs from `mcp.json` without signing up | Free (`parse_mcp_config`) |
| **Scheduled checks** | Check an API, OpenAPI spec, or MCP endpoint on a schedule | Hosted Pro/Team |
| **Change history** | See when a watched contract changed and get alerts | Hosted |
| **MCP tool tracking** | Watch remote MCP `tools/list` for catalog changes | Hosted only |
| **Fix suggestions** | Get hints after breaking changes | Public endpoint (`explain_drift`) |
| **CI coverage checks** | Fail pipelines when dependencies are not watched | Hosted (`assert_coverage`) + Actions |

DriftGuard sits **between your contracts and your apps**: `mcp.json`, API payloads, OpenAPI specs, CI pipelines, AI agents, and the hosted console.

```
  mcp.json / OpenAPI / API responses
              │
              ▼
     ┌─────────────────┐
     │  Free client    │  compare_json, parse_mcp_config (offline)
     │  CLI + MCP      │
     └────────┬────────┘
              │ DRIFTGUARD_API_KEY
              ▼
     ┌─────────────────┐
     │  Hosted         │  scheduled checks, change history, alerts
     │  DriftGuard     │
     └────────┬────────┘
              │
              ▼
        CI gates · agents · on-call
```

---

## What's free vs paid

| Capability | Free client (this repo) | Hosted DriftGuard |
|------------|------------------------|-------------------|
| JSON schema diff | ✅ CLI + MCP | ✅ + history |
| Parse `mcp.json` preview | ✅ offline | ✅ + auto-import |
| Scheduled checks | ❌ | ✅ |
| MCP `tools/list` polling | ❌ | ✅ |
| Alerts & console | ❌ | ✅ |
| CI coverage gate | Preview free; gate needs key | ✅ |

Full split: [OPEN_CORE.md](../OPEN_CORE.md). At runtime, MCP tool **`hosted_info`** shows what's free vs paid and upgrade links.

---

## Start here

| Doc | Who it's for | What you'll do |
|-----|--------------|----------------|
| [Getting started](./getting-started.md) | Developers, SREs | Install → diff → MCP → CI → trial |
| [Glossary](./glossary.md) | Everyone | Plain definitions for DriftGuard terms |
| [Reference](./reference/README.md) | Integrators, agents | MCP tools, CLI commands, diff rules |
| [QUICKSTART](./QUICKSTART.md) | Hands-on setup | Copy-paste install and MCP config |

---

## Guides

Step-by-step guides by role — [guides index](./guides/README.md).

| Guide | Who it's for |
|-------|--------------|
| [Developer](./guides/developer.md) | Local diff, pre-commit, `explain_drift` |
| [Agent / MCP](./guides/agent-mcp.md) | Free tools first, `SYSTEM_PROMPT` companion |
| [CI/CD](./guides/ci-cd.md) | Hook → preview → trial → gate |
| [Drift management](./guides/drift-management.md) | Find → review → fix changes (hosted) |
| [Platform admin](./guides/platform-admin.md) | Scheduled checks, API keys, alerts (hosted) |

---

## Integrations

[Integrations catalog](./integrations/README.md) — CI platforms, MCP clients, registry, notifications.

| Integration | Doc |
|-------------|-----|
| GitHub Actions | [integrations/github-actions.md](./integrations/github-actions.md) · [CI.md](./CI.md) |
| GitLab CI | [integrations/gitlab-ci.md](./integrations/gitlab-ci.md) · [GITLAB_CI.md](./GITLAB_CI.md) |
| MCP clients | [integrations/mcp-clients.md](./integrations/mcp-clients.md) |
| MCP Registry | [DISCOVERY.md](./DISCOVERY.md) |
| GitHub Marketplace | [GITHUB_MARKETPLACE.md](./GITHUB_MARKETPLACE.md) |

---

## Policies & gates

[Policies](./policies/README.md) — coverage rules, breaking-change policy, what's free vs paid.

| Topic | Doc |
|-------|-----|
| Gate ladder (MockDrift → SchemaSync) | [policies/gate-ladder.md](./policies/gate-ladder.md) |
| MockDrift assertion v2 | [mockdrift/](./mockdrift/) |
| FuseGuard · ToolChange · SchemaSync | [packages/](../packages/) READMEs |

---

## Migrate & adopt

[Migration paths](./migrate/README.md) — start from zero, manual JSON diff, CI-only, or many MCP servers (with troubleshooting).

---

## Changelog & releases

[Product changelog](./changelog/README.md) — release notes, version numbers, and breaking MCP/diff policy. Maintainer history: [CHANGELOG.md](../CHANGELOG.md) · [GitHub releases](https://github.com/kioie/driftguard/releases).

---

## Hosted reference (link-out)

Exact OpenAPI and console setup live on [driftguard.org](https://driftguard.org) — this hub links to them.

| Doc | Purpose |
|-----|---------|
| [Hosted API](./reference/hosted-api.md) | API route families (watches, drift, CI, agents) |
| [Webhooks & alerts](./reference/webhooks-alerts.md) | Events, channels, retry overview |

---

## For AI agents

| Doc | Use |
|-----|-----|
| [llms.txt](./llms.txt) | Machine-readable sitemap |
| [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md) | Tool matrix, decision flow, env vars |
| [Reference — MCP tools](./reference/README.md#mcp-tools) | Full catalog with when / when-not |
| [Agent / MCP guide](./guides/agent-mcp.md) | Free tools first |
| [AGENTS.md](../AGENTS.md) | Contributing to this repo |

---

## Security & trust

| Doc | Purpose |
|-----|---------|
| [Security overview](./security/README.md) | Data boundaries, free vs paid, trust links |
| [Public repo audit](./security/PUBLIC-REPO-AUDIT.md) | History scrub, proprietary content |
| [DESIGN.md](./DESIGN.md) | Brand / design tokens |

---

## Upgrade path

1. **Try offline** — `compare_json`, `parse_mcp_config` in Cursor or CLI (no signup)
2. **Start trial** — [driftguard.org/start](https://driftguard.org/start) (full Pro on one endpoint)
3. **Add API key** — set `DRIFTGUARD_API_KEY` in MCP env or CI secrets → monitoring tools unlock
4. **Team** — [pricing](https://driftguard.org/pricing) for more watches, audit export, SSO

---

## Roadmap

Public OSS roadmap and documentation phases: [ROADMAP.md](./ROADMAP.md). Hosted product sequencing lives in the private `driftguard-cloud` repository.
