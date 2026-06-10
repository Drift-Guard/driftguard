"""CP-3.2 — contract_drift_blocked + agentAction on FuseTrip responses."""

from __future__ import annotations

import pytest

from fuseguard.trip import FuseTrip, Trip, new_trip_id, utc_now_iso


def test_cp32_blocked_response_shape():
    trip = Trip(
        trip_id=new_trip_id(),
        reason="contract_drift_blocked",
        created_at=utc_now_iso(),
        watch_id="watch-1",
        agent_action="Acknowledge drift before resuming runs.",
        metadata={
            "agentActions": ["Acknowledge drift before resuming runs.", "Update client schema"],
            "blocked": [{"watchId": "watch-1", "agentActions": ["Acknowledge drift before resuming runs."]}],
        },
    )
    payload = trip.to_blocked_response()
    assert payload["error"] == "contract_drift_blocked"
    assert payload["agentAction"] == "Acknowledge drift before resuming runs."
    assert payload["tripId"] == trip.trip_id
    assert payload["watchId"] == "watch-1"


def test_cp32_fuse_trip_response_dict():
    trip = Trip(
        trip_id=new_trip_id(),
        reason="contract_drift_blocked",
        created_at=utc_now_iso(),
        agent_action="Fix breaking field removal",
    )
    exc = FuseTrip(trip)
    payload = exc.to_response_dict()
    assert payload["error"] == "contract_drift_blocked"
    assert payload["agentAction"] == "Fix breaking field removal"


def test_cp32_loop_trip_response_uses_reason_error():
    trip = Trip(trip_id=new_trip_id(), reason="loop_detected", created_at=utc_now_iso())
    exc = FuseTrip(trip)
    payload = exc.to_response_dict()
    assert payload["error"] == "loop_detected"
    assert "agentAction" not in payload
