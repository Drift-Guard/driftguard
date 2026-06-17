# Changelog & release notes

Release notes for the **free client** and its MCP/CLI surface. For maintainer-oriented history see [CHANGELOG.md](../../CHANGELOG.md) in the repo root.

**Hosted monitoring** (watches, alerts, console) is a separate service — product changes there are announced on [driftguard.org](https://driftguard.org) and GitHub releases when they affect the free client.

---

## How we version

| Surface | Scheme | Pin in CI |
|---------|--------|-----------|
| npm package + MCP server | [SemVer](https://semver.org/) | `npx @driftguard/driftguard@0.3.3`, Action `@v0.3.3` |
| MCP tool names & inputs | Stable within minor; breaking renames rare | See policy below |
| Diff rules (`@driftguard/diff-core`) | Contract vectors in repo | Rule changes ship with minor bump + changelog callout |

Full tag history: [GitHub releases](https://github.com/kioie/driftguard/releases).

---

## Breaking change policy

We treat these as **breaking** for integrators and agents:

| Change type | Policy |
|-------------|--------|
| **MCP tool removed or renamed** | Minor version bump minimum; noted here and in [CHANGELOG.md](../../CHANGELOG.md) |
| **Required MCP input added** | Breaking for strict clients — documented in release notes |
| **CLI exit-code behavior** | Breaking — e.g. `diff` exit 1 on `breakingCount > 0` is stable |
| **Diff classification** | Breaking when a change moves between breaking / additive / info — golden vectors updated in `packages/diff-core/contract/` |

**Non-breaking:** new optional MCP fields, new offline tools, new hosted proxy tools (gated by API key), additive CLI commands.

Hosted REST routes are **not** versioned in this repo — see [Hosted API](../reference/hosted-api.md).

---

## Recent releases (free client)

Summaries from [CHANGELOG.md](../../CHANGELOG.md). Patch lines omitted unless user-visible.

### 0.3.x — CI tiers & MCP agent surface

| Version | Highlights |
|---------|------------|
| **0.3.3** | Auto trial session in coverage-preview Step Summary; console **Import from CI**; `/ci/setup` deep link |
| **0.3.2** | Free `coverage-preview` + paid/trial `assert-coverage` gate; CI tier docs ([CI.md](../CI.md)) |
| **0.3.1** | GitHub Actions (`setup-driftguard`, `drift-diff`, `drift-coverage`); CLI `assert-coverage`, `version` |
| **0.3.0** | MCP server (`compare_json`, `parse_mcp_config`, `hosted_info`); `AGENTS.md`, `SYSTEM_PROMPT.md`, registry metadata |

### 0.2.x — Foundation

| Version | Highlights |
|---------|------------|
| **0.2.0** | Local JSON schema diff CLI; MCP `compare_json` + hosted tool proxies; breaking / warning / info classification |

### Unreleased

See [CHANGELOG.md — Unreleased](https://github.com/kioie/driftguard/blob/main/CHANGELOG.md#unreleased) for in-flight free client changes (e.g. GitLab CI parity, `scan-paths` on coverage actions).

---

## What to watch

| Audience | Subscribe to |
|----------|--------------|
| **CI embedders** | GitHub releases + pin bumps in [CI.md](../CI.md) |
| **MCP / agent authors** | This page + [reference/MCP tools](../reference/README.md#mcp-tools) + [llms.txt](../llms.txt) |
| **Security reviewers** | [security/](../security/) + release notes for client-only changes |
| **Hosted customers** | [driftguard.org](https://driftguard.org) status and console announcements |

---

## Related

| Doc | Purpose |
|-----|---------|
| [CHANGELOG.md](../../CHANGELOG.md) | Developer/maintainer changelog (Keep a Changelog) |
| [ROADMAP.md](../ROADMAP.md) | OSS documentation phases and product boundaries |
| [OPEN_CORE.md](../../OPEN_CORE.md) | What ships in this repo vs hosted |
