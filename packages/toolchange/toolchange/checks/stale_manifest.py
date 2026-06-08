from __future__ import annotations

from pathlib import Path

from toolchange.checks.schema_diff import LintFinding
from toolchange.manifest import ToolManifest, source_hash


def check_stale_manifest(manifest: ToolManifest, repo_root: Path | None = None) -> list[LintFinding]:
    findings: list[LintFinding] = []
    root = repo_root or Path.cwd()
    for tool in manifest.tools:
        if not tool.source_hash:
            continue
        src = root / tool.source
        if not src.is_file():
            findings.append(
                LintFinding(
                    "stale_manifest",
                    f"Source missing for `{tool.name}` — run `toolchange export`",
                    tool=tool.name,
                )
            )
            continue
        actual = source_hash(src.read_text(encoding="utf-8"))
        if actual != tool.source_hash:
            findings.append(
                LintFinding(
                    "stale_manifest",
                    f"Manifest stale for `{tool.name}` (source hash mismatch) — run `toolchange export`",
                    tool=tool.name,
                )
            )
    return findings
