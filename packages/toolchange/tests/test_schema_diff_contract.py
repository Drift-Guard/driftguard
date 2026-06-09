from __future__ import annotations

import json
from pathlib import Path

import pytest

from toolchange.checks.schema_diff import check_schema_diff
from toolchange.manifest import ToolEntry, ToolManifest

VECTORS = Path(__file__).resolve().parents[2] / "diff-core" / "contract" / "vectors.json"


@pytest.fixture(scope="module")
def tool_vectors() -> list[dict]:
    data = json.loads(VECTORS.read_text(encoding="utf-8"))
    return [v for v in data if v.get("kind") == "tool_manifest"]


def _manifest(schema: dict) -> ToolManifest:
    return ToolManifest(
        api_version="toolchange.dev/v1",
        generated_at="2026-01-01T00:00:00Z",
        tools=(
            ToolEntry(
                name="search",
                input_schema=schema,
                scope="read",
                source="tools.py",
                source_hash="abc",
            ),
        ),
    )


def test_arch_u01_tool_manifest_contract(tool_vectors: list[dict]) -> None:
    assert tool_vectors, "expected tool_manifest vectors in diff-core contract"
    for vector in tool_vectors:
        findings = check_schema_diff(_manifest(vector["current"]), _manifest(vector["baseline"]))
        assert findings, vector["id"]
        joined = " ".join(f.message for f in findings).lower()
        for needle in vector.get("expectBreakingMessages", []):
            assert needle.lower() in joined, f"{vector['id']}: missing {needle!r} in {joined}"
