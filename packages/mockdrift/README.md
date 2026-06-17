# MockDrift

Gate 1 local drift-replay harness for AI agents.

**Spec:** [docs/mockdrift/R3-API.md](../../docs/mockdrift/R3-API.md) · **MGFA replay guide:** [docs/guides/mockdrift-cloud-replay.md](../../docs/guides/mockdrift-cloud-replay.md) · **Phase:** 1C (M3 — cloud replay + GitHub Action)

## Quick start

```bash
cd packages/mockdrift
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

mockdrift demo stripe-required-field
mockdrift run --pytest tests/ -v
pytest tests/ examples/reference_langgraph/tests/ -v
```

### Cloud replay (Pro / `mockdrift_cloud`)

```bash
export DRIFTGUARD_API_KEY=dg_live_...
mockdrift run --pytest tests/test_layer1.py --simulate-drift watch_abc123 --cache-fixture
# or: pytest --simulate-drift watch_abc123 tests/...
```

Use `@drift_replay(fixture="simulate-drift", ...)` when the cloud fixture was materialized under `.mockdrift/cache/`.

Full workflow (incident → replay → PR gate): [mockdrift-cloud-replay guide](../../docs/guides/mockdrift-cloud-replay.md).

Disable CI telemetry: `MOCKDRIFT_TELEMETRY=0`.

## Shipped

| Phase | Modules | Tests |
|-------|---------|-------|
| **M1** | ToolProxy, scope, ledger, loop_detect, `demo` CLI | MD-L1-001 … MD-L1-010 |
| **M2** | `wrap_graph`, `profiles.py`, reference LangGraph agents | MD-L2-001 … MD-L2-008 + 3 profile reference tests |
| **M3** | `cloud_client`, `cache`, `telemetry`, `run --simulate-drift`, GitHub Action | MD-C-001 … MD-C-005 |

**Reference app:** `examples/reference_langgraph/agents/billing/refund_graph.py` — `bubble_to_orchestrator`, `halt_clean`, `fallback_state`.

**CI:** `.github/actions/mockdrift` — composite action for pytest + optional `--simulate-drift`.
