from __future__ import annotations

import json
from pathlib import Path

from mockdrift.assertion.engine import AssertionEngine
from mockdrift.config import load_config, resolve_fixture_config
from mockdrift.fixture import load_fixture
from mockdrift.proxy import ToolCallRecord, ToolTrace
from mockdrift.sensor import project_sensor
from mockdrift.session import CriterionResult, MockDriftResult


def _loaded(pkg_root: Path, name: str):
    config = load_config(pkg_root)
    return load_fixture(resolve_fixture_config(config, name), defaults=config.defaults)


def _fail_result(
    *,
    scenario_name: str,
    criteria: dict[str, CriterionResult],
    trace: ToolTrace,
) -> MockDriftResult:
    return MockDriftResult(
        verdict="FAIL",
        criteria=criteria,
        trace_summary=trace.summary(),
        scenario_name=scenario_name,
    )


def test_sensor_fail_bubble_profile_matches_schema_example():
    trace = ToolTrace()
    trace.drift_step = 1
    for step, tool in enumerate(
        [
            "stripe_create_refund",
            "stripe_create_refund",
            "stripe_confirm_refund",
            "stripe_confirm_refund",
        ]
    ):
        trace.records.append(
            ToolCallRecord(
                step=step,
                tool=tool,
                args={},
                args_hash=f"h{step}",
                error_class="422" if step == 1 else None,
                drift_injected=step == 1,
            )
        )

    result = _fail_result(
        scenario_name="stripe/required-field",
        criteria={
            "schema_valid": CriterionResult(True),
            "failure_profile_met": CriterionResult(
                False, "bubble_to_orchestrator: steps_after_drift=2"
            ),
            "no_loop_spiral": CriterionResult(True),
            "next_step_valid": CriterionResult(False, "steps_after_drift=2"),
        },
        trace=trace,
    )

    sensor = project_sensor(
        result,
        scenario_id="stripe/required-field",
        failure_profile="bubble_to_orchestrator",
        runner="langgraph",
        entry="agents.billing:refund_graph",
        fixture_ref="stripe/required-field@1.0.0",
        harness_bundle=".driftguard/",
    )

    assert sensor["apiVersion"] == "mockdrift.sensor/v1"
    assert sensor["verdict"] == "FAIL"
    assert sensor["scenario"]["failure_profile"] == "bubble_to_orchestrator"
    assert sensor["trace"]["steps_after_drift"] == 2
    assert sensor["trace"]["last_tool"] == "stripe_confirm_refund"
    assert sensor["failure"]["code"] == "WRONG_FAILURE_PROFILE"
    assert len(sensor["failed_criteria"]) == 2
    assert len(sensor["agent_actions"]) >= 1
    assert sensor["links"]["fixture"] == "stripe/required-field@1.0.0"


def test_sensor_pass_halt_clean():
    trace = ToolTrace()
    trace.drift_step = 1
    for step, tool in enumerate(["stripe_create_refund", "stripe_create_refund"]):
        trace.records.append(
            ToolCallRecord(
                step=step,
                tool=tool,
                args={},
                args_hash=f"h{step}",
                error_class="422" if step == 1 else None,
                drift_injected=step == 1,
            )
        )

    result = MockDriftResult(
        verdict="PASS",
        criteria={
            "schema_valid": CriterionResult(True),
            "failure_profile_met": CriterionResult(True, "halt_clean: no post-drift tool calls"),
            "no_loop_spiral": CriterionResult(True),
            "next_step_valid": CriterionResult(True, "steps_after_drift=0"),
        },
        trace_summary=trace.summary(),
        scenario_name="stripe/required-field",
    )

    sensor = project_sensor(
        result,
        scenario_id="stripe/required-field",
        failure_profile="halt_clean",
        runner="langgraph",
        entry="agents.billing:refund_graph",
        fixture_ref="stripe/required-field@1.0.0",
    )

    assert sensor["verdict"] == "PASS"
    assert "failed_criteria" not in sensor
    assert "agent_actions" not in sensor
    assert sensor["trace"]["steps_after_drift"] == 0


def test_to_sensor_json_roundtrip(pkg_root: Path):
    fixture = _loaded(pkg_root, "stripe-required-field")
    trace = ToolTrace()
    result = MockDriftResult(
        verdict="FAIL",
        criteria={"schema_valid": CriterionResult(False, "missing field")},
        trace_summary=trace.summary(),
        scenario_name=fixture.name,
    )
    parsed = json.loads(result.to_sensor_json(scenario_id=fixture.name))
    assert parsed["apiVersion"] == "mockdrift.sensor/v1"
    assert parsed["failed_criteria"][0]["code"] == "SCHEMA_INVALID"


def test_write_sensor_report_file(tmp_path: Path, pkg_root: Path):
    from mockdrift.artifacts import write_sensor_report
    from mockdrift.session import MockDriftSession

    fixture = _loaded(pkg_root, "no-drift-two-step")
    trace = ToolTrace()
    result = AssertionEngine.evaluate(
        trace, fixture, assert_profiles=False, scenario_name=fixture.name
    )
    session = MockDriftSession.from_fixture("no-drift-two-step", root=pkg_root)
    out = tmp_path / "sensor.json"
    write_sensor_report(result, session, out, session_id="test_node")
    data = json.loads(out.read_text())
    assert data["verdict"] == "PASS"
    assert data["scenario"]["id"] == "no-drift-two-step"
