from __future__ import annotations

import json
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

TripReason = Literal["loop_detected", "budget_exceeded", "contract_drift_blocked"]


@dataclass
class CallRecord:
    step: int
    tool: str
    args_hash: str
    status_code: int | None = None
    error_class: str | None = None


@dataclass
class Trip:
    trip_id: str
    reason: TripReason
    created_at: str
    tool_name: str | None = None
    watch_id: str | None = None
    calls: list[CallRecord] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    agent_action: str | None = None

    def primary_agent_action(self) -> str | None:
        if self.agent_action:
            return self.agent_action
        actions = self.metadata.get("agentActions")
        if isinstance(actions, list) and actions:
            first = actions[0]
            return str(first) if first else None
        blocked = self.metadata.get("blocked")
        if isinstance(blocked, list):
            for item in blocked:
                if isinstance(item, dict):
                    for action in item.get("agentActions") or []:
                        if isinstance(action, str) and action:
                            return action
        return None

    def to_blocked_response(self) -> dict[str, Any]:
        """Structured halt payload for orchestrators (CP-3.2)."""
        agent_action = self.primary_agent_action()
        payload: dict[str, Any] = {
            "error": "contract_drift_blocked",
            "tripId": self.trip_id,
            "reason": self.reason,
            "watchId": self.watch_id,
            "trip": self.to_log_dict(),
        }
        if agent_action:
            payload["agentAction"] = agent_action
        actions = self.metadata.get("agentActions")
        if isinstance(actions, list) and actions:
            payload["agentActions"] = actions
        blocked = self.metadata.get("blocked")
        if isinstance(blocked, list) and blocked:
            payload["blocked"] = blocked
        return payload

    def to_log_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "tripId": self.trip_id,
            "reason": self.reason,
            "createdAt": self.created_at,
            "toolName": self.tool_name,
            "watchId": self.watch_id,
            "calls": [
                {
                    "step": c.step,
                    "tool": c.tool,
                    "argsHash": c.args_hash,
                    "statusCode": c.status_code,
                    "errorClass": c.error_class,
                }
                for c in self.calls
            ],
            "metadata": self.metadata,
        }
        if self.agent_action:
            payload["agentAction"] = self.agent_action
        return payload


class FuseTrip(Exception):
    """Raised when the fuse trips and execution must halt."""

    def __init__(self, trip: Trip) -> None:
        self.trip = trip
        super().__init__(f"FuseGuard tripped: {trip.reason} ({trip.trip_id})")

    def to_response_dict(self) -> dict[str, Any]:
        if self.trip.reason == "contract_drift_blocked":
            return self.trip.to_blocked_response()
        agent_action = self.trip.primary_agent_action()
        payload: dict[str, Any] = {
            "error": self.trip.reason,
            "tripId": self.trip.trip_id,
            "trip": self.trip.to_log_dict(),
        }
        if agent_action:
            payload["agentAction"] = agent_action
        return payload


def new_trip_id() -> str:
    return f"fg_{uuid.uuid4().hex[:12]}"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def write_trip_log(path: str | Path, trip: Trip) -> dict[str, Any]:
    payload = trip.to_log_dict()
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return payload
