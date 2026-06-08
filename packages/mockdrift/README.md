# MockDrift

Gate 1 local drift-replay harness for AI agents.

**Spec:** [docs/mockdrift/R3-API.md](../../docs/mockdrift/R3-API.md) · **Phase:** 1B (M2 — LangGraph wrap + failure profiles)

## Quick start

```bash
cd packages/mockdrift
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

mockdrift demo stripe-required-field
pytest tests/ examples/reference_langgraph/tests/ -v
```

## Shipped

| Phase | Modules | Tests |
|-------|---------|-------|
| **M1** | ToolProxy, scope, ledger, loop_detect, `demo` CLI | MD-L1-001 … MD-L1-010 |
| **M2** | `wrap_graph`, `profiles.py`, reference LangGraph agents | MD-L2-001 … MD-L2-008 + 3 profile reference tests |

**Reference app:** `examples/reference_langgraph/agents/billing/refund_graph.py` — `bubble_to_orchestrator`, `halt_clean`, `fallback_state`.

**Next (M3):** GitHub Action, `--simulate-drift`, cloud replay API.
