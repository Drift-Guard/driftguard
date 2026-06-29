"""FG-U-051..052 — daemon proxy."""

from __future__ import annotations

import pytest

from fuseguard.config import FuseConfig
from fuseguard.daemon.proxy import DaemonProxy
from fuseguard.monitor import FuseMonitor
from fuseguard.trip import FuseTrip


def test_fg_u_051_proxy_forwards_allow():
    calls = []

    def handler(tool: str, args: dict):
        calls.append(tool)
        return {"ok": True}

    proxy = DaemonProxy(handler, monitor=FuseMonitor(config=FuseConfig()))
    result = proxy.invoke("search", {"query": "x"})
    assert result["ok"] is True
    assert calls == ["search"]


def test_fg_u_052_proxy_blocks_loop(tmp_path):
    def handler(tool: str, args: dict):
        return {"error": "validation", "status": 422, "error_class": "422"}

    monitor = FuseMonitor(config=FuseConfig(max_identical_tool_hashes=2, trip_log_path=str(tmp_path / "t.json")))
    proxy = DaemonProxy(handler, monitor=monitor)
    with pytest.raises(FuseTrip):
        for _ in range(3):
            proxy.invoke("stripe_refund", {"amount": 1})
