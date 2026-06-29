from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class SchemaValidateResult:
    ok: bool
    errors: list[str]
    normalized: dict[str, Any] | None = None


def _check_type(expected: str, value: Any) -> bool:
    if expected == "string":
        return isinstance(value, str)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "boolean":
        return isinstance(value, bool)
    if expected == "array":
        return isinstance(value, list)
    if expected == "object":
        return isinstance(value, dict)
    return True


def validate_against_schema(payload: dict[str, Any], schema: dict[str, Any]) -> SchemaValidateResult:
    errors: list[str] = []
    if schema.get("type") == "object":
        required = schema.get("required") or []
        for key in required:
            if key not in payload:
                errors.append(f"missing required field: {key}")
        props = schema.get("properties") or {}
        for key, spec in props.items():
            if key not in payload:
                continue
            val = payload[key]
            if isinstance(spec, dict) and "type" in spec and not _check_type(spec["type"], val):
                errors.append(f"field {key}: expected {spec['type']}")
    return SchemaValidateResult(ok=not errors, errors=errors, normalized=payload if not errors else None)


def validate_tool_args(profile: dict[str, Any], args: dict[str, Any]) -> SchemaValidateResult:
    schema = profile.get("schema") or {}
    return validate_against_schema(args, schema)
