from fuseguard.otel_export import trip_to_cef, trip_to_otel_span


def test_trip_to_otel_span_maps_reason_and_ids():
    span = trip_to_otel_span(
        {"tripId": "fg_abc123", "reason": "policy_denied", "toolName": "delete_file"},
    )
    assert span["name"] == "fuseguard.trip.policy_denied"
    assert span["attributes"]["trip.id"] == "fg_abc123"
    assert span["attributes"]["trip.tool"] == "delete_file"


def test_trip_to_cef_includes_reason_and_trip_id():
    line = trip_to_cef({"tripId": "fg_abc123", "reason": "loop_detected", "toolName": "search"})
    assert line.startswith("CEF:0|DriftGuard|FuseGuard|1|loop_detected|")
    assert "tripId=fg_abc123" in line
    assert "tool=search" in line
