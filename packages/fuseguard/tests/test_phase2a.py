"""Phase 2A — FuseGuard M1 tests FG-T01 … FG-T07."""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from fuseguard import FuseConfig, FuseProxy, FuseTrip, wrap_agent
from fuseguard.config import fuse_enabled
from fuseguard.monitor import FuseMonitor
from fuseguard.streak import is_transient_http
from mockdrift.loop_detect import LoopDetector, tool_args_hash


class _StubRunner:
    def __init__(self, responses: list) -> None:
        self._responses = list(responses)
        self.calls = 0

    def invoke_tool(self, tool: str, args: dict):
        self.calls += 1
        item = self._responses[min(self.calls - 1, len(self._responses) - 1)]
        if isinstance(item, Exception):
            raise item
        return item


class _HttpError(Exception):
    def __init__(self, status_code: int, error_class: str) -> None:
        self.status_code = status_code
        self.error_class = error_class
        super().__init__(f"HTTP {status_code}")


def test_fg_t01_identical_hash_trips():
    """FG-T01: same tool+args hash 3× trips and halts."""
    monitor = FuseMonitor(config=FuseConfig(max_identical_tool_hashes=2))
    args = {"amount": 100}
    with pytest.raises(FuseTrip) as exc:
        for _ in range(3):
            monitor.record_call(tool="stripe_refund", args=args, status_code=422, error_class="422")
    assert exc.value.trip.reason == "loop_detected"
    assert exc.value.trip.tool_name == "stripe_refund"


def test_fg_t02_transient_503_no_trip():
    """FG-T02: 503 responses excluded from loop streak."""
    monitor = FuseMonitor(config=FuseConfig(max_identical_tool_hashes=2, same_error_streak=2))
    args = {"amount": 100}
    for _ in range(5):
        monitor.record_call(tool="stripe_refund", args=args, status_code=503, error_class="503")
    assert is_transient_http(503)


def test_fg_t03_422_error_streak_trips():
    """FG-T03: non-transient 422 errors trip."""
    monitor = FuseMonitor(config=FuseConfig(max_identical_tool_hashes=99, same_error_streak=3))
    with pytest.raises(FuseTrip):
        for i in range(3):
            monitor.record_call(
                tool="stripe_refund",
                args={"n": i},
                status_code=422,
                error_class="422",
            )


def test_fg_t04_budget_trips_before_call():
    """FG-T04: budget cap blocks pre-call."""
    monitor = FuseMonitor(config=FuseConfig(budget_cap_usd=1.0))
    monitor.record_spend(1.0)
    with pytest.raises(FuseTrip) as exc:
        monitor.assert_pre_call_budget(0.01)
    assert exc.value.trip.reason == "budget_exceeded"


def test_fg_t05_mockdrift_loop_parity():
    """FG-T05: FuseGuard trip step aligns with MockDrift LoopDetector."""
    cfg = FuseConfig(max_identical_tool_hashes=2, same_error_streak=3)
    monitor = FuseMonitor(config=cfg)
    md = LoopDetector(
        max_identical_tool_hashes=cfg.max_identical_tool_hashes,
        window_steps=cfg.window_steps,
        same_error_streak=cfg.same_error_streak,
    )
    tool, args = "stripe_refund", {"amount": 50}
    h = tool_args_hash(tool, args)
    trip_step = None
    with pytest.raises(FuseTrip) as caught:
        for _step in range(1, 6):
            monitor.record_call(tool=tool, args=args, status_code=422, error_class="422")
    trip_step = caught.value.trip.calls[-1].step

    md_step = None
    for step in range(1, 6):
        md.record(step=step, tool=tool, args_hash=h, error_class="422")
        if md.spiral_detected(h, "422"):
            md_step = step
            break
    assert trip_step == md_step


def test_fg_t06_fuse_disabled_no_trip(monkeypatch):
    """FG-T06: DRIFTGUARD_FUSE=0 disables trips."""
    monkeypatch.setenv("DRIFTGUARD_FUSE", "0")
    assert fuse_enabled() is False
    monitor = FuseMonitor.from_env()
    for _ in range(10):
        monitor.record_call(tool="t", args={"x": 1}, status_code=422, error_class="422")


def test_fg_t07_trip_log_schema(tmp_path: Path):
    """FG-T07: trip log validates against JSON schema."""
    jsonschema = pytest.importorskip("jsonschema")
    schema = json.loads(
        (Path(__file__).resolve().parents[1] / "fuseguard" / "trip_log.schema.json").read_text()
    )
    log_path = tmp_path / "trip.json"
    monitor = FuseMonitor(config=FuseConfig(max_identical_tool_hashes=1, trip_log_path=str(log_path)))
    with pytest.raises(FuseTrip):
        for _ in range(2):
            monitor.record_call(tool="search", args={"q": "x"}, status_code=422, error_class="422")
    payload = json.loads(log_path.read_text())
    jsonschema.validate(payload, schema)


def test_wrap_agent_trips_on_loop():
    runner = _StubRunner(
        [
            _HttpError(422, "422"),
            _HttpError(422, "422"),
            _HttpError(422, "422"),
        ]
    )
    wrapped = wrap_agent(runner, FuseConfig(max_identical_tool_hashes=2))
    tripped = False
    for _ in range(4):
        try:
            wrapped.invoke_tool("stripe_refund", {"amount": 1})
        except FuseTrip:
            tripped = True
            break
        except _HttpError:
            continue
    assert tripped


def test_proxy_mode_records_and_trips():
    def handler(tool: str, args: dict):
        return {"error": "validation", "status": 422, "error_class": "422"}

    proxy = FuseProxy(handler, FuseConfig(max_identical_tool_hashes=2))
    with pytest.raises(FuseTrip):
        for _ in range(3):
            proxy.invoke("stripe_refund", {"amount": 1})
