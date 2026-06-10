# DriftGuard documentation

Catch schema drift before your integrations break. This hub routes you from **offline try** → **CI hooks** → **hosted trial** → **Pro monitoring** without implying full self-host.

**Requirements:** Node.js 20+ for the open-source client. Hosted tools need a [free trial](https://driftguard.org/start) or [Pro/Team API key](https://driftguard.org/pricing).

---

## Concept pillars

| Pillar | What it does | Where it runs |
|--------|--------------|---------------|
| **Structural diff** | Infer JSON schemas from payloads; classify breaking vs additive changes | OSS CLI + MCP (`compare_json`) |
| **MCP config preview** | Discover HTTPS endpoints from `mcp.json` without creating watches | OSS (`parse_mcp_config`) |
| **Watches** | Continuous checks on APIs, OpenAPI, or remote MCP endpoints | Hosted Pro/Team |
| **Drift events** | History and alerts when a watched contract changes | Hosted |
| **MCP tool/schema polling** | Track remote MCP `tools/list` and schema changes | Hosted only |
| **Remediation hints** | Suggested fixes after breaking diffs | Public endpoint (`explain_drift`) |
| **CI coverage gates** | Fail pipelines when dependencies are unwatched | Hosted (`assert_coverage`) + Actions |

DriftGuard sits **between contracts and consumers**: `mcp.json`, API payloads, OpenAPI specs, CI pipelines, AI agents, and the hosted console.

```
  mcp.json / OpenAPI / API responses
              │
              ▼
     ┌─────────────────┐
     │  OSS client     │  compare_json, parse_mcp_config (offline)
     │  CLI + MCP      │
     └────────┬────────┘
              │ DRIFTGUARD_API_KEY
              ▼
     ┌─────────────────┐
     │  Hosted         │  watches, drift events, alerts, console
     │  DriftGuard     │
     └────────┬────────┘
              │
              ▼
        CI gates · agents · on-call
```

---

## OSS vs hosted

| Capability | OSS client (this repo) | Hosted DriftGuard |
|------------|------------------------|-------------------|
| JSON schema diff | ✅ CLI + MCP | ✅ + history |
| Parse `mcp.json` preview | ✅ offline | ✅ + auto-import |
| Continuous checks | ❌ | ✅ cron + queues |
| MCP `tools/list` polling | ❌ | ✅ |
| Alerts & console | ❌ | ✅ |
| CI coverage gate | Preview free; gate needs key | ✅ |

Full boundary: [OPEN_CORE.md](../OPEN_CORE.md). At runtime, MCP tool **`hosted_info`** returns the current matrix and upgrade URLs.

---

## Start here

| Doc | Audience | Purpose |
|-----|----------|---------|
| [Getting started](./getting-started.md) | Developers, SREs | Linear funnel: install → diff → MCP → CI → trial |
| [Glossary](./glossary.md) | Everyone | DriftGuard terms and familiar equivalents |
| [Reference](./reference/README.md) | Integrators, agents | MCP tools, CLI commands, diff semantics |
| [QUICKSTART](./QUICKSTART.md) | Hands-on setup | Copy-paste install and MCP config |

---

## Guides

Task-oriented flows by role — [guides index](./guides/README.md).

| Guide | Audience |
|-------|----------|
| [Developer](./guides/developer.md) | Local diff, pre-commit, `explain_drift` |
| [Agent / MCP](./guides/agent-mcp.md) | Offline-first tools, `SYSTEM_PROMPT` companion |
| [CI/CD](./guides/ci-cd.md) | Hook → preview → trial → gate |
| [Drift management](./guides/drift-management.md) | Detection → triage → fix (hosted) |
| [Platform admin](./guides/platform-admin.md) | Watches, API keys, alerts (hosted) |

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

[Policies](./policies/README.md) — coverage, breaking-change policy, open-core guardrails.

| Topic | Doc |
|-------|-----|
| Gate ladder (MockDrift → SchemaSync) | [policies/gate-ladder.md](./policies/gate-ladder.md) |
| MockDrift assertion v2 | [mockdrift/](./mockdrift/) |
| FuseGuard · ToolChange · SchemaSync | [packages/](../packages/) READMEs |

---

## Migrate & adopt

[Migration paths](./migrate/README.md) — from zero, manual JSON diff, CI-only, mcp.json sprawl (with per-path troubleshooting).

---

## Changelog & releases

[Product changelog](./changelog/README.md) — user-facing release notes, SemVer and breaking MCP/diff policy. Maintainer history: [CHANGELOG.md](../CHANGELOG.md) · [GitHub releases](https://github.com/kioie/driftguard/releases).

---

## Hosted reference (link-out)

Exact OpenAPI and console setup live on [driftguard.org](https://driftguard.org) — OSS hub indexes only.

| Doc | Purpose |
|-----|---------|
| [Hosted API](./reference/hosted-api.md) | Route families (watches, drift, CI, agents) |
| [Webhooks & alerts](./reference/webhooks-alerts.md) | Event concepts, channels, retry overview |

---

## For AI agents

| Doc | Use |
|-----|-----|
| [llms.txt](./llms.txt) | Machine-readable sitemap |
| [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md) | Tool matrix, decision flow, env vars |
| [Reference — MCP tools](./reference/README.md#mcp-tools) | Full catalog with when / when-not |
| [Agent / MCP guide](./guides/agent-mcp.md) | Offline-first order |
| [AGENTS.md](../AGENTS.md) | Contributing to this repo |

---

## Security & trust

| Doc | Purpose |
|-----|---------|
| [Security overview](./security/README.md) | Data boundaries, OSS vs hosted, trust links |
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
