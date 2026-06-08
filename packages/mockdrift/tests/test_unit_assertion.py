from __future__ import annotations

from pathlib import Path

import yaml

from mockdrift.assertion.engine import AssertionEngine
from mockdrift.config import load_config, resolve_fixture_config
from mockdrift.fixture import load_fixture
from mockdrift.proxy import ToolCallRecord, ToolTrace
from mockdrift.session import CriterionResult, MockDriftResult


def _loaded(pkg_root: Path, name: str):
    config = load_config(pkg_root)
    return load_fixture(resolve_fixture_config(config, name), defaults=config.defaults)


def test_assertion_engine_passes_clean_proxy_trace(pkg_root: Path):
    fixture = _loaded(pkg_root, "no-drift-two-step")
    trace = ToolTrace()
    result = AssertionEngine.evaluate(trace, fixture, assert_profiles=False, scenario_name="x")
    assert result.verdict == "PASS"
    assert result.criteria["schema_valid"].pass_ is True


def test_assertion_engine_fails_schema_violations(pkg_root: Path):
    fixture = _loaded(pkg_root, "no-drift-two-step")
    trace = ToolTrace(schema_violations=["missing field"])
    result = AssertionEngine.evaluate(trace, fixture, assert_profiles=False, scenario_name="x")
    assert result.verdict == "FAIL"
    assert not result.criteria["schema_valid"].pass_


def test_emit_scenario_produces_assertion_v2_yaml(pkg_root: Path):
    fixture = _loaded(pkg_root, "stripe-required-field")
    trace = ToolTrace()
    trace.records.append(
        ToolCallRecord(step=1, tool="t", args={}, args_hash="h", error_class="422", drift_injected=True)
    )
    trace.drift_step = 1
    result = MockDriftResult(
        verdict="FAIL",
        criteria={"schema_valid": CriterionResult(False, "x")},
        trace_summary=trace.summary(),
        scenario_name=fixture.name,
    )
    parsed = yaml.safe_load(result.emit_scenario())
    assert parsed["apiVersion"] == "mockdrift.assertion/v2"
    assert parsed["verdict"] == "FAIL"
