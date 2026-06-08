from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from toolchange.manifest import ToolManifest


@dataclass(frozen=True)
class LintFinding:
    code: str
    message: str
    tool: str | None = None
    severity: str = "error"


def _tool_map(manifest: ToolManifest) -> dict[str, dict[str, Any]]:
    return {t.name: t.input_schema for t in manifest.tools}


def _breaking_schema_changes(before: dict[str, Any], after: dict[str, Any], path: str = "") -> list[str]:
    findings: list[str] = []
    if before == after:
        return findings
    if isinstance(before, dict) and isinstance(after, dict):
        for key, val in before.items():
            child = f"{path}.{key}" if path else key
            if key not in after:
                findings.append(f"Removed field {child}")
            else:
                findings.extend(_breaking_schema_changes(val, after[key], child))
        for key in after:
            if key not in before:
                child = f"{path}.{key}" if path else key
                req = after.get("required")
                if key == "required" and isinstance(req, list):
                    findings.append(f"Required field added: {', '.join(str(x) for x in req)}")
                elif child.endswith(".required") or ".required." in child:
                    findings.append(f"Required constraint changed at {child}")
                else:
                    findings.append(f"Added field {child}")
        return findings
    if before != after and path:
        findings.append(f"Type or value changed at {path}")
    return findings


def check_schema_diff(current: ToolManifest, baseline: ToolManifest) -> list[LintFinding]:
    findings: list[LintFinding] = []
    cur = _tool_map(current)
    base = _tool_map(baseline)

    for name in sorted(set(cur) | set(base)):
        if name not in base:
            findings.append(LintFinding("tool_added", f"New tool `{name}`", tool=name, severity="warning"))
            continue
        if name not in cur:
            findings.append(LintFinding("tool_removed", f"Removed tool `{name}`", tool=name))
            continue
        for msg in _breaking_schema_changes(base[name], cur[name], f"{name}.inputSchema"):
            findings.append(LintFinding("schema_breaking", msg, tool=name))

    return findings
