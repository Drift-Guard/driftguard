"""Optional OTel span export from daemon trips (FG-S16)."""

from __future__ import annotations

from typing import Any


def trip_to_otel_span(trip: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": f"fuseguard.trip.{trip.get('reason', 'unknown')}",
        "attributes": {
            "trip.id": trip.get("tripId"),
            "trip.reason": trip.get("reason"),
            "trip.tool": trip.get("toolName"),
        },
    }


def trip_to_cef(trip: dict[str, Any]) -> str:
    return (
        f"CEF:0|DriftGuard|FuseGuard|1|{trip.get('reason')}|"
        f"tripId={trip.get('tripId')} tool={trip.get('toolName')}"
    )
