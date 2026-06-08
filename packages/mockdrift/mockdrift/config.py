from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib

from mockdrift.session import MisconfigurationError


@dataclass(frozen=True)
class FixtureConfig:
    name: str
    path: Path
    drift_target: str | None = None
    match: str = "first_call"
    failure_profile: str | None = None
    expect: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class MockDriftConfig:
    root: Path
    defaults: dict[str, Any]
    fixtures: dict[str, FixtureConfig]


def _find_config_file(root: Path) -> Path | None:
    for candidate in (root / ".mockdrift.toml", root / "mockdrift.toml"):
        if candidate.is_file():
            return candidate
    return None


def load_config(root: Path | None = None) -> MockDriftConfig:
    base = (root or Path.cwd()).resolve()
    config_path = _find_config_file(base)
    if config_path is None:
        raise MisconfigurationError(f"No .mockdrift.toml found under {base}")

    try:
        raw = tomllib.loads(config_path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise MisconfigurationError(f"Invalid toml in {config_path}: {exc}") from exc

    defaults = dict(raw.get("defaults", {}))
    fixtures: dict[str, FixtureConfig] = {}
    config_dir = config_path.parent

    for key, value in raw.get("fixtures", {}).items():
        if not isinstance(value, dict):
            raise MisconfigurationError(f"[fixtures.{key}] must be a table")
        rel = value.get("path")
        if not rel:
            raise MisconfigurationError(f"[fixtures.{key}] missing path")
        fixture_path = (config_dir / str(rel)).resolve()
        expect = {k: v for k, v in value.items() if k.startswith("expect.") or k == "expect"}
        if "expect" in value and isinstance(value["expect"], dict):
            expect = value["expect"]
        fixtures[key] = FixtureConfig(
            name=key,
            path=fixture_path,
            drift_target=value.get("drift_target"),
            match=value.get("match", "first_call"),
            failure_profile=value.get("failure_profile"),
            expect=expect,
        )

    return MockDriftConfig(root=config_dir, defaults=defaults, fixtures=fixtures)


def resolve_fixture_config(config: MockDriftConfig, fixture_key: str) -> FixtureConfig:
    if fixture_key in config.fixtures:
        return config.fixtures[fixture_key]
    candidate = Path(fixture_key)
    if candidate.is_dir():
        return FixtureConfig(name=candidate.name, path=candidate.resolve())
    raise MisconfigurationError(f"Unknown fixture '{fixture_key}'")
