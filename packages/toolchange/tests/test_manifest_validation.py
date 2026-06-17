"""Manifest structural validation (E3 hardening)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from toolchange.manifest import load_manifest

PKG = Path(__file__).resolve().parents[1]
FIXTURES = PKG / "fixtures"


def _write_manifest(tmp: Path, payload: dict) -> Path:
    path = tmp / "tools.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path


def test_rejects_duplicate_tool_names(tmp_path: Path) -> None:
    path = _write_manifest(
        tmp_path,
        {
            "apiVersion": "toolchange.dev/v1",
            "generated_at": "2026-01-01T00:00:00Z",
            "tools": [
                {"name": "search", "inputSchema": {"type": "object"}, "scope": "read"},
                {"name": "search", "inputSchema": {"type": "object"}, "scope": "read"},
            ],
        },
    )
    with pytest.raises(ValueError, match="Duplicate tool name"):
        load_manifest(path)


def test_rejects_invalid_scope(tmp_path: Path) -> None:
    path = _write_manifest(
        tmp_path,
        {
            "apiVersion": "toolchange.dev/v1",
            "generated_at": "2026-01-01T00:00:00Z",
            "tools": [
                {"name": "search", "inputSchema": {"type": "object"}, "scope": "admin"},
            ],
        },
    )
    with pytest.raises(ValueError, match="Invalid scope"):
        load_manifest(path)


def test_rejects_non_object_input_schema(tmp_path: Path) -> None:
    path = _write_manifest(
        tmp_path,
        {
            "apiVersion": "toolchange.dev/v1",
            "generated_at": "2026-01-01T00:00:00Z",
            "tools": [
                {"name": "search", "inputSchema": "not-an-object", "scope": "read"},
            ],
        },
    )
    with pytest.raises(ValueError, match="inputSchema"):
        load_manifest(path)


def test_accepts_valid_fixture_manifest() -> None:
    load_manifest(FIXTURES / "lint-pass" / "tools.json")
