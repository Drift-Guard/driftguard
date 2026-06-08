from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from mockdrift.errors import DriftToolError
from mockdrift.proxy import ToolTrace
from mockdrift.session import CriterionResult
from mockdrift.types import FailureProfile


@dataclass
class LangGraphRunContext:
    trace: ToolTrace
    profile: FailureProfile | str | None
    invoke_error: BaseException | None = None
    post_run_state: dict[str, Any] = field(default_factory=dict)
    pre_drift_state: dict[str, Any] = field(default_factory=dict)
    graph_reached_end: bool = True


def evaluate_failure_profile(ctx: LangGraphRunContext) -> CriterionResult:
    profile = ctx.profile
    if not profile:
        return CriterionResult(False, "failure_profile not set")

    if profile == "halt_clean":
        after = ctx.trace.steps_after_drift()
        if after > 0:
            return CriterionResult(False, f"halt_clean: steps_after_drift={after}")
        if not ctx.graph_reached_end:
            return CriterionResult(False, "halt_clean: graph did not reach END")
        return CriterionResult(True, "halt_clean: no post-drift tools")

    if profile == "bubble_to_orchestrator":
        after = ctx.trace.steps_after_drift()
        if after > 0:
            return CriterionResult(False, f"bubble_to_orchestrator: steps_after_drift={after}")
        if ctx.invoke_error is not None:
            cls = type(ctx.invoke_error).__name__
            if isinstance(ctx.invoke_error, DriftToolError):
                return CriterionResult(True, f"bubble_to_orchestrator: {cls}")
            return CriterionResult(True, f"bubble_to_orchestrator: {cls}")
        if ctx.trace.drift_step is not None:
            return CriterionResult(False, "bubble_to_orchestrator: drift error not bubbled to invoke")
        return CriterionResult(False, "bubble_to_orchestrator: no drift injected")

    if profile == "fallback_state":
        return evaluate_state_invariants(ctx.post_run_state, ctx.pre_drift_state, profile_detail=True)

    return CriterionResult(False, f"unknown failure_profile: {profile}")


def evaluate_state_invariants(
    post_state: dict[str, Any],
    pre_state: dict[str, Any],
    *,
    invariants: list[dict[str, Any]] | None = None,
    profile_detail: bool = False,
) -> CriterionResult:
    rules = invariants or []
    for rule in rules:
        path = rule.get("path", "")
        checkpoint = rule.get("checkpoint")
        source = pre_state if checkpoint == "pre_drift" else post_state
        value = _resolve_path(source, path)
        if rule.get("rule") == "one_of":
            allowed = rule.get("values", [])
            if value not in allowed:
                return CriterionResult(False, f"state_invariant {path}={value!r} not in {allowed}")
        elif rule.get("rule") == "equals":
            if value != rule.get("value"):
                return CriterionResult(False, f"state_invariant {path}={value!r} != {rule.get('value')!r}")

    if profile_detail:
        status = _resolve_path(post_state, "refund.status") or _resolve_path(post_state, "$.refund.status")
        return CriterionResult(True, f"fallback_state: refund.status={status!r}")
    return CriterionResult(True)


def _resolve_path(state: dict[str, Any], path: str) -> Any:
    clean = path.removeprefix("$.")
    parts = clean.split(".")
    cur: Any = state
    for part in parts:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur
