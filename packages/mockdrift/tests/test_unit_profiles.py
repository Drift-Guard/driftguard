from __future__ import annotations

from mockdrift.errors import DriftToolError
from mockdrift.langgraph.profiles import (
    LangGraphRunContext,
    evaluate_failure_profile,
    evaluate_state_invariants,
)
from mockdrift.proxy import ToolCallRecord, ToolTrace


def _trace(*, drift_step: int | None = None, after: int = 0) -> ToolTrace:
    trace = ToolTrace(drift_step=drift_step)
    if drift_step is not None:
        trace.records.append(
            ToolCallRecord(
                step=drift_step,
                tool="stripe_create_refund",
                args={},
                args_hash="h1",
                drift_injected=True,
                error_class="422",
            )
        )
    for i in range(after):
        trace.records.append(
            ToolCallRecord(
                step=(drift_step or 0) + i + 1,
                tool="other",
                args={},
                args_hash=f"h{i}",
            )
        )
    return trace


def test_halt_clean_passes_with_zero_post_drift_steps():
    ctx = LangGraphRunContext(trace=_trace(drift_step=1), profile="halt_clean")
    result = evaluate_failure_profile(ctx)
    assert result.pass_ is True


def test_halt_clean_fails_when_tools_continue_after_drift():
    ctx = LangGraphRunContext(trace=_trace(drift_step=1, after=1), profile="halt_clean")
    result = evaluate_failure_profile(ctx)
    assert result.pass_ is False


def test_bubble_passes_when_drift_error_bubbles():
    ctx = LangGraphRunContext(
        trace=_trace(drift_step=1),
        profile="bubble_to_orchestrator",
        invoke_error=DriftToolError("422", {"status": "422"}),
    )
    result = evaluate_failure_profile(ctx)
    assert result.pass_ is True
    assert "DriftToolError" in result.detail


def test_bubble_fails_when_error_swallowed():
    ctx = LangGraphRunContext(trace=_trace(drift_step=1), profile="bubble_to_orchestrator")
    result = evaluate_failure_profile(ctx)
    assert result.pass_ is False


def test_state_invariants_one_of_rule():
    ok = evaluate_state_invariants(
        {"refund": {"status": "pending_human"}},
        {},
        invariants=[{"path": "refund.status", "rule": "one_of", "values": ["pending_human"]}],
    )
    assert ok.pass_ is True
    bad = evaluate_state_invariants(
        {"refund": {"status": "ok"}},
        {},
        invariants=[{"path": "refund.status", "rule": "one_of", "values": ["pending_human"]}],
    )
    assert bad.pass_ is False
