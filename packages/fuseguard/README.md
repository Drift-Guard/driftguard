# FuseGuard

Loop and budget fuse for AI agents (Gate 1b).

**Gate:** FuseGuard 2A (OSS). Hosted trip ingest is in `driftguard-cloud`. **Shared loop-detect:** `mockdrift.loop_detect`

## Quick start

```bash
cd packages/fuseguard
python3 -m venv .venv && source .venv/bin/activate
pip install -e "../mockdrift" -e ".[dev]"

pytest tests/ -v
```

## Integration (low friction)

| Priority | Method | Surface |
|----------|--------|---------|
| 1 | **MCP / HTTP proxy** | `FuseProxy(handler)` — URL swap |
| 2 | **Runner wrap** | `wrap_agent(runner, config)` at init |
| 3 | Framework middleware | LangGraph / Agents SDK hooks (later) |

Disable fuse: `DRIFTGUARD_FUSE=0`.

## Example — runner wrap

```python
from fuseguard import FuseConfig, wrap_agent

class Agent:
    def invoke_tool(self, tool, args):
        ...

wrapped = wrap_agent(Agent(), FuseConfig(budget_cap_usd=1.0))
wrapped.invoke_tool("stripe_refund", {"amount": 100}, estimated_cost_usd=0.02)
```

## Trip log

On trip, optional JSON log at `FUSEGUARD_TRIP_LOG` (schema: `fuseguard/trip_log.schema.json`).

```bash
fuseguard validate-trip-log .fuseguard/trip.json
```

## Phase 2A status

| ID | Deliverable | Status |
|----|-------------|--------|
| FG-2A-1 | `mockdrift.loop_detect` re-export | Done |
| FG-2A-2 | `wrap_agent` | Done |
| FG-2A-3 | `FuseProxy` | Done |
| FG-2A-4 | Pre-call budget gate | Done |
| FG-2A-5 | Transient HTTP exclusion | Done |
| FG-2A-6 | Trip log schema | Done |

**Next (2B):** Cloud trip ingest + drift correlation (`fuseguard_prod`).
