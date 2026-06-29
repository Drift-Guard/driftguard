"""FG-U-001..015 — policy bundle and eval tests."""

from __future__ import annotations

import json
import time
from pathlib import Path

import pytest

from fuseguard import FuseConfig, FuseTrip, wrap_agent
from fuseguard.monitor import FuseMonitor
from fuseguard.policy_bundle import PolicyBundle, PolicyBundleError
from fuseguard.policy_eval import EvalContext, evaluate_policy
from fuseguard.policy_lint import lint_policy_path

FIXTURES = Path(__file__).resolve().parents[3] / "examples" / "fuseguard" / "fixtures"


def test_fg_u_001_load_allow_all():
    bundle = PolicyBundle.load_path(FIXTURES / "policy-allow-all.json")
    assert bundle.version == 1
    assert bundle.feature_enabled("policy")


def test_fg_u_002_reject_invalid_bundle():
    with pytest.raises(PolicyBundleError):
        PolicyBundle.from_dict({"rules": []})


def test_fg_u_004_deny_tool_pattern():
    bundle = PolicyBundle.load_path(FIXTURES / "policy-deny-delete.json")
    result = evaluate_policy(bundle, EvalContext(tool="delete_file"))
    assert not result.allowed
    assert result.reason == "policy_denied"
    assert "deny-delete" in result.rule_ids


def test_fg_u_005_allow_non_matching():
    bundle = PolicyBundle.load_path(FIXTURES / "policy-deny-delete.json")
    result = evaluate_policy(bundle, EvalContext(tool="read_file"))
    assert result.allowed


def test_fg_u_006_assignment_priority():
    data = {
        "version": 1,
        "bundleVersion": "1",
        "features": {"policy": {"enabled": True, "defaultMode": "enforce"}},
        "rules": [
            {"id": "allow-read", "action": "allow", "match": {"toolPattern": "read_*"}},
            {"id": "deny-all", "action": "deny", "match": {"toolPattern": "*"}},
        ],
        "assignments": [
            {"priority": 10, "rules": ["allow-read"], "match": {}},
            {"priority": 1, "rules": ["deny-all"], "match": {}},
        ],
    }
    bundle = PolicyBundle.from_dict(data)
    result = evaluate_policy(bundle, EvalContext(tool="read_file"))
    assert result.allowed


def test_fg_u_010_eval_trace_completeness():
    bundle = PolicyBundle.load_path(FIXTURES / "policy-deny-delete.json")
    result = evaluate_policy(bundle, EvalContext(tool="delete_file"))
    assert len(result.trace) >= 1
    assert result.to_trace_dicts()[0]["ruleId"]


def test_fg_u_011_wrap_agent_policy_deny(tmp_path: Path):
    policy = FIXTURES / "policy-deny-delete.json"
    cache = tmp_path / "policy.bundle.json"
    cache.write_text(policy.read_text())

    class Runner:
        def invoke_tool(self, tool: str, args: dict):
            return {"ok": True}

    cfg = FuseConfig(policy_path=str(cache), trip_log_path=str(tmp_path / "trip.json"))
    wrapped = wrap_agent(Runner(), cfg)
    with pytest.raises(FuseTrip) as exc:
        wrapped.invoke_tool("delete_file", {})
    assert exc.value.trip.reason == "policy_denied"


def test_fg_u_013_policy_lint_invalid(tmp_path: Path):
    bad = tmp_path / "bad.json"
    bad.write_text('{"version": 1, "assignments": [{"rules": ["missing"]}]}')
    errors = lint_policy_path(bad)
    assert errors


def test_fg_u_014_disabled_policy_feature():
    bundle = PolicyBundle.from_dict(
        {"version": 1, "features": {"policy": {"enabled": False}}, "rules": [], "assignments": []}
    )
    result = evaluate_policy(bundle, EvalContext(tool="delete_file"))
    assert result.allowed


def test_fg_u_015_policy_perf():
    rules = [{"id": f"r{i}", "action": "deny", "match": {"toolPattern": f"tool_{i}"}} for i in range(100)]
    bundle = PolicyBundle.from_dict(
        {
            "version": 1,
            "bundleVersion": "1",
            "features": {"policy": {"enabled": True}},
            "rules": rules,
            "assignments": [{"priority": 1, "rules": [r["id"] for r in rules], "match": {}}],
        }
    )
    start = time.perf_counter()
    for _ in range(1000):
        evaluate_policy(bundle, EvalContext(tool="tool_50"))
    elapsed = time.perf_counter() - start
    assert elapsed < 1.0


def test_fg_u_055_kill_switch_in_bundle():
    bundle = PolicyBundle.from_dict(
        {
            "version": 1,
            "bundleVersion": "1",
            "features": {"killSwitch": {"active": True}, "policy": {"enabled": True}},
            "rules": [],
            "assignments": [],
            "profiles": {},
        }
    )
    assert bundle.kill_switch_active()
    result = evaluate_policy(bundle, EvalContext(tool="delete_file"))
    assert not result.allowed
    assert result.reason == "kill_switch_active"
