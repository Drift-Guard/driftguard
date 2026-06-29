"""FG-U-041..045 — schema gates."""

from __future__ import annotations

import pytest

from fuseguard.config import FuseConfig
from fuseguard.monitor import FuseMonitor
from fuseguard.policy_bundle import PolicyBundle
from fuseguard.schema_gate import validate_tool_args
from fuseguard.trip import FuseTrip


def test_fg_u_041_ingress_invalid():
    profile = {"schema": {"type": "object", "required": ["query"], "properties": {"query": {"type": "string"}}}}
    result = validate_tool_args(profile, {})
    assert not result.ok


def test_fg_u_042_ingress_valid():
    profile = {"schema": {"type": "object", "required": ["query"], "properties": {"query": {"type": "string"}}}}
    result = validate_tool_args(profile, {"query": "docs"})
    assert result.ok


def test_fg_u_043_response_schema_drift(tmp_path):
    bundle = PolicyBundle.from_dict(
        {
            "version": 1,
            "bundleVersion": "1",
            "features": {"policy": {"enabled": True}},
            "rules": [],
            "assignments": [],
            "profiles": {
                "search:response": {
                    "schema": {
                        "type": "object",
                        "required": ["results"],
                        "properties": {"results": {"type": "array"}},
                    }
                }
            },
        }
    )
    policy_path = tmp_path / "policy.json"
    policy_path.write_text('{"version":1,"bundleVersion":"1","features":{"policy":{"enabled":true}},"rules":[],"assignments":[],"profiles":{}}')
    monitor = FuseMonitor(config=FuseConfig(policy_path=str(policy_path)))
    monitor.policy_bundle = bundle
    with pytest.raises(FuseTrip) as exc:
        monitor.assert_response_valid("search", {"bad": True})
    assert exc.value.trip.reason == "response_schema_drift"
