from __future__ import annotations

import json
from typing import Any

from fuseguard.local_store import LocalStore

MAX_TRACE_PAYLOAD_BYTES = 256 * 1024


def sanitize_trip_for_upload(raw: dict[str, Any]) -> dict[str, Any] | None:
    trip_id = raw.get("tripId")
    reason = raw.get("reason")
    created_at = raw.get("createdAt")
    if not isinstance(trip_id, str) or not isinstance(reason, str) or not isinstance(created_at, str):
        return None

    trip: dict[str, Any] = {"tripId": trip_id, "reason": reason, "createdAt": created_at}
    for key in (
        "toolName",
        "watchId",
        "deviceId",
        "agentId",
        "runId",
        "parentRunId",
        "environment",
        "policyBundleVersion",
    ):
        val = raw.get(key)
        if isinstance(val, str) and val:
            trip[key] = val
    rule_ids = raw.get("policyRuleIds")
    if isinstance(rule_ids, list):
        trip["policyRuleIds"] = [str(r) for r in rule_ids if r]
    eval_trace = raw.get("evalTrace")
    if isinstance(eval_trace, list):
        trip["evalTrace"] = eval_trace

    calls = raw.get("calls")
    if isinstance(calls, list):
        sanitized_calls: list[dict[str, Any]] = []
        for item in calls:
            if not isinstance(item, dict):
                continue
            tool = item.get("tool")
            args_hash = item.get("argsHash")
            if not isinstance(tool, str) or not isinstance(args_hash, str):
                continue
            call: dict[str, Any] = {
                "step": int(item.get("step", 0)),
                "tool": tool,
                "argsHash": args_hash,
            }
            status = item.get("statusCode")
            if isinstance(status, int):
                call["statusCode"] = status
            err = item.get("errorClass")
            if isinstance(err, str):
                call["errorClass"] = err
            sanitized_calls.append(call)
        if sanitized_calls:
            trip["calls"] = sanitized_calls
    return trip


def build_trace_upload_payload(store: LocalStore, since_iso: str) -> tuple[list[dict[str, Any]], int]:
    trips: list[dict[str, Any]] = []
    for row in store.export_trips_since(since_iso):
        if not isinstance(row, dict):
            continue
        sanitized = sanitize_trip_for_upload(row)
        if sanitized:
            trips.append(sanitized)
    payload = json.dumps({"trips": trips}).encode("utf-8")
    return trips, len(payload)


def trim_trips_to_size_cap(trips: list[dict[str, Any]], max_bytes: int = MAX_TRACE_PAYLOAD_BYTES) -> list[dict[str, Any]]:
    kept: list[dict[str, Any]] = []
    for trip in trips:
        candidate = kept + [trip]
        if len(json.dumps({"trips": candidate}).encode("utf-8")) > max_bytes:
            break
        kept = candidate
    return kept
