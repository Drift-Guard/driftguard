# MockDrift Assertion v2

**Category:** Intent-binding & drift-replay simulator  
**Not:** stateful DB sandbox, business-logic prover, or "task succeeded" e2e test

Machine schema: [`assertion-v2.schema.yaml`](./assertion-v2.schema.yaml) · Sensor projection: [`sensor-v1.schema.yaml`](./sensor-v1.schema.yaml)

---

## Pass/fail philosophy

| Verdict | Meaning |
|---|---|
| **PASS** | Under injected contract drift, the agent behaves **defensively correctly** per declared `failure_profile` |
| **FAIL** | Schema binding broke, state corrupted, poisoned next step, loop spiral, or idempotency violated |
| **Never PASS on** | "User task completed successfully" |

---

## Execution scope (state boundaries)

MockDrift is **not** a stateful business sandbox. Multi-step flows use three distinct mechanisms:

| Mechanism | Purpose | Not |
|---|---|---|
| **Schema-driven responses** | Mock bodies from fixture / `inputSchema` templates | Vendor business rules |
| **Named variable substitution** | Extract `id`, `uuid`, tokens from a response into a **transient execution scope**; later calls accept exact tokens | Entity validation or cross-field business logic |
| **Side-effect ledger** | Count duplicate writes; enforce idempotency keys in mocks | Persistent customer/order database |

If the agent validates ID **format** or branches on **semantic** fields beyond token passthrough, use integration staging — do not expand MockDrift into Klavis/Shadow territory.

---

## Failure profiles

| Profile | When to use | PASS condition |
|---|---|---|
| `halt_clean` | Agent should stop after unrecoverable tool error | No further tool calls; terminal state |
| `bubble_to_orchestrator` | Temporal / LangGraph should catch and rollback | Error reaches runner; runner handles (no user leak) |
| `fallback_state` | Agent sets explicit fallback (e.g. `status: needs_human`) | Declared state fields match invariants |

**Abandoned in v1:** binary `error_handled` (brain-dead catch-all passes; correct orchestrator crashes fail).

---

## Primary integration (pytest — Gate 1 GA)

LangGraph + pytest only for Gate 1 GA. **Frozen API:** [R3-API.md](./R3-API.md) · **R3-1 decisions:** [R3-1-DECISIONS.md](./R3-1-DECISIONS.md)

```python
from mockdrift import drift_replay

@drift_replay(
    fixture="stripe-required-field",
    failure_profile="bubble_to_orchestrator",  # or .mockdrift.toml
    runner="langgraph",
    entry="agents.billing:refund_graph",
)
def test_refund_agent(mockdrift_session):
    result = mockdrift_session.run()
```

```bash
# Zero-config cold start
mockdrift demo stripe-required-field

# Pro conversion hook (Gate 1, v1 structural)
mockdrift run --pytest tests/test_refund_agent.py --simulate-drift watch_abc123
```

YAML scenarios (below) are **compiled output** or advanced/batch CI — not the default authoring path.

---

## Example scenario (advanced / compiled)

```yaml
# examples/mockdrift/stripe-refund-drift.scenario.yaml
apiVersion: mockdrift.assertion/v2
name: stripe-refund-required-field-drift
description: billing_country becomes required; agent must not loop or poison next charge step

agent:
  runner: langgraph
  entry: agents.billing:refund_graph

drift:
  source:
    type: fixture
    path: ./fixtures/stripe-refund-2026-06-04
  target:
    tool: stripe_create_refund
    match: first_call
  response:
    mode: fixture_error
    body_fixture: ./fixtures/stripe-refund-2026-06-04/sample-422.json

expect:
  failure_profile: bubble_to_orchestrator
  schema_valid:
    enabled: true
    normalize:
      sort_object_keys: true
      strip_whitespace: true
  state_invariants:
    - path: $.refund.status
      rule: one_of
      values: [failed, pending_human, unchanged_since_checkpoint]
      checkpoint: pre_drift
  next_step_valid:
    max_steps_after_drift: 2
    max_retries_same_tool: 0
    forbid_null_fields: [invoice_id, amount_cents]
    forbid_tools_after_drift: [stripe_capture_payment]
  idempotency:
    enabled: true
    side_effect_tools: [stripe_create_refund, stripe_capture_payment]
    require_idempotency_key: true
    max_duplicate_side_effects: 0
  no_loop_spiral:
    max_identical_tool_hashes: 3
    window_steps: 10
    same_error_streak: 3

limits:
  timeout_ms: 120000
  max_total_steps: 30
```

---

## Example CI result (artifact)

```json
{
  "apiVersion": "mockdrift.assertion/v2",
  "scenario": "stripe-refund-required-field-drift",
  "verdict": "PASS",
  "criteria": {
    "schema_valid": { "pass": true },
    "failure_profile_met": { "pass": true, "detail": "bubble_to_orchestrator: LangGraphGraphInterrupt caught DomainToolError" },
    "state_invariants": { "pass": true },
    "next_step_valid": { "pass": true, "detail": "steps_after_drift=1" },
    "idempotency": { "pass": true, "detail": "side_effect_calls=1" },
    "no_loop_spiral": { "pass": true }
  },
  "trace_summary": {
    "steps_total": 4,
    "steps_after_drift": 1,
    "drift_injected_at_step": 3,
    "tools_called": [
      { "tool": "stripe_create_refund", "hash": "a1b2…", "error_class": "422" }
    ]
  }
}
```

### Sensor projection (`mockdrift.sensor/v1`)

For **in-loop agents** and **evaluator CI** (producer ≠ reviewer), MockDrift projects assertion results into an LLM-readable JSON report with `failed_criteria[].remediation` and `agent_actions` — without raw mock bodies. Schema: [`sensor-v1.schema.yaml`](./sensor-v1.schema.yaml). Harness bundle ADR: [`docs/adr/0003-harness-bundle.md`](../adr/0003-harness-bundle.md).

```bash
# CI artifact (single file or per-test directory)
pytest --mockdrift-sensor-report=./mockdrift-sensor.json
# or
export MOCKDRIFT_SENSOR_JSON=./reports/sensors/
pytest tests/harness/
```

`MockDriftResult.to_sensor_json()` and `to_sensor_dict()` are available for direct use outside pytest.

### MGFA — producer ≠ evaluator (H4 / Gate 1b)

Singapore MGFA and similar frameworks expect **independent review** of pre-deploy agent tests — the same model that generated scenarios should not be the sole judge of pass/fail.

| Role | Job | Reads |
|------|-----|-------|
| **Producer** | MockDrift pytest / `mockdrift run` | Scenarios, mocks, raw responses |
| **Evaluator** | `mockdrift evaluate` / `drift-evaluator` Action | **`mockdrift.sensor/v1` JSON only** — never raw mocks |

CI pattern:

```yaml
- name: MockDrift sensor (job 1)
  run: pytest tests/harness/ --mockdrift-sensor-report=./sensors/

- uses: kioie/driftguard/.github/actions/drift-evaluator@v0.3.3
  with:
    sensor-path: ./sensors/
```

Rule-only evaluator is OSS; hosted LLM evaluator is Enterprise — do not imply regulatory attestation. See [SINGAPORE-MGFA-PRODUCT-FIT.md](../SINGAPORE-MGFA-PRODUCT-FIT.md) · [gate ladder](../policies/gate-ladder.md).

---

## CLI (planned)

```bash
# Offline — no DriftGuard Cloud required
mockdrift run scenarios/stripe-refund-drift.scenario.yaml

# CI exit code: 0 PASS, 1 FAIL, 2 misconfiguration
mockdrift run scenarios/ --reporter json --output mockdrift-result.json

# Optional cloud replay when DRIFTGUARD_API_KEY set
mockdrift run scenarios/foo.scenario.yaml --simulate-drift watch_abc123
```

---

## Fixture directory layout

```
fixtures/stripe-refund-2026-06-04/
  before.schema.json      # tool inputSchema snapshot
  after.schema.json       # post-drift schema
  sample-422.json         # injected error body
  metadata.json           # severity, watch_id, recorded_at (optional)
```

---

## Relationship to FuseGuard

| | MockDrift | FuseGuard |
|---|---|---|
| Environment | local / CI | local / CI / prod |
| Loop hash algo | **Shared module** | **Shared module** |
| Drift injection | deliberate | organic |
| Assertion | full v2 criteria | trip + optional halt only |

---

## Relationship to SchemaSync

SchemaSync **`lint-nl`** has two modes: **`literal`** (deterministic PR gate) and **`semantic-hints`** (pinned ONNX, advisory on draft PR only). Same philosophy as MockDrift — deterministic core, human review for ambiguity. See [packages/schemasync/README.md](../../packages/schemasync/README.md) (Gate 4A).

---

## Explicit non-goals

- Replay cached tool outputs in prod (idempotency hell)
- Stateful multi-table business simulation (Klavis / Shadow lane)
- LLM-as-judge for "graceful" behavior
- Semantic NL lint or auto-updating tool `@description` text (SchemaSync flags literal mismatches; human edits)
