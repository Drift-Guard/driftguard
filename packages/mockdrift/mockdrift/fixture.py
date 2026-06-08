from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from mockdrift.config import FixtureConfig
from mockdrift.session import MisconfigurationError


@dataclass(frozen=True)
class LoadedFixture:
    name: str
    root: Path
    before_schema: dict[str, Any]
    after_schema: dict[str, Any]
    sample_error: dict[str, Any] | None
    mock_responses: dict[str, Any]
    metadata: dict[str, Any]
    expect: dict[str, Any]
    inputs: dict[str, Any]
    drift_target: str | None
    match: str
    failure_profile: str | None


def _read_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise MisconfigurationError(f"Missing fixture file: {path}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise MisconfigurationError(f"Invalid JSON in {path}: {exc}") from exc


def _load_mock_responses(fixture_root: Path) -> dict[str, Any]:
    responses_dir = fixture_root / "mock-responses"
    if not responses_dir.is_dir():
        return {}
    out: dict[str, Any] = {}
    for path in sorted(responses_dir.glob("*.json")):
        out[path.stem] = _read_json(path)
    return out


def load_fixture(cfg: FixtureConfig, *, defaults: dict[str, Any] | None = None) -> LoadedFixture:
    root = cfg.path
    if not root.is_dir():
        raise MisconfigurationError(f"Fixture directory not found: {root}")

    expect_path = root / "expect.json"
    expect: dict[str, Any] = dict(cfg.expect)
    if expect_path.is_file():
        expect = {**_read_json(expect_path), **expect}

    inputs_path = root / "inputs.json"
    inputs = _read_json(inputs_path) if inputs_path.is_file() else {}

    sample_path = root / "sample-422.json"
    sample_error = _read_json(sample_path) if sample_path.is_file() else None

    metadata_path = root / "metadata.json"
    metadata = _read_json(metadata_path) if metadata_path.is_file() else {}

    failure_profile = cfg.failure_profile or (defaults or {}).get("failure_profile")

    return LoadedFixture(
        name=cfg.name,
        root=root,
        before_schema=_read_json(root / "before.schema.json"),
        after_schema=_read_json(root / "after.schema.json"),
        sample_error=sample_error,
        mock_responses=_load_mock_responses(root),
        metadata=metadata,
        expect=expect,
        inputs=inputs,
        drift_target=cfg.drift_target,
        match=cfg.match,
        failure_profile=failure_profile,
    )
