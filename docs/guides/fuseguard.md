# FuseGuard

Runtime fuse for AI agent tool traffic — loop detection, budgets, policy, and optional schema gates. Works **offline** without an account; connect to [hosted DriftGuard](https://driftguard.org) for fleet policy, activity, and drift preflight.

**Related:** [gate ladder — FuseGuard](../policies/gate-ladder.md) · [runtime contract preflight](./runtime-contract-preflight.md) · [agent output contracts](./agent-output-contracts.md)

## When to use

| Need | Surface |
|------|---------|
| Stop runaway tool loops | `wrap_agent` or local daemon proxy |
| Cap spend per agent run | `FUSEGUARD_BUDGET_CAP_USD` |
| Deny dangerous tools | `fuse.policy.yaml` + `fuseguard policy lint` |
| Block on upstream contract drift | `DRIFTGUARD_API_KEY` + preflight (hosted) |
| Fleet policy + activity | [DriftGuard console](https://driftguard.org/console) — Fuse tab |

## Quick start (offline)

```bash
pip install -e packages/mockdrift -e packages/fuseguard
export FUSEGUARD_TRIP_LOG=.fuseguard/trip.json
```

```python
from fuseguard import FuseConfig, wrap_agent

wrapped = wrap_agent(MyAgent(), FuseConfig.from_env())
wrapped.invoke_tool("search", {"query": "docs"}, estimated_cost_usd=0.01)
```

## Policy bundle (Git)

Copy [examples/fuseguard/fuse.policy.yaml](../../examples/fuseguard/fuse.policy.yaml) and lint in CI:

```bash
fuseguard policy lint .driftguard/fuse.policy.yaml
fuseguard policy simulate --tool delete_file --agent-id billing-agent
```

## Hosted FuseGuard Cloud

Enrollment, device fleet, activity feed, policy publish, and diagnostics require a [DriftGuard API key](https://driftguard.org/start):

```bash
fuseguard device enroll --token <from-console>
fuseguard daemon start
```

See [fuseguard-cloud-quickstart](./fuseguard-cloud-quickstart.md) and [Cursor connect](./fuseguard-cursor-connect.md).

## Package

[packages/fuseguard](../../packages/fuseguard/README.md) — Python 3.10+.
