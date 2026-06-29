from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from fuseguard.policy_bundle import PolicyBundle, PolicyRule, pattern_match


@dataclass
class EvalContext:
    tool: str
    agent_id: str | None = None
    agent_type: str | None = None
    environment: str | None = None
    endpoint_host: str | None = None
    device_tag: str | None = None


@dataclass
class EvalTraceEntry:
    rule_id: str
    matched: bool
    action: str
    detail: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "ruleId": self.rule_id,
            "matched": self.matched,
            "action": self.action,
            "detail": self.detail,
        }


@dataclass
class PolicyEvalResult:
    allowed: bool
    reason: str | None = None
    rule_ids: list[str] = field(default_factory=list)
    trace: list[EvalTraceEntry] = field(default_factory=list)
    mode: str = "enforce"

    def to_trace_dicts(self) -> list[dict[str, Any]]:
        return [e.to_dict() for e in self.trace]


def _rule_matches(rule: PolicyRule, ctx: EvalContext) -> bool:
    m = rule.match
    if "toolPattern" in m and not pattern_match(m["toolPattern"], ctx.tool):
        return False
    if "endpointPattern" in m and ctx.endpoint_host:
        if not pattern_match(m["endpointPattern"], ctx.endpoint_host):
            return False
    if "agentType" in m and ctx.agent_type != m["agentType"]:
        return False
    if "environment" in m and ctx.environment != m["environment"]:
        return False
    if "deviceTag" in m and ctx.device_tag != m["deviceTag"]:
        return False
    return True


def _assignment_matches(assignment_match: dict[str, str], ctx: EvalContext) -> bool:
    if not assignment_match:
        return True
    if "agentType" in assignment_match and ctx.agent_type != assignment_match["agentType"]:
        return False
    if "environment" in assignment_match and ctx.environment != assignment_match["environment"]:
        return False
    if "deviceTag" in assignment_match and ctx.device_tag != assignment_match["deviceTag"]:
        return False
    return True


def evaluate_policy(bundle: PolicyBundle | None, ctx: EvalContext) -> PolicyEvalResult:
    if bundle is None or not bundle.feature_enabled("policy"):
        return PolicyEvalResult(allowed=True)

    policy_feat = bundle.features.get("policy") or {}
    mode = str(policy_feat.get("defaultMode") or "enforce")

    if bundle.kill_switch_active():
        return PolicyEvalResult(
            allowed=False,
            reason="kill_switch_active",
            mode=mode,
            trace=[EvalTraceEntry("kill_switch", True, "deny", "kill switch active")],
        )

    applicable_rules: list[PolicyRule] = []
    if bundle.assignments:
        for assignment in bundle.assignments:
            if _assignment_matches(assignment.match, ctx):
                for rid in assignment.rule_ids:
                    rule = bundle.rules.get(rid)
                    if rule:
                        applicable_rules.append(rule)
                break
    else:
        applicable_rules = list(bundle.rules.values())

    trace: list[EvalTraceEntry] = []
    denied_by: list[str] = []

    for rule in applicable_rules:
        matched = _rule_matches(rule, ctx)
        trace.append(
            EvalTraceEntry(
                rule.id,
                matched,
                rule.action,
                f"tool={ctx.tool}" if matched else "no match",
            )
        )
        if matched and rule.action == "deny":
            denied_by.append(rule.id)
        elif matched and rule.action == "allow":
            return PolicyEvalResult(allowed=True, rule_ids=[rule.id], trace=trace, mode=mode)

    if denied_by:
        allow = mode in ("audit", "warn")
        return PolicyEvalResult(
            allowed=allow,
            reason=None if allow else "policy_denied",
            rule_ids=denied_by,
            trace=trace,
            mode=mode,
        )

    return PolicyEvalResult(allowed=True, trace=trace, mode=mode)
