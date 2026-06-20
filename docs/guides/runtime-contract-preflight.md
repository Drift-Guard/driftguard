# Runtime contract preflight (FuseGuard + hosted)

**Status:** OSS + hosted. Not MGFA certification or legal advice.

**Related:** [packages/fuseguard](../../packages/fuseguard/README.md) · [preflight guide on driftguard.org](https://driftguard.org/docs/guides/preflight) · [webhooks — ack trail](../reference/webhooks-alerts.md#incident-acknowledgement-trail)

Block **irreversible or high-impact tool calls** when upstream contracts have open breaking drift — before the HTTP/MCP request leaves your agent, not after a failed response.

---

## MGFA pattern — block before irreversible tool call

Singapore [MGFA](https://www.imda.gov.sg/-/media/imda/files/about/emerging-tech-and-research/artificial-intelligence/mgf-for-agentic-ai.pdf) Dimension 3 expects guardrails **before and during** agent action. DriftGuard's runtime lane is narrow:

| What we block | What we do not block |
|---------------|----------------------|
| Outbound tool/API calls when a **bound watch** reports open breaking drift | Prompt injection, intent drift, behavioural anomalies |
| Runs when drift policy enforces `block_new_runs` / `kill_in_flight` | HITL approval queues or override UX |
| Calls gated by FuseGuard `wrap_agent` / `FuseProxy` with preflight configured | Every network call unless you wire the fuse |

**Evidence pairing:** Preflight **blocks** unsafe calls; [webhook ack trail](../reference/webhooks-alerts.md#incident-acknowledgement-trail) records **human review** before ack-gated agents resume. Together they support an oversight narrative — not standalone MGFA compliance.

```
  watch detects drift → webhook (incident.open) → agent blocked at preflight
                              ↓
                    human acknowledges incident
                              ↓
                    preflight allowed → tool call proceeds
```

---

## Architecture

```
  Agent runner                FuseGuard (OSS)              Hosted DriftGuard
  ───────────                 ───────────────              ───────────────────
  invoke_tool()  ──►  assert_contract_drift_clear()
                           │
                           └── POST /api/preflight  ──►  watch status + policy
                                    ▲
                           cache TTL (in-process)
```

| Layer | Responsibility |
|-------|----------------|
| **Hosted `POST /api/preflight`** | Authoritative watch drift status, policy enforcement, `agentActions` remediation hints |
| **FuseGuard `DriftPreflightGate`** | HTTP client, in-process TTL cache, trip on block |
| **Trip log** | Local JSON at `FUSEGUARD_TRIP_LOG` with `contract_drift_blocked` + full preflight payload |

Preflight requires Pro watches (or agent binding with org API key). OSS loop/budget fuse works without a key — see [FuseGuard loop/budget](../../packages/fuseguard/README.md).

---

## Reason taxonomy

### FuseGuard trip reason (client)

When preflight returns `allowed: false`, FuseGuard raises `FuseTrip` with a single trip reason:

| Trip `reason` | Meaning |
|---------------|---------|
| `contract_drift_blocked` | Hosted preflight blocked at least one watch — tool call not executed |

Detailed causes live in trip `metadata.preflight` and `metadata.blocked[]` (mirrors API response). Other trip reasons (`loop_detected`, `budget_exceeded`) are orthogonal — [FuseGuard README](../../packages/fuseguard/README.md).

### Hosted preflight `blocked[].reasons[]`

Each blocked watch includes a `reasons` array. Values are stable for automation and runbooks:

| `reasons[]` token | `driftStatus` | Operator meaning |
|-------------------|---------------|------------------|
| `breaking_drift` | `drifted` | Open breaking changes vs baseline — unsafe to call dependent tools |
| `check_failed` | `error` | Last scheduled/manual check failed (no successful diff) |
| `check_failed:{detail}` | `error` | Same as above; `{detail}` is a short hosted error label |
| `never_checked` | `never_run` | Watch registered but never completed a check |
| `disabled` | `disabled` | Watch paused in console |
| `policy_block:block_new_runs` | `drifted` | Drift policy enforces block on new agent runs (HTTP **409**) |
| `policy_block:kill_in_flight` | `drifted` | Drift policy enforces kill-in-flight (HTTP **409**) |

When `policyBlocked: true`, treat the block as **enforcing** — retrying without remediation will not help.

### `agentActions[]` (remediation hints)

Preflight and trip metadata include `agentActions` — human-readable hints from structural diff classification (e.g. update client schema, acknowledge incident). They are **guidance**, not executable commands. For ack-gated policies, expect hints that reference `acknowledge_drift` / console ack.

Use offline `explain_drift` on local `compare_json` output when prototyping hints without a watch.

---

## Configuration

| Env | Required | Purpose |
|-----|----------|---------|
| `DRIFTGUARD_API_KEY` | Yes (preflight) | Bearer token for `POST /api/preflight` |
| `FUSEGUARD_WATCH_IDS` | One of watch list or agent | Comma-separated watch UUIDs |
| `FUSEGUARD_AGENT_ID` | One of watch list or agent | Agent slug from `agents.yaml` / console binding |
| `FUSEGUARD_PREFLIGHT_CACHE_TTL_SEC` | No (default 30) | In-process cache; lower when testing ack unblock |
| `FUSEGUARD_PREFLIGHT_TIMEOUT_SEC` | No (default 15) | HTTP timeout |
| `DRIFTGUARD_API` | No | API base (default `https://driftguard.org`) |
| `FUSEGUARD_TRIP_LOG` | No | Path for JSON trip log on block |
| `DRIFTGUARD_FUSE` | No | Set `0` to disable all fuse checks |

Disable only preflight: omit API key and watch/agent ids; loop and budget gates still apply when configured.

---

## Example — runner wrap

```python
import os
from fuseguard import FuseConfig, wrap_agent

os.environ["DRIFTGUARD_API_KEY"] = "dg_live_…"
os.environ["FUSEGUARD_AGENT_ID"] = "billing-agent"
os.environ["FUSEGUARD_TRIP_LOG"] = ".fuseguard/trip.json"

class BillingAgent:
    def invoke_tool(self, tool: str, args: dict):
        # irreversible tools: refunds, writes, deletes
        ...

agent = wrap_agent(BillingAgent(), FuseConfig.from_env())
agent.invoke_tool("stripe_refund", {"amount": 100}, estimated_cost_usd=0.02)
```

Full runnable sample: [examples/fuseguard/preflight_wrap.py](../../examples/fuseguard/preflight_wrap.py).

On block, catch `FuseTrip` and inspect `trip.metadata["blocked"]` for `reasons` and `agentActions`. Route trip JSON to your SIEM; pair with [drift export](../reference/hosted-api.md#drift-history-and-audit-team) and ack webhooks for audits.

---

## Direct API (without FuseGuard)

Orchestrators can call preflight directly before a run:

```bash
curl -s https://driftguard.org/api/preflight \
  -H "Authorization: Bearer $DRIFTGUARD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"watchIds":["550e8400-e29b-41d4-a716-446655440000"]}'
```

MCP equivalents: `get_watch_status`, `get_agent_status`. Authoritative hosted docs: [driftguard.org/docs/api/preflight](https://driftguard.org/docs/api/preflight).

---

## Singapore checklist hook

Add runtime preflight for production agents that call financial, identity, or delete APIs — see [singapore-agent-deployment-checklist.md](./singapore-agent-deployment-checklist.md#runtime-contract-preflight-hosted--fuseguard).

---

## Limits and gaps

| Topic | Status |
|-------|--------|
| HITL approval UI | **Out of scope** — partner territory; we supply block + ack evidence |
| Trip ↔ drift correlation in console | Hosted roadmap — trip log is local until ingest ships |
| Cache staleness | Default 30s TTL; call `DriftPreflightGate.clear_cache()` after ack in long-lived processes |
| MGFA certification | DriftGuard does not certify compliance |

**See also:** [FuseGuard loop/budget controls](../../packages/fuseguard/README.md) (separate from preflight). A2A Contract Watch and hosted trip ingest are hosted complements — [a2a-contract-watch](./a2a-contract-watch.md).
