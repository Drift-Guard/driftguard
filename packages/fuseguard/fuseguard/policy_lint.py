from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fuseguard.policy_bundle import PolicyBundle, PolicyBundleError


LINT_CODES = {
    "missing_version": "Policy bundle must include version: 1",
    "invalid_rules": "rules must be a list of objects with id and action",
    "invalid_assignments": "assignments must reference existing rule ids",
}


def lint_policy_path(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        bundle = PolicyBundle.load_path(path)
    except PolicyBundleError as exc:
        return [str(exc)]
    except (OSError, json.JSONDecodeError) as exc:
        return [f"read error: {exc}"]

    for assignment in bundle.assignments:
        for rid in assignment.rule_ids:
            if rid not in bundle.rules:
                errors.append(f"{LINT_CODES['invalid_assignments']}: {rid}")
    if not bundle.bundle_version:
        errors.append(LINT_CODES["missing_version"])
    return errors


def lint_policy_dict(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    try:
        bundle = PolicyBundle.from_dict(data)
    except PolicyBundleError as exc:
        return [str(exc)]
    for assignment in bundle.assignments:
        for rid in assignment.rule_ids:
            if rid not in bundle.rules:
                errors.append(f"{LINT_CODES['invalid_assignments']}: {rid}")
    return errors
