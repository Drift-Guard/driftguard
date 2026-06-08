"""Phase 1B LangGraph tests — MD-L2-001 through MD-L2-008."""

from __future__ import annotations

import os
from pathlib import Path

import pytest
import yaml

from mockdrift import drift_replay
from mockdrift.session import MisconfigurationError, MockDriftSession

EXAMPLE_ROOT = Path(__file__).resolve().parents[1] / "examples" / "reference_langgraph"
os.environ["MOCKDRIFT_ROOT"] = str(EXAMPLE_ROOT)


def _session(*, fixture: str, entry: str, profile: str | None = None) -> MockDriftSession:
    return MockDriftSession(
        fixture=fixture,
        runner="langgraph",
        entry=entry,
        failure_profile=profile,  # type: ignore[arg-type]
        root=EXAMPLE_ROOT,
        inputs={"amount": 100, "currency": "usd", "billing_country": "US"},
    )


def test_md_l2_001_bubble_profile_passes():
    """MD-L2-001: bubble graph + stripe fixture PASS with exception detail."""
    session = _session(
        fixture="stripe-required-field",
        entry="agents.billing.refund_graph:refund_graph",
        profile="bubble_to_orchestrator",
    )
    result = session.run()
    assert result.verdict == "PASS"
    assert result.criteria["failure_profile_met"].pass_
    assert "DriftToolError" in result.criteria["failure_profile_met"].detail


def test_md_l2_002_swallow_error_fails_profile():
    """MD-L2-002: swallowing 422 must FAIL failure_profile_met."""
    session = _session(
        fixture="stripe-required-field",
        entry="agents.billing.bad_graphs:swallow_error_graph",
        profile="bubble_to_orchestrator",
    )
    result = session.run()
    assert result.verdict == "FAIL"
    assert not result.criteria["failure_profile_met"].pass_


def test_md_l2_003_halt_clean_passes():
    """MD-L2-003: halt graph stops with steps_after_drift=0."""
    session = _session(
        fixture="mcp-tool-removed",
        entry="agents.billing.refund_graph:refund_graph",
        profile="halt_clean",
    )
    result = session.run()
    assert result.verdict == "PASS"
    assert result.trace_summary.steps_after_drift == 0


def test_md_l2_004_loop_spiral_fails():
    """MD-L2-004: looping same tool after drift FAILs no_loop_spiral."""
    session = MockDriftSession(
        fixture="loop-spiral",
        runner="langgraph",
        entry="agents.billing.bad_graphs:loop_spiral_graph",
        failure_profile="bubble_to_orchestrator",
        root=Path(__file__).resolve().parents[1],
        inputs={"amount": 100},
    )
    result = session.run()
    assert result.verdict == "FAIL"
    assert not result.criteria["no_loop_spiral"].pass_


def test_md_l2_005_forbidden_tool_after_drift_fails():
    """MD-L2-005: forbidden post-drift tool FAILs next_step_valid."""
    session = _session(
        fixture="stripe-required-field",
        entry="agents.billing.bad_graphs:forbidden_followup_graph",
        profile="bubble_to_orchestrator",
    )
    result = session.run()
    assert result.verdict == "FAIL"
    assert not result.criteria["next_step_valid"].pass_


def test_md_l2_006_fallback_state_passes():
    """MD-L2-006: fallback graph satisfies state_invariants."""
    session = _session(
        fixture="stripe-required-field",
        entry="agents.billing.refund_graph:refund_graph",
        profile="fallback_state",
    )
    result = session.run()
    assert result.verdict == "PASS"
    assert result.criteria.get("state_invariants", result.criteria["failure_profile_met"]).pass_


def test_md_l2_007_invalid_entry_misconfiguration():
    """MD-L2-007: invalid entry symbol exits 2."""
    session = MockDriftSession(
        fixture="stripe-required-field",
        runner="langgraph",
        entry="agents.billing.refund_graph:missing_symbol",
        root=EXAMPLE_ROOT,
    )
    with pytest.raises(MisconfigurationError):
        session.run()


def test_md_l2_008_emit_scenario_yaml_on_fail(tmp_path: Path):
    """MD-L2-008: emit_scenario produces valid assertion v2 YAML on FAIL."""
    session = _session(
        fixture="stripe-required-field",
        entry="agents.billing.bad_graphs:swallow_error_graph",
        profile="bubble_to_orchestrator",
    )
    result = session.run()
    assert result.verdict == "FAIL"
    emitted = result.emit_scenario()
    parsed = yaml.safe_load(emitted)
    assert parsed["apiVersion"] == "mockdrift.assertion/v2"
    assert parsed["verdict"] == "FAIL"
    assert "criteria" in parsed
    out = tmp_path / "scenario.yaml"
    out.write_text(emitted, encoding="utf-8")
    assert out.is_file()


@drift_replay(
    fixture="stripe-required-field",
    entry="agents.billing.refund_graph:refund_graph",
)
def test_md_l2_001_drift_replay_bubble(mockdrift_session: MockDriftSession):
    mockdrift_session.run()
