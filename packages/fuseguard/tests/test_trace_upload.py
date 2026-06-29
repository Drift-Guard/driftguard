"""FG-P-030..033 — trace upload sanitization and size cap."""

from __future__ import annotations

import json

from fuseguard.local_store import LocalStore
from fuseguard.trace_upload import (
    MAX_TRACE_PAYLOAD_BYTES,
    build_trace_upload_payload,
    sanitize_trip_for_upload,
    trim_trips_to_size_cap,
)


def test_fg_p_033_sanitize_strips_metadata_and_args():
    trip = sanitize_trip_for_upload(
        {
            "tripId": "fg_abc",
            "reason": "policy_denied",
            "createdAt": "2026-06-01T12:00:00.000Z",
            "metadata": {"args": {"token": "secret"}},
            "calls": [{"step": 1, "tool": "t", "argsHash": "abcd", "args": {"x": 1}}],
        }
    )
    assert trip is not None
    assert "metadata" not in trip
    assert "args" not in trip["calls"][0]


def test_fg_p_032_trim_trips_to_size_cap():
    huge = [
        {
            "tripId": f"fg_{i}",
            "reason": "loop_detected",
            "createdAt": "2026-06-01T12:00:00.000Z",
            "calls": [{"step": 1, "tool": "search", "argsHash": "a" * 200}],
        }
        for i in range(500)
    ]
    trimmed = trim_trips_to_size_cap(huge, max_bytes=4096)
    payload = json.dumps({"trips": trimmed}).encode("utf-8")
    assert len(payload) <= 4096
    assert len(trimmed) < len(huge)


def test_fg_p_030_build_trace_upload_payload(tmp_path):
    store = LocalStore.open(tmp_path / "trips.db")
    store.insert_trip(
        {
            "tripId": "fg_test1",
            "reason": "budget_exceeded",
            "createdAt": "2026-06-02T10:00:00.000Z",
            "metadata": {"note": "local only"},
        }
    )
    trips, size = build_trace_upload_payload(store, "2026-06-01T00:00:00+00:00")
    assert len(trips) == 1
    assert size <= MAX_TRACE_PAYLOAD_BYTES
    assert "metadata" not in trips[0]
