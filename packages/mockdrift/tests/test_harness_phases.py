from __future__ import annotations

import json
from pathlib import Path

import pytest

from mockdrift.evaluator import evaluate_sensor_file, evaluate_sensor_report
from mockdrift.marketplace import load_marketplace_index, marketplace_fixture_config, resolve_marketplace_id
from mockdrift.sensor import project_sensor
from mockdrift.session import CriterionResult, MockDriftResult, TraceSummary


def test_marketplace_index_loads(pkg_root: Path):
    index = load_marketplace_index(pkg_root)
    assert "stripe/required-field" in index
    assert index["stripe/required-field"].mockdrift_key == "stripe-required-field"


def test_resolve_marketplace_id(pkg_root: Path):
    key = resolve_marketplace_id("stripe/required-field", pkg_root)
    assert key == "stripe-required-field"


def test_marketplace_hosted_only_raises(pkg_root: Path):
    with pytest.raises(Exception, match="hosted-catalog"):
        marketplace_fixture_config("openai/chat-completions-tool-required", pkg_root)


def test_evaluator_passes_valid_sensor():
    sensor = {
        "apiVersion": "mockdrift.sensor/v1",
        "verdict": "PASS",
        "criteria": {"schema_valid": {"pass": True}},
        "trace": {"steps_total": 1, "steps_after_drift": 0},
    }
    result = evaluate_sensor_report(sensor)
    assert result.verdict == "PASS"


def test_evaluator_fails_inconsistent_sensor():
    sensor = {
        "apiVersion": "mockdrift.sensor/v1",
        "verdict": "FAIL",
        "criteria": {"schema_valid": {"pass": True}},
        "trace": {"steps_total": 1, "steps_after_drift": 0},
    }
    result = evaluate_sensor_report(sensor)
    assert result.verdict == "FAIL"
    assert any("failed_criteria" in e for e in result.errors)


def test_evaluator_file_roundtrip(tmp_path: Path):
    result = MockDriftResult(
        verdict="PASS",
        criteria={"schema_valid": CriterionResult(True)},
        trace_summary=TraceSummary(steps_total=0, steps_after_drift=0),
        scenario_name="x",
    )
    payload = project_sensor(result, scenario_id="stripe/required-field")
    path = tmp_path / "sensor.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    ev = evaluate_sensor_file(path)
    assert ev.verdict == "PASS"
