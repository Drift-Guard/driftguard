"""FG-U-021..036 — rate gate, budget tree, local store."""

from __future__ import annotations

import json
import time
from unittest.mock import patch

import pytest

from fuseguard.budget import BudgetGate
from fuseguard.config import FuseConfig
from fuseguard.device import ensure_device_id
from fuseguard.local_store import LocalStore
from fuseguard.monitor import FuseMonitor
from fuseguard.rate_gate import RateGate
from fuseguard.trip import FuseTrip, new_trip_id, utc_now_iso


def test_fg_u_021_rate_limited():
    gate = RateGate(max_per_minute=2)
    gate.record()
    gate.record()
    assert gate.would_exceed()


def test_fg_u_022_rate_window_reset():
    gate = RateGate(max_per_minute=1)
    with patch("fuseguard.rate_gate.time.monotonic", side_effect=[0.0, 0.0, 0.0, 61.0]):
        gate.record()
        assert gate.would_exceed()
        assert not gate.would_exceed()


def test_fg_u_023_parent_budget_rollup():
    parent = BudgetGate(cap_usd=10.0)
    child = parent.child_gate("sub", cap_usd=5.0)
    child.record_spend(3.0)
    assert parent.spent_usd == 3.0


def test_fg_u_024_child_budget_exceeded():
    parent = BudgetGate(cap_usd=10.0)
    child = parent.child_gate("sub", cap_usd=1.0)
    child.record_spend(1.0)
    assert child.would_exceed(0.01)


def test_fg_u_025_run_id_propagation(monkeypatch, tmp_path):
    monkeypatch.setenv("FUSEGUARD_RUN_ID", "run_test")
    monkeypatch.setenv("FUSEGUARD_PARENT_RUN_ID", "parent_test")
    monitor = FuseMonitor(config=FuseConfig(max_identical_tool_hashes=1, trip_log_path=str(tmp_path / "t.json")))
    with pytest.raises(FuseTrip) as exc:
        for _ in range(2):
            monitor.record_call(tool="t", args={"x": 1}, status_code=422, error_class="422")
    assert exc.value.trip.run_id == "run_test"
    assert exc.value.trip.parent_run_id == "parent_test"


def test_fg_u_031_sqlite_trip_insert(tmp_path):
    store = LocalStore.open(tmp_path / "trips.db")
    payload = {"tripId": new_trip_id(), "reason": "loop_detected", "createdAt": utc_now_iso(), "calls": []}
    store.insert_trip(payload)
    rows = store.export_trips_since("1970-01-01T00:00:00+00:00")
    assert len(rows) == 1


def test_fg_u_032_sync_queue_enqueue(tmp_path):
    store = LocalStore.open(tmp_path / "trips.db")
    store.enqueue_sync("block", {"tripId": "fg_abc", "deviceId": "dev_1", "decision": "block"})
    pending = store.pending_sync()
    assert len(pending) == 1
    assert pending[0]["kind"] == "block"


def test_fg_u_033_device_json_creation(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    device = ensure_device_id()
    assert device["deviceId"].startswith("dev_")


def test_fg_u_036_no_raw_args_in_sync_payload(tmp_path):
    store = LocalStore.open(tmp_path / "trips.db")
    row = {"tripId": "fg_abc", "argsHash": "abcd1234", "decision": "block"}
    store.enqueue_sync("block", row)
    pending = store.pending_sync()
    raw = json.dumps(pending[0]["payload"])
    assert "argsHash" in raw
    assert "rawArgs" not in raw
