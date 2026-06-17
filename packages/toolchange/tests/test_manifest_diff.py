"""Manifest-vs-baseline diff behavior (schema + tool lifecycle)."""

from __future__ import annotations

from toolchange.checks.schema_diff import check_schema_diff
from toolchange.lint import run_lint
from toolchange.manifest import ToolEntry, ToolManifest

PKG = __import__("pathlib").Path(__file__).resolve().parents[1]
FIXTURES = PKG / "fixtures"


def _manifest(*schemas: tuple[str, dict]) -> ToolManifest:
    return ToolManifest(
        api_version="toolchange.dev/v1",
        generated_at="2026-01-01T00:00:00Z",
        tools=tuple(
            ToolEntry(
                name=name,
                input_schema=schema,
                scope="read",
                source="tools.py",
                source_hash="abc",
            )
            for name, schema in schemas
        ),
    )


def test_tool_removed_is_breaking_error() -> None:
    baseline = _manifest(("search", {"type": "object", "properties": {}}))
    current = _manifest()
    findings = check_schema_diff(current, baseline)
    assert any(f.code == "tool_removed" and f.severity == "error" for f in findings)


def test_tool_added_is_warning_only() -> None:
    baseline = _manifest()
    current = _manifest(("new_tool", {"type": "object", "properties": {}}))
    findings = check_schema_diff(current, baseline)
    assert any(f.code == "tool_added" and f.severity == "warning" for f in findings)
    assert not any(f.severity == "error" for f in findings)


def test_removed_schema_field_is_breaking() -> None:
    baseline = _manifest(
        (
            "search",
            {
                "type": "object",
                "properties": {"q": {"type": "string"}, "limit": {"type": "integer"}},
            },
        )
    )
    current = _manifest(
        (
            "search",
            {"type": "object", "properties": {"q": {"type": "string"}}},
        )
    )
    findings = check_schema_diff(current, baseline)
    joined = " ".join(f.message for f in findings)
    assert "Removed field" in joined


def test_advisory_mode_exits_zero_on_breaking(tmp_path_factory) -> None:
    result = run_lint(
        FIXTURES / "breaking-required" / "tools.json",
        FIXTURES / "breaking-required" / "baseline.json",
        advisory=True,
    )
    assert result.exit_code == 0
    assert any(f.severity == "error" for f in result.findings)
