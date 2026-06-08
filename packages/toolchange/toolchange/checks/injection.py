from __future__ import annotations

import re

from toolchange.checks.schema_diff import LintFinding
from toolchange.manifest import ToolManifest

_INJECTION = re.compile(
    r"(?i)(ignore\s+(all\s+)?(previous|prior)\s+instructions|system\s+prompt|</?\s*script|`\s*rm\s+-rf)",
)


def check_injection_patterns(manifest: ToolManifest) -> list[LintFinding]:
    findings: list[LintFinding] = []
    for tool in manifest.tools:
        blob = str(tool.input_schema)
        if _INJECTION.search(blob):
            findings.append(
                LintFinding(
                    "injection_pattern",
                    f"Possible injection pattern in `{tool.name}` schema/description",
                    tool=tool.name,
                )
            )
    return findings
