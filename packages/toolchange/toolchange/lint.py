from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from toolchange.checks import (
    check_injection_patterns,
    check_schema_diff,
    check_stale_manifest,
    check_write_scope,
)
from toolchange.checks.schema_diff import LintFinding
from toolchange.manifest import load_manifest


@dataclass(frozen=True)
class LintResult:
    findings: tuple[LintFinding, ...]
    advisory: bool = False

    @property
    def exit_code(self) -> int:
        if self.advisory:
            return 0
        return 1 if any(f.severity == "error" for f in self.findings) else 0


def run_lint(
    manifest_path: Path,
    baseline_path: Path,
    *,
    advisory: bool = False,
    repo_root: Path | None = None,
) -> LintResult:
    current = load_manifest(manifest_path)
    baseline = load_manifest(baseline_path)
    findings: list[LintFinding] = []
    findings.extend(check_schema_diff(current, baseline))
    findings.extend(check_stale_manifest(current, repo_root))
    findings.extend(check_injection_patterns(current))
    findings.extend(check_write_scope(current))
    return LintResult(findings=tuple(findings), advisory=advisory)
