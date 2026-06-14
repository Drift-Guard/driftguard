# MockDrift API — R3-1 Frozen

**Status:** Frozen (R3-1 session, June 2026) · **Implemented M2** (Layer 1 + LangGraph wrap)  
**Supersedes:** [R3-API-DRAFT.md](./R3-API-DRAFT.md) (archived reference)  
**Implementation:** `packages/mockdrift/`  
**Spec:** [R3-1-DECISIONS.md](./R3-1-DECISIONS.md)

---

## R3-1 decisions (summary)

| # | Decision |
|---|---|
| 1 | **Two-layer hook:** tool transport proxy (all runners) + LangGraph compile wrap (full assertions) |
| 2 | **`entry` format:** `module.path:symbol` → `CompiledGraph` \| `() -> CompiledGraph` \| `() -> StateGraph` |
| 3 | **`@drift_replay`:** pytest wrapper injects `MockDriftSession`; calls `run()` if test body omits it |
| 4 | **Build order:** proxy + trace (M1) → LangGraph wrap + profiles (M2) |
| 5 | **State checkpoints:** `pre_drift` at injection step; `post_run` at graph terminal |
| 6 | **Profile detection:** see [R3-1-DECISIONS.md § Failure profiles](./R3-1-DECISIONS.md#failure-profile-detection-langgraph) |

---

## Session lifecycle

```
@drift_replay(fixture, runner="langgraph", entry="...")
        │
        ▼
MockDriftSession.from_test_context(request)     # toml + decorator + pytest nodeid
        │
        ▼
session.load_fixture() → ToolProxy + DriftInjector + ScopeLedger
        │
        ├── runner=langgraph
        │        │
        │        ▼
        │   graph = session.resolve_entry(entry)   # import module:symbol
        │   wrapped = session.wrap_graph(graph)      # LangGraph compile wrap
        │        │
        │        ▼
        │   result = session.run(wrapped, inputs=...)  # default inputs from fixture
        │
        └── runner=custom | assert_profiles=False
                 │
                 ▼
            subprocess or entry cmd behind ToolProxy only

        ▼
AssertionEngine.evaluate(result.trace, expect from fixture/toml)
        │
        ├── PASS → pytest ok / exit 0
        ├── FAIL → pytest.fail(criteria detail) / exit 1
        └── misconfig → pytest.fail / exit 2
```

---

## `@drift_replay` decorator contract

### Signature

```python
def drift_replay(
    *,
    fixture: str,
    runner: Literal["langgraph", "custom"] = "langgraph",
    entry: str | None = None,
    failure_profile: FailureProfile | None = None,
    state_schema: str | Path | None = None,
    assert_profiles: bool = True,
    inputs: dict[str, Any] | None = None,
    config: RunnableConfig | None = None,  # LangGraph only; merged with session defaults
) -> Callable: ...
```

### Rules

| Rule | Detail |
|---|---|
| `fixture` | Required. Key in `.mockdrift.toml` `[fixtures.*]` or path alias |
| `entry` | Required when `runner=langgraph`. Optional for `custom` (uses `entry` as shell command) |
| `assert_profiles=False` | Implies `runner=custom` behavior: `schema_valid` + `no_loop_spiral` only |
| `failure_profile` | Required for full assertions unless set on fixture or `[defaults]` |
| Test signature | Must accept `mockdrift_session: MockDriftSession` **or** take no args (auto-run) |
| Assertion failure | Harness calls `pytest.fail()` with criterion detail — test assert optional |
| Skip | `@pytest.mark.skip_mockdrift` → exit 3 |

### Examples

```python
from mockdrift import drift_replay

# Full LangGraph — one-liner body
@drift_replay(fixture="stripe-required-field", entry="agents.billing:refund_graph")
def test_refund_bubbles(mockdrift_session):
    mockdrift_session.run()

# Override profile for this test only
@drift_replay(
    fixture="mcp-tool-removed",
    entry="agents.support:support_graph",
    failure_profile="halt_clean",
)
def test_support_halts(mockdrift_session):
    result = mockdrift_session.run()
    assert result.trace_summary.steps_after_drift == 0

# Proxy smoke — no LangGraph
@drift_replay(
    fixture="stripe-required-field",
    runner="custom",
    entry="python -m agents.billing.run_refund_cli",
    assert_profiles=False,
)
def test_refund_proxy_smoke(mockdrift_session):
    mockdrift_session.run()
```

---

## `MockDriftSession`

```python
class MockDriftSession:
    @classmethod
    def from_test_context(cls, request: pytest.FixtureRequest | None = None) -> MockDriftSession: ...

    @classmethod
    def from_fixture(cls, fixture: str, *, root: Path | None = None) -> MockDriftSession: ...

    def run(
        self,
        graph: CompiledGraph | None = None,
        *,
        inputs: dict[str, Any] | None = None,
        config: RunnableConfig | None = None,
    ) -> MockDriftResult: ...

    def wrap_graph(self, graph: CompiledGraph | StateGraph) -> CompiledGraph: ...

    def resolve_entry(self, entry: str) -> CompiledGraph: ...
```

### `MockDriftResult`

```python
@dataclass(frozen=True)
class MockDriftResult:
    verdict: Literal["PASS", "FAIL"]
    criteria: dict[str, CriterionResult]
    trace_summary: TraceSummary
    scenario_name: str

    def emit_scenario(self) -> str: ...  # YAML for --emit-scenario
    def to_sensor_dict(self, **ctx) -> dict: ...  # mockdrift.sensor/v1 object
    def to_sensor_json(self, **ctx) -> str: ...  # JSON for CI / in-loop agents
```

Pytest: `--mockdrift-sensor-report=path.json` or directory (per-test files). Env: `MOCKDRIFT_SENSOR_JSON`.

---

## LangGraph `wrap_graph` (Layer 2)

Applied **after** `resolve_entry` compiles builders. Does **not** replace tool implementations — tools route through **Layer 1** `ToolProxy` bound on the session.

### Layer 1 — Tool transport proxy (all runners)

- Intercepts: LangChain `StructuredTool`, MCP tool calls, HTTP tools configured in graph  
- Validates args against `before.schema.json` / `after.schema.json` post-drift  
- Injects drift response per fixture (`fixture_error`, `schema_only`)  
- Records `ToolCallRecord` (tool, args hash, error class, step index)  
- Enforces `MOCKDRIFT_MOCK=1` egress block  

### Layer 2 — Compile wrap (LangGraph only)

```python
# mockdrift/langgraph/wrap.py
def wrap_graph(
    graph: CompiledGraph,
    session: MockDriftSession,
) -> CompiledGraph:
    """Return a graph that:
    - snapshots state at pre_drift checkpoint when drift fires
    - records superstep boundaries for step counts
    - surfaces invoke-level exceptions for profile detection
    """
```

**Implementation strategy (frozen):**

1. Wrap graph with LangGraph `with_config` + custom **node adapter** only on nodes that invoke tools — **not** checkpointer intercept (deferred).  
2. Tool nodes already patched at tool-construction time (factory hook) or via `ToolProxy.bind(session)` before compile.  
3. `session.run()` calls `wrapped.invoke(inputs, config)` and captures:
   - raised exception type / `GraphInterrupt`
   - final state dict
   - tool trace from Layer 1

### `entry` resolution

| `symbol` type | Action |
|---|---|
| `CompiledGraph` | wrap directly |
| `Callable[[], CompiledGraph]` | call once, wrap |
| `Callable[[], StateGraph]` | call, `.compile()`, wrap |
| `StateGraph` instance | `.compile()`, wrap |

Import path: standard `importlib.import_module` + `getattr` on `module:symbol` split at last `:`.

---

## Failure profile detection (LangGraph)

| Profile | PASS when |
|---|---|
| `halt_clean` | After drift: **zero** tool calls; graph at `END` within `max_steps_after_drift` |
| `bubble_to_orchestrator` | Tool error **not** swallowed in tool node; `invoke()` raises **or** returns with `GraphInterrupt` / error routed to orchestrator handler; **no** further tools after error; user-facing output not leaked (optional: `forbid_user_leak` in fixture) |
| `fallback_state` | Final state satisfies `state_invariants` (JSON Schema or dot-path rules); may include tools if invariants hold |

**FAIL examples:**

- Same tool retried after 422 → `next_step_valid` / `no_loop_spiral`  
- Error caught and ignored → `bubble_to_orchestrator` FAIL  
- `stripe_capture_payment` called after drift → `forbid_tools_after_drift`  

---

## Config layering

**Precedence:** `@drift_replay` kwargs → `[fixtures.<name>]` → `[defaults]`

```toml
[defaults]
runner = "langgraph"
failure_profile = "bubble_to_orchestrator"
timeout_ms = 120000
mock_egress = true   # MOCKDRIFT_MOCK=1

[fixtures.stripe-required-field]
path = "fixtures/stripe-refund-2026-06-04"
drift_target = "stripe_create_refund"
match = "first_call"
failure_profile = "bubble_to_orchestrator"

[fixtures.stripe-required-field.expect.next_step_valid]
max_steps_after_drift = 2
max_retries_same_tool = 0
forbid_tools_after_drift = ["stripe_capture_payment"]
```

Expect blocks in toml mirror assertion v2 YAML — compiled scenario is export-only.

---

## Variable substitution

See draft — unchanged: `{{mockdrift.uuid}}`, `{{mockdrift.timestamp}}`, `{{mockdrift.ref:field}}`.

---

## pytest plugin

**Entry:** `pytest11` hook `mockdrift = mockdrift.pytest_plugin`

- Registers `@drift_replay` wrapper  
- Adds `--emit-scenario=PATH` (emit on FAIL)  
- Adds `--simulate-drift=WATCH_ID` (Pro; Gate 1 R3-2)  
- Sets `MOCKDRIFT_MOCK=1` unless `MOCKDRIFT_MOCK=0`  

---

## CLI (pytest driver)

```bash
mockdrift demo stripe-required-field
mockdrift run --pytest tests/test_refund.py::test_refund_bubbles
mockdrift run --pytest tests/ --simulate-drift watch_abc   # R3-2
```

---

## Gate 1 implementation phases

| Phase | Ship | Week target |
|---|---|---|
| **M1** | ToolProxy, scope ledger, demo CLI, proxy smoke test, 1 fixture | 1–2 |
| **M2** | `wrap_graph`, 3 failure profiles, `@drift_replay`, stripe reference | 2–4 |
| **M3** | `--emit-scenario`, GitHub Action, false-FAIL tuning | 4–6 |

**Code freeze:** M2 complete + partner false-FAIL <5% on reference app.

---

## Deferred (post R3-1)

- Checkpointer intercept (Option C)  
- Jest wrapper  
- `--simulate-drift` (R3-2)  
- `state_schema` JSON Schema validation (M2 stretch; dot-path invariants required first)  
