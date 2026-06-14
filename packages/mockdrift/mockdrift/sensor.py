from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Literal

from mockdrift.session import CriterionResult, MockDriftResult, TraceSummary
from mockdrift.types import FailureProfile

FailureCode = Literal[
    "SCHEMA_INVALID",
    "WRONG_FAILURE_PROFILE",
    "STATE_INVARIANT_VIOLATION",
    "POISONED_NEXT_STEP",
    "LOOP_SPIRAL",
    "IDEMPOTENCY_VIOLATION",
    "TIMEOUT",
    "BUDGET_EXCEEDED",
    "MISCONFIGURATION",
]

CRITERION_CODES: dict[str, FailureCode] = {
    "schema_valid": "SCHEMA_INVALID",
    "failure_profile_met": "WRONG_FAILURE_PROFILE",
    "state_invariants": "STATE_INVARIANT_VIOLATION",
    "next_step_valid": "POISONED_NEXT_STEP",
    "idempotency": "IDEMPOTENCY_VIOLATION",
    "no_loop_spiral": "LOOP_SPIRAL",
}

PROFILE_REMEDIATION: dict[str, str] = {
    "halt_clean": "Stop all tool calls after drift; return a terminal state without further tool nodes.",
    "bubble_to_orchestrator": "Stop tool calls after drift; let DriftToolError reach the LangGraph runner.",
    "fallback_state": "Set declared fallback state fields and satisfy state_invariants after drift.",
}

CRITERION_REMEDIATION: dict[str, str] = {
    "schema_valid": "Fix tool argument binding; ensure call args match the fixture inputSchema.",
    "failure_profile_met": "Align agent behavior with the declared failure_profile in harness.lock or @drift_replay.",
    "state_invariants": "Update post-drift state to match expect.state_invariants or adjust the graph interrupt path.",
    "next_step_valid": "Reduce steps_after_drift or remove forbidden tools from the post-drift path.",
    "idempotency": "Use idempotency keys and avoid duplicate side-effect tool calls after drift.",
    "no_loop_spiral": "Break retry loops on the same tool hash or error class after drift injection.",
}


def _criteria_payload(criteria: dict[str, CriterionResult]) -> dict[str, dict[str, Any]]:
    return {
        name: {"pass": c.pass_, **({"detail": c.detail} if c.detail else {})}
        for name, c in criteria.items()
    }


def _trace_payload(trace: TraceSummary) -> dict[str, Any]:
    tools_called: list[dict[str, Any]] = []
    for idx, entry in enumerate(trace.tools_called):
        row: dict[str, Any] = {"tool": entry.get("tool", "")}
        if "step" in entry:
            row["step"] = entry["step"]
        else:
            row["step"] = idx
        if entry.get("error_class"):
            row["error_class"] = entry["error_class"]
        tools_called.append(row)

    last_tool = tools_called[-1]["tool"] if tools_called else None

    return {
        "steps_total": trace.steps_total,
        "steps_after_drift": trace.steps_after_drift,
        "drift_injected_at_step": trace.drift_injected_at_step,
        "last_tool": last_tool,
        "tools_called": tools_called,
    }


def _message_for(criterion_id: str, detail: str, failure_profile: FailureProfile | None) -> str:
    if criterion_id == "failure_profile_met" and failure_profile:
        if "steps_after_drift" in detail:
            return f"Agent continued tool calls after drift; expected {failure_profile}."
        return f"failure_profile {failure_profile} not met."
    if criterion_id == "schema_valid":
        return "Tool response or args violated fixture schema binding."
    if criterion_id == "no_loop_spiral":
        return "Loop spiral or identical tool hash streak detected after drift."
    if criterion_id == "next_step_valid":
        return "Too many steps or forbidden tools after drift injection."
    if criterion_id == "idempotency":
        return "Duplicate side-effect tool calls exceeded expect.idempotency limits."
    if criterion_id == "state_invariants":
        return "Post-drift state violated declared state_invariants."
    return detail or f"Criterion {criterion_id} failed."


def _remediation_for(
    criterion_id: str,
    detail: str,
    failure_profile: FailureProfile | None,
) -> str:
    if criterion_id == "failure_profile_met" and failure_profile:
        return PROFILE_REMEDIATION.get(failure_profile, CRITERION_REMEDIATION[criterion_id])
    if criterion_id == "next_step_valid" and "steps_after_drift" in detail:
        return "Set max_steps_after_drift in expect or fix graph interrupt handling."
    return CRITERION_REMEDIATION.get(criterion_id, "Review fixture expect criteria and agent graph handling.")


def _last_tool(trace: TraceSummary) -> str | None:
    if not trace.tools_called:
        return None
    return trace.tools_called[-1].get("tool")


def _agent_actions(
    failed: list[dict[str, Any]],
    failure_profile: FailureProfile | None,
    trace: TraceSummary,
) -> list[str]:
    actions: list[str] = []
    failed_ids = {item["id"] for item in failed}
    last_tool = _last_tool(trace)

    if "failure_profile_met" in failed_ids or "next_step_valid" in failed_ids:
        if last_tool:
            actions.append(
                f"Review post-drift handling for tool {last_tool} "
                "and stop scheduling further tool nodes after drift."
            )
        else:
            actions.append("Stop tool calls after drift injection per the declared failure_profile.")

    if "schema_valid" in failed_ids:
        actions.append("Validate tool args against before.schema.json before retrying after a 422.")

    if "no_loop_spiral" in failed_ids:
        actions.append("Add circuit-breaking on repeated identical tool calls with the same error class.")

    if "idempotency" in failed_ids:
        actions.append("Require idempotency keys on side-effect tools listed in expect.idempotency.")

    if "state_invariants" in failed_ids:
        actions.append("Ensure fallback_state sets invariant fields before graph completion.")

    if failure_profile == "halt_clean" and (
        "failure_profile_met" in failed_ids or "next_step_valid" in failed_ids
    ):
        actions.append(
            "If user-facing halt is intended, confirm halt_clean is set in harness.lock or @drift_replay."
        )
    elif failure_profile == "bubble_to_orchestrator" and "failure_profile_met" in failed_ids:
        actions.append("Verify graph catches DriftToolError and does not schedule further tool nodes.")

    if not actions:
        actions.append("Re-run mockdrift demo for this fixture and compare trace to expect criteria.")

    return actions


def project_sensor(
    result: MockDriftResult,
    *,
    scenario_id: str | None = None,
    failure_profile: FailureProfile | None = None,
    runner: str | None = None,
    entry: str | None = None,
    session_id: str | None = None,
    fixture_ref: str | None = None,
    harness_bundle: str | None = None,
) -> dict[str, Any]:
    """Project assertion v2 result into mockdrift.sensor/v1 JSON object."""
    scenario_id = scenario_id or result.scenario_name
    payload: dict[str, Any] = {
        "apiVersion": "mockdrift.sensor/v1",
        "verdict": result.verdict,
        "scenario": {"id": scenario_id},
        "source": {
            "assertion_api_version": "mockdrift.assertion/v2",
            "emitted_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
        "criteria": _criteria_payload(result.criteria),
        "trace": _trace_payload(result.trace_summary),
    }

    if failure_profile:
        payload["scenario"]["failure_profile"] = failure_profile
    if runner:
        payload["scenario"]["runner"] = runner
    if entry:
        payload["scenario"]["entry"] = entry
    if session_id:
        payload["source"]["session_id"] = session_id

    links: dict[str, str] = {}
    if fixture_ref:
        links["fixture"] = fixture_ref
    if harness_bundle:
        links["harness_bundle"] = harness_bundle
    if links:
        payload["links"] = links

    if result.verdict == "FAIL":
        failed: list[dict[str, Any]] = []
        for criterion_id, criterion in result.criteria.items():
            if criterion.pass_:
                continue
            code = CRITERION_CODES.get(criterion_id, "MISCONFIGURATION")
            failed.append(
                {
                    "id": criterion_id,
                    "code": code,
                    "message": _message_for(criterion_id, criterion.detail, failure_profile),
                    "remediation": _remediation_for(criterion_id, criterion.detail, failure_profile),
                    **({"detail": criterion.detail} if criterion.detail else {}),
                }
            )

        primary = failed[0]
        failure_step: int | None = None
        drift_step = result.trace_summary.drift_injected_at_step
        if drift_step is not None and result.trace_summary.steps_after_drift > 0:
            failure_step = drift_step + 1

        payload["failed_criteria"] = failed
        payload["failure"] = {
            "code": primary["code"],
            "message": primary["message"],
            **({"step": failure_step} if failure_step is not None else {}),
        }
        payload["agent_actions"] = _agent_actions(failed, failure_profile, result.trace_summary)

    return payload


def sensor_json(
    result: MockDriftResult,
    *,
    scenario_id: str | None = None,
    failure_profile: FailureProfile | None = None,
    runner: str | None = None,
    entry: str | None = None,
    session_id: str | None = None,
    fixture_ref: str | None = None,
    harness_bundle: str | None = None,
    indent: int | None = 2,
) -> str:
    payload = project_sensor(
        result,
        scenario_id=scenario_id,
        failure_profile=failure_profile,
        runner=runner,
        entry=entry,
        session_id=session_id,
        fixture_ref=fixture_ref,
        harness_bundle=harness_bundle,
    )
    return json.dumps(payload, indent=indent, sort_keys=False) + "\n"
