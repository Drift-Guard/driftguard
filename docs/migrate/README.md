# Migrate & adopt

Adoption paths for teams at different maturity levels. Each path links to the minimal doc set — no duplicate runbooks.

**Start here if unsure:** [Getting started](../getting-started.md).

---

## From zero

New to contract drift detection.

| Step | Action | Doc |
|------|--------|-----|
| 1 | Install OSS client | [Getting started §1](../getting-started.md#1-install-the-oss-client) |
| 2 | First diff | [Getting started §2](../getting-started.md#2-run-your-first-diff) |
| 3 | MCP in IDE | [Getting started §3](../getting-started.md#3-connect-an-mcp-client) |
| 4 | Optional CI hook | [CI/CD guide](../guides/ci-cd.md) |
| 5 | Optional hosted | [trial](https://driftguard.org/start) |

**Troubleshooting**

| Issue | Fix |
|-------|-----|
| `npm run build` fails | Node 20+; run `npm ci` first |
| MCP tools missing | Restart client; verify absolute path to `dist/mcp/server.js` |
| Exit code 1 on diff | Expected when breaking — inspect `changes` or call `explain_drift` |

---

## From manual JSON diff

Already comparing snapshots by hand or with generic diff tools.

| Step | Action | Doc |
|------|--------|-----|
| 1 | Pin baselines as JSON files in repo | [Developer guide](../guides/developer.md) |
| 2 | Replace ad-hoc compare with `driftguard diff` | [Reference — CLI](../reference/README.md#cli) |
| 3 | Classify breaking vs additive | [Glossary](../glossary.md) |
| 4 | Wire pre-commit or CI hook | [CI.md — hook](../CI.md#layer-1--hook-free) |
| 5 | Add watches for prod APIs | [Platform admin](../guides/platform-admin.md) |

**Troubleshooting**

| Issue | Fix |
|-------|-----|
| Too many false positives | Review diff semantics; optional fields vs required |
| Large payloads | Diff infers schema shape — trim to representative samples |
| Need remediation text | `explain_drift` after breaking `compare_json` |

---

## From CI-only checks

Pipeline already fails on schema changes; no MCP or hosted watches.

| Step | Action | Doc |
|------|--------|-----|
| 1 | Keep hook tier (`drift-diff`) | [CI/CD guide](../guides/ci-cd.md) |
| 2 | Add non-blocking preview | [CI.md — preview](../CI.md#layer-2--preview-free-hooks-upgrade) |
| 3 | Start trial for one endpoint | [driftguard.org/start](https://driftguard.org/start) |
| 4 | Enable gate when ready | `drift-coverage` + API key |
| 5 | Connect IDE agent | [Agent / MCP guide](../guides/agent-mcp.md) |

**Troubleshooting**

| Issue | Fix |
|-------|-----|
| Preview shows 0 endpoints | Set `scan-paths` to your `mcp.json` and OpenAPI paths |
| Gate fails on trial | Trial allows **one** watch — upgrade for multi-dep repos |
| Missing `DRIFTGUARD_API_KEY` | Hosted tools fail by design — add secret or stay on hook tier |

---

## From mcp.json sprawl

Many MCP servers configured; unclear what is monitored.

| Step | Action | Doc |
|------|--------|-----|
| 1 | Offline preview | `parse_mcp_config` — [Getting started §4](../getting-started.md#4-preview-mcp-dependencies-offline) |
| 2 | CI preview scan | `drift-coverage-preview` with `scan-paths` |
| 3 | Import with catalog | `suggest_watches` (hosted + key) |
| 4 | Enforce coverage | `assert_coverage` / `drift-coverage` |
| 5 | Gate packages for tools | [Gate ladder](../policies/gate-ladder.md) |

**Troubleshooting**

| Issue | Fix |
|-------|-----|
| Stdio servers not listed | No HTTPS URL — need hosted MCP polling |
| Duplicate watch candidates | Deduplicate in console; narrow `scan-paths` |
| Rate limits on import | Batch `suggest_watches`; check plan limits on [pricing](https://driftguard.org/pricing) |

---

## Next steps

| Goal | Doc |
|------|-----|
| Drift triage | [Drift management](../guides/drift-management.md) |
| Integrations | [Integrations](../integrations/README.md) |
| Agent sitemap | [llms.txt](../llms.txt) |
| Hub | [docs/README.md](../README.md) |
