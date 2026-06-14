from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal


@dataclass(frozen=True)
class EvaluatorResult:
    verdict: Literal["PASS", "FAIL"]
    errors: list[str]
    sensor_verdict: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "apiVersion": "mockdrift.evaluator/v1",
            "verdict": self.verdict,
            "sensor_verdict": self.sensor_verdict,
            "errors": self.errors,
        }


def evaluate_sensor_report(data: dict[str, Any]) -> EvaluatorResult:
    """Rule-only PGE evaluator — reads mockdrift.sensor/v1 only."""
    errors: list[str] = []

    api = data.get("apiVersion")
    if api != "mockdrift.sensor/v1":
        return EvaluatorResult("FAIL", [f"expected apiVersion mockdrift.sensor/v1, got {api!r}"])

    verdict = data.get("verdict")
    if verdict not in ("PASS", "FAIL"):
        return EvaluatorResult("FAIL", [f"invalid sensor verdict: {verdict!r}"])

    criteria = data.get("criteria")
    if not isinstance(criteria, dict):
        errors.append("missing criteria object")
    else:
        for name, row in criteria.items():
            if not isinstance(row, dict) or "pass" not in row:
                errors.append(f"criteria.{name} missing pass field")
                continue
            passed = row["pass"]
            if verdict == "PASS" and not passed:
                errors.append(f"criteria.{name} failed but sensor verdict is PASS")
            if verdict == "FAIL" and passed and name in ("failure_profile_met", "schema_valid"):
                errors.append(f"criteria.{name} passed but sensor verdict is FAIL")

    if verdict == "FAIL":
        failed = data.get("failed_criteria")
        if not isinstance(failed, list) or not failed:
            errors.append("FAIL sensor must include non-empty failed_criteria")
        failure = data.get("failure")
        if not isinstance(failure, dict) or not failure.get("code"):
            errors.append("FAIL sensor must include failure.code")
        actions = data.get("agent_actions")
        if not isinstance(actions, list) or not actions:
            errors.append("FAIL sensor must include agent_actions for in-loop remediation")
    else:
        if data.get("failed_criteria"):
            errors.append("PASS sensor must not include failed_criteria")
        if data.get("failure"):
            errors.append("PASS sensor must not include failure")

    trace = data.get("trace")
    if not isinstance(trace, dict):
        errors.append("missing trace object")
    elif "steps_after_drift" not in trace:
        errors.append("trace.steps_after_drift required")

    if errors:
        return EvaluatorResult("FAIL", errors, sensor_verdict=verdict)
    return EvaluatorResult("PASS", [], sensor_verdict=verdict)


def evaluate_sensor_file(path: Path) -> EvaluatorResult:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return EvaluatorResult("FAIL", [f"invalid JSON: {exc}"])
    if not isinstance(data, dict):
        return EvaluatorResult("FAIL", ["sensor report must be a JSON object"])
    return evaluate_sensor_report(data)
