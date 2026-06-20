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

## Contract drift gate (CP-3.1)

Before each outbound tool call, FuseGuard can call hosted `POST /api/preflight` when configured:

| Env | Purpose |
|-----|---------|
| `DRIFTGUARD_API_KEY` | Bearer token for hosted preflight |
| `FUSEGUARD_WATCH_IDS` | Comma-separated watch IDs to gate on |
| `FUSEGUARD_AGENT_ID` | Agent binding id/slug (alternative to watch list) |
| `FUSEGUARD_PREFLIGHT_CACHE_TTL_SEC` | In-process cache TTL (default 30) |
| `FUSEGUARD_PREFLIGHT_TIMEOUT_SEC` | HTTP timeout (default 15) |
| `DRIFTGUARD_API` | API base URL (default `https://driftguard.org`) |
| `FUSEGUARD_TRIP_LOG` | Optional JSON trip log path on block |

Blocked preflight trips use trip reason `contract_drift_blocked` with hosted `blocked[].reasons[]` and `agentActions` in trip metadata.

**Reason taxonomy and MGFA pattern:** [runtime contract preflight guide](../../docs/guides/runtime-contract-preflight.md) · hosted API [driftguard.org/docs/api/preflight](https://driftguard.org/docs/api/preflight).

### Example — env + wrap

```bash
export DRIFTGUARD_API_KEY="dg_live_…"
export FUSEGUARD_AGENT_ID="billing-agent"
export FUSEGUARD_TRIP_LOG=".fuseguard/trip.json"
```

```python
from fuseguard import FuseConfig, wrap_agent

class Agent:
    def invoke_tool(self, tool, args):
        ...

wrapped = wrap_agent(Agent(), FuseConfig.from_env())
wrapped.invoke_tool("stripe_refund", {"amount": 100}, estimated_cost_usd=0.02)
```

Runnable sample: [examples/fuseguard/preflight_wrap.py](../../examples/fuseguard/preflight_wrap.py).

On block, `FuseTrip.trip.metadata` includes the full preflight payload. Pair ack-gated unblocks with [webhook ack trail](../../docs/reference/webhooks-alerts.md#incident-acknowledgement-trail) (E11).

## Ingress validate (optional)

Validate **inbound** request bodies before tool execution — complements egress preflight (`contract_drift_blocked`).

| Env | Purpose |
|-----|---------|
| `FUSEGUARD_INGRESS_PROFILE_ID` | Hosted profile registry id |
| `FUSEGUARD_INGRESS_PROFILE_JSON` | Inline consumer profile (alternative to id) |
| `FUSEGUARD_INGRESS_MODE` | `block`, `warn`, or `quarantine` (default `block`) |
| `FUSEGUARD_INGRESS_WEBHOOK_URL` | Quarantine webhook when mode is `quarantine` |
| `FUSEGUARD_INGRESS_PAYLOAD_ARG` | Tool arg key containing payload dict (e.g. `body`) |
| `FUSEGUARD_INGRESS_TIMEOUT_SEC` | HTTP timeout (default 15) |

Blocked ingress trips use reason `ingress_validate_blocked`. Boundary: ingress validates consumer shape; egress preflight gates on upstream contract drift.

Guide: [automation ingress](../../docs/guides/automation-ingress.md).

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

## MGFA — loop and budget controls (separate from contract preflight)

FuseGuard **loop detection** and **budget caps** address runaway or costly agent actions (MGFA Dimension 3 guardrails). This is **orthogonal** to contract preflight (E5) — preflight blocks tool calls when **watches** report open drift; loop/budget fuse stops **repeated or expensive** calls regardless of schema state.

| Control | Trigger | Trip reason (examples) |
|---------|---------|------------------------|
| Loop detect | Same tool+args repeated | `loop_detected` |
| Budget gate | Estimated cost exceeds cap | `budget_exceeded` |
| Preflight (E5) | Open drift on bound watch | `contract_drift_blocked` |

Document all three in runbooks; do not position loop fuse alone as full contract observability. See [gate ladder](../../docs/policies/gate-ladder.md) · [SINGAPORE-MGFA-PRODUCT-FIT.md](../../docs/SINGAPORE-MGFA-PRODUCT-FIT.md).
