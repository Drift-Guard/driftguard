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

## Related

- [Agent / MCP guide](./agent-mcp.md) — tool selection order
- [Gate ladder](../policies/gate-ladder.md) — where A2A fits in the ladder (Gate 2B planned)
- [Webhooks](../reference/webhooks-alerts.md) — drift and correlation notifications
- [Glossary](../glossary.md) — Agent Card, silent skew, skillToolMap

## Not covered

Agent identity, OAuth delegation chains, and A2A JSON-RPC transport — use your IdP and A2A SDK. DriftGuard covers **contract truth** only.
