"""FG-P-020..022 — per-tool cost overrides from policy bundle."""

from __future__ import annotations

import pytest

from fuseguard import FuseConfig, FuseTrip
from fuseguard.policy_bundle import PolicyBundle
from fuseguard.proxy import FuseProxy


def test_fg_p_020_cost_for_tool_pattern():
    bundle = PolicyBundle.from_dict(
        {
            "version": 1,
            "bundleVersion": "1",
            "features": {"policy": {"enabled": True}},
            "rules": [],
            "assignments": [],
            "costs": {
                "defaultUsdPerBlock": 0.04,
                "tools": [
                    {"toolPattern": "stripe_*", "usdPerCall": 0.5},
                    {"toolPattern": "delete_*", "usdPerCall": 0.15},
                ],
            },
        }
    )
    assert bundle.cost_for_tool("read_file") == 0.04
    assert bundle.cost_for_tool("stripe_refund") == 0.5
    assert bundle.cost_for_tool("delete_file") == 0.15


def test_fg_p_021_budget_uses_bundle_cost(tmp_path):
    policy = tmp_path / "policy.bundle.json"
    policy.write_text(
        """{
          "version": 1,
          "bundleVersion": "1",
          "features": {"policy": {"enabled": false}, "budget": {"enabled": true, "capUsdPerRun": 0.1}},
          "rules": [],
          "assignments": [],
          "costs": {
            "defaultUsdPerBlock": 0.04,
            "tools": [{"toolPattern": "expensive_*", "usdPerCall": 0.08}]
          }
        }"""
    )
    cfg = FuseConfig(policy_path=str(policy), budget_cap_usd=0.1)
    proxy = FuseProxy(lambda tool, args: {"ok": True}, config=cfg)
    proxy.invoke("expensive_tool", {})
    with pytest.raises(FuseTrip) as exc:
        proxy.invoke("expensive_tool", {})
    assert exc.value.trip.reason == "budget_exceeded"


def test_fg_p_022_proxy_resolves_cost_when_omitted(tmp_path):
    policy = tmp_path / "policy.bundle.json"
    policy.write_text(
        """{
          "version": 1,
          "bundleVersion": "1",
          "features": {"policy": {"enabled": false}},
          "rules": [],
          "assignments": [],
          "costs": {"defaultUsdPerBlock": 0.02, "tools": []}
        }"""
    )
    cfg = FuseConfig(policy_path=str(policy), budget_cap_usd=1.0)
    proxy = FuseProxy(lambda tool, args: {"ok": True}, config=cfg)
    proxy.invoke("any_tool", {})
    assert proxy.monitor.budget is not None
    assert proxy.monitor.budget.spent_usd == pytest.approx(0.02)
