"""CP-3.1 — FuseGuard drift preflight gate."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from fuseguard import FuseConfig, FuseProxy, FuseTrip, wrap_agent
from fuseguard.drift_gate import DriftPreflightGate
from fuseguard.monitor import FuseMonitor


class _StubRunner:
    def invoke_tool(self, tool: str, args: dict):
        return {"ok": True, "tool": tool}


def test_cp31_blocked_preflight_trips_before_tool():
    cfg = FuseConfig(
        watch_ids=("watch-1"),
        api_key="dg_test_key",
        api_base="https://driftguard.org",
        preflight_cache_ttl_sec=0,
    )
    blocked_payload = {
        "allowed": False,
        "policyBlocked": True,
        "blocked": [
            {
                "watchId": "watch-1",
                "name": "Stripe API",
                "driftStatus": "drifted",
                "reasons": ["breaking_drift", "policy_block:block_new_runs"],
                "agentActions": ["acknowledge_drift"],
            },
        ],
        "durationMs": 12,
    }
    with patch("fuseguard.drift_gate._post_preflight", return_value=blocked_payload):
        wrapped = wrap_agent(_StubRunner(), cfg)
        with pytest.raises(FuseTrip) as exc:
            wrapped.invoke_tool("stripe_refund", {"amount": 1})
    assert exc.value.trip.reason == "contract_drift_blocked"
    assert exc.value.trip.metadata.get("agentActions") == ["acknowledge_drift"]


def test_cp31_allowed_preflight_allows_tool():
    cfg = FuseConfig(
        watch_ids=("watch-1"),
        api_key="dg_test_key",
        preflight_cache_ttl_sec=0,
    )
    with patch("fuseguard.drift_gate._post_preflight", return_value={"allowed": True, "blocked": [], "durationMs": 5}):
        wrapped = wrap_agent(_StubRunner(), cfg)
        result = wrapped.invoke_tool("search", {"q": "x"})
    assert result["ok"] is True


def test_cp31_preflight_cache_skips_repeat_http():
    cfg = FuseConfig(
        watch_ids=("watch-1"),
        api_key="dg_test_key",
        preflight_cache_ttl_sec=60,
    )
    gate = DriftPreflightGate(cfg)
    payload = {"allowed": True, "blocked": [], "durationMs": 1}
    with patch("fuseguard.drift_gate._post_preflight", return_value=payload) as post:
        gate.check()
        gate.check()
    post.assert_called_once()


def test_cp31_proxy_trips_on_drift_before_handler():
    cfg = FuseConfig(
        watch_ids=("w1"),
        api_key="key",
        preflight_cache_ttl_sec=0,
    )
    with patch(
        "fuseguard.drift_gate._post_preflight",
        return_value={"allowed": False, "blocked": [{"watchId": "w1", "agentActions": []}], "durationMs": 1},
    ):
        proxy = FuseProxy(lambda tool, args: {"ok": True}, cfg)
        with pytest.raises(FuseTrip):
            proxy.invoke("tool", {})


def test_cp31_no_gate_without_watch_or_agent():
    cfg = FuseConfig(api_key="key")
    assert not cfg.has_drift_gate()
    monitor = FuseMonitor(config=cfg)
    monitor.assert_contract_drift_clear()
