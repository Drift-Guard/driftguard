# R3-1 Session — LangGraph Hook + Decorator Contract

**Date:** June 2026  
**Status:** Decisions frozen → [R3-API.md](./R3-API.md)  
**Attendees:** Founder + eng (Round 3 agenda item 1)

---

## Goal

Freeze MockDrift pytest API and LangGraph integration so Gate 1 implementation can start without rework.

---

## Decision 1: LangGraph hook = two layers (not pick-one)

**Rejected:** proxy-only for LangGraph GA (cannot detect `bubble_to_orchestrator`).  
**Rejected:** checkpointer intercept as v1 (heavy, couples to persistence config).  
**Accepted:** **Layer 1 ToolProxy** + **Layer 2 compile wrap**.

```
┌─────────────────────────────────────────┐
│  Layer 2: wrap_graph(CompiledGraph)     │
│  - superstep / invoke boundaries        │
│  - state snapshot at pre_drift          │
│  - profile detection on invoke result   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Layer 1: ToolProxy (session-scoped)  │
│  - schema validate / drift inject       │
│  - tool trace + loop hash               │
│  - egress guard                         │
└─────────────────────────────────────────┘
```

**Build order (Council + Engineer):** ship Layer 1 + proxy smoke **before** Layer 2 wrap lands.

---

## Decision 2: Tool binding strategy

Tools must hit Layer 1 before real network.

| Tool type | Gate 1 approach |
|---|---|
| `@tool` / `StructuredTool` | Wrap `func` at graph build time via `session.patch_tool(tool)` helper in reference app |
| MCP tools | Route MCP URL to `mockdrift://` proxy base in test env |
| Raw HTTP | `MOCKDRIFT_HTTP_PROXY` env points at session proxy |

Reference app documents **`session.patch_tool`** pattern — we do not monkeypatch LangGraph internals.

---

## Decision 3: `entry` resolution

Format: **`dotted.module.path:symbol`**

| Symbol value | Behavior |
|---|---|
| `CompiledGraph` | wrap |
| `() -> CompiledGraph` | call, wrap |
| `() -> StateGraph` | compile, wrap |

Invalid type → exit 2 `MisconfigurationError`.

Default **inputs** from fixture `inputs.json` if present; else `{}`. Tests override via `@drift_replay(inputs={...})`.

---

## Decision 4: `@drift_replay` decorator contract

### Injection

- Parameter name **`mockdrift_session`** (fixed — not configurable in v1).  
- If test function has **no parameters**, wrapper creates session and calls `run()` automatically.  
- If test has `mockdrift_session`, test **must** call `run()` exactly once (double-call → exit 2).

### Config merge

Decorator kwargs beat toml. Missing `failure_profile` when `assert_profiles=True` → exit 2 at collection time.

### pytest integration

- Implemented as **decorator** (not fixture) to keep scenario metadata on test node.  
- `pytest_plugin` registers markers: `mockdrift`, `skip_mockdrift`.

---

## Failure profile detection (LangGraph)

### `halt_clean`

After drift injection step index `D`:

- Count tool calls with step > `D` → must be **0**
- Graph status: reached `END` (not stuck in interrupt)

### `bubble_to_orchestrator`

After drift injects tool error:

- Tool node must **not** catch-and-return success payload  
- Expected: exception propagates from `invoke()` **OR** graph enters interrupt handled by outer test harness  
- PASS signal in trace: `failure_profile_met.detail` contains exception class name  
- Zero tool calls after error step (same as halt for tools; difference is **error bubbled** not silent)

**Reference pattern (partner doc):**

```python
# Tool node — correct for bubble profile
@tool
def stripe_create_refund(...):
    raise DomainToolError("422", body)  # do not return {"ok": False} without raising

# Graph — orchestrator catches at invoke boundary
try:
    graph.invoke(...)
except DomainToolError:
    ...  # expected path → PASS
```

### `fallback_state`

- Drift injects error; agent transitions state to declared fallback  
- PASS: `state_invariants` match at `post_run` (e.g. `refund.status in [failed, pending_human]`)  
- Tools may run if invariants allow

---

## Decision 5: State checkpoints

| Checkpoint | When captured |
|---|---|
| `pre_drift` | Last state snapshot **before** drift injection step |
| `post_run` | Final state after `invoke()` completes or raises |

Used by `state_invariants` with `checkpoint: pre_drift` rules in assertion v2.

Implementation: copy state dict at wrap boundaries — **not** full checkpointer replay.

---

## Decision 6: Reference app scope (Gate 1)

Ship under `packages/mockdrift/examples/reference_langgraph/`:

| Test | Profile | Layer |
|---|---|---|
| `test_refund_bubbles` | `bubble_to_orchestrator` | L1 + L2 |
| `test_support_halts` | `halt_clean` | L1 + L2 |
| `test_billing_fallback` | `fallback_state` | L1 + L2 |
| `test_refund_proxy_smoke` | n/a (`assert_profiles=False`) | L1 only |

All use fixture `stripe-required-field` variants or sibling fixtures.

---

## Open items → R3-2 / implementation

| Item | Owner track |
|---|---|
| `--simulate-drift` CLI | R3-2 |
| Blurred diff CTA | R3-2 |
| JSON Schema on `state_schema` file | M2 stretch |
| Checkpointer intercept | Post Gate 1 if wrap misses invariants |

---

## Sign-off checklist

- [x] Two-layer hook architecture  
- [x] Decorator signature + injection rules  
- [x] `entry` resolution table  
- [x] Failure profile PASS conditions  
- [x] Build order M1 → M2 → M3  
- [ ] Reference app implemented (Gate 1 M2)  
- [ ] Partner false-FAIL <5% (Gate 1 code freeze)

**R3-1 spec freeze:** ✅ Complete — proceed to M1 implementation.
