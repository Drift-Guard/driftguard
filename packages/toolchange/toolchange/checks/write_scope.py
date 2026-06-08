from __future__ import annotations

from toolchange.checks.schema_diff import LintFinding
from toolchange.manifest import ToolManifest


def check_write_scope(manifest: ToolManifest) -> list[LintFinding]:
    findings: list[LintFinding] = []
    for tool in manifest.tools:
        if tool.scope != "write":
            continue
        props = tool.input_schema.get("properties") if isinstance(tool.input_schema, dict) else None
        if not props:
            findings.append(
                LintFinding(
                    "write_scope",
                    f"Write tool `{tool.name}` must declare inputSchema.properties",
                    tool=tool.name,
                )
            )
    for tool in manifest.tools:
        name_lower = tool.name.lower()
        looks_write = any(token in name_lower for token in ("create", "delete", "update", "refund", "charge"))
        if looks_write and tool.scope != "write":
            findings.append(
                LintFinding(
                    "write_scope",
                    f"Tool `{tool.name}` appears mutating but scope is `{tool.scope}` (expected write)",
                    tool=tool.name,
                )
            )
    return findings
