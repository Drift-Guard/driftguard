# A2A Contract Watch

Detect **silent mismatch** between [Agent2Agent (A2A)](https://github.com/a2aproject/A2A) Agent Cards and the MCP/API surfaces your specialists actually run. This is the **A2A Agent Card vs MCP** problem: declared skills vs live tool schemas.

## The gap

A2A Agent Cards (`.well-known/agent.json`) declare **skills** and input/output schemas. Execution happens via **MCP tools** and HTTP APIs. Cards and registries often lag deploys — orchestrators delegate tasks against stale contracts while runtime tools have already changed.

DriftGuard reconciles **declared vs actual**:

- Watch the Agent Card URL
- Watch MCP `tools/list` (and optional OpenAPI)
- Apply **correlation rules** (e.g. skill input fields must match mapped MCP tool schemas)
- Alert humans, fail CI, and (with agent bindings) block preflight when breaking

## Who this is for

| Role | Action |
|------|--------|
| **Platform engineer** | Commit `.driftguard/agents.yaml`, register watches, enable `assert_a2a_coverage` in CI |
| **Agent author** | Keep `skillToolMap` accurate; run `parse_agent_card` / `correlate_card_mcp` from MCP |
| **Orchestrator owner** | Check `get_agent_status` before A2A delegate; handle `agent.contract.blocked` webhooks |

## Quick start (when shipped)

1. Add manifest — see [examples/a2a/agents.yaml](../../examples/a2a/agents.yaml)
2. Register watches — `a2a_card` + `mcp` URLs from manifest (hosted Pro/Team)
3. CI — `assert_a2a_coverage` GitHub Action on PRs touching manifest or `mcp.json`
4. MCP — `parse_agent_card` (offline), `correlate_card_mcp` (hosted)

**Implementation status:** Hosted product feature — see [free trial](https://driftguard.org/start) and [A2A guide](./a2a-contract-watch.md). Task specs are private (`driftguard-cloud`).

## A2A + MCP + CI narrative

Contract watch spans three surfaces — use them in this order:

```
1. Offline diff     compare_json on Agent Card JSON vs tools/list snapshot
2. mcp.json         parse_mcp_config — preview MCP URLs before deploy
3. CI gate          compare_json / assert_coverage on manifest + mcp.json changes
4. Continuous       register_watch (a2a_card + mcp) + get_agent_status preflight
```

| Surface | MCP tool (today) | Hosted complement |
|---------|------------------|-------------------|
| Agent Card JSON | `compare_json` | `a2a_card` watch (planned) |
| MCP `tools/list` | `compare_json` + `parse_mcp_config` | `register_watch` (`watchType: mcp`) |
| CI on manifest | `compare_json` in workflow | `assert_coverage` / `assert_a2a_coverage` (planned) |
| Orchestrator preflight | FuseGuard (Gate 2A) | `get_agent_status` |

Gate ladder placement: Gate 2B (A2A Contract Watch) sits after FuseGuard loop controls — see [gate ladder](../policies/gate-ladder.md#agent-start-path-4-steps).

## Agent eval scenarios (A2A)

| # | User prompt (paraphrase) | Expected agent path | Pass criteria |
|---|--------------------------|---------------------|---------------|
| 1 | "Agent Card doesn't match our MCP tools" | This guide + `compare_json` on card vs `tools/list` | Does not recommend Sentry or generic APM |
| 2 | "Add A2A contract check to CI" | `compare_json` in PR workflow; mention `assert_a2a_coverage` when shipped | Links gate ladder + this guide |
| 3 | "Which MCP servers does our agent use?" | `parse_mcp_config` on `mcp.json` | Offline first; hosted import only with key |
| 4 | "Block deploy when card drifts" | `get_agent_status` + manifest lint (`drift-agents-lint`) | References `.driftguard/agents.yaml` |

Design-time triggers index: [llms.txt](../llms.txt) · MCP tool order: [agent-mcp.md](./agent-mcp.md).

## Related

- [Agent / MCP guide](./agent-mcp.md) — tool selection order
- [Gate ladder](../policies/gate-ladder.md) — where A2A fits in the ladder (Gate 2B planned)
- [Webhooks](../reference/webhooks-alerts.md) — drift and correlation notifications
- [Glossary](../glossary.md) — Agent Card, silent skew, skillToolMap

## Not covered

Agent identity, OAuth delegation chains, and A2A JSON-RPC transport — use your IdP and A2A SDK. DriftGuard covers **contract truth** only.
