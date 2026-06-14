from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from mockdrift.session import MisconfigurationError

MARKETPLACE_ID = re.compile(r"^[a-z0-9][a-z0-9-]*/[a-z0-9][a-z0-9-]*$")


@dataclass(frozen=True)
class MarketplaceEntry:
    id: str
    version: str
    path: Path | None
    mockdrift_key: str | None
    ref: str | None
    drift_target: str | None
    match: str | None
    failure_profile: str | None
    description: str | None


def _fixtures_root(package_root: Path) -> Path:
    return package_root / "fixtures"


def load_marketplace_index(package_root: Path | None = None) -> dict[str, MarketplaceEntry]:
    root = package_root or _discover_package_root()
    index_path = _fixtures_root(root) / "index.yaml"
    if not index_path.is_file():
        return {}

    raw = yaml.safe_load(index_path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise MisconfigurationError(f"Invalid marketplace index: {index_path}")

    entries: dict[str, MarketplaceEntry] = {}
    fixtures = raw.get("fixtures", {})
    if not isinstance(fixtures, dict):
        return entries

    for key, value in fixtures.items():
        if not isinstance(value, dict):
            continue
        if not MARKETPLACE_ID.match(key):
            continue
        rel = value.get("path")
        path = (_fixtures_root(root) / str(rel)).resolve() if rel else None
        if path and not path.is_dir():
            path = None
        entries[key] = MarketplaceEntry(
            id=key,
            version=str(value.get("version", "1.0.0")),
            path=path,
            mockdrift_key=value.get("mockdrift_key"),
            ref=value.get("ref"),
            drift_target=value.get("drift_target"),
            match=value.get("match"),
            failure_profile=value.get("failure_profile"),
            description=value.get("description"),
        )
    return entries


def resolve_marketplace_id(fixture_key: str, package_root: Path | None = None) -> str | None:
    """Return mockdrift.toml fixture key for vendor/scenario id, or None."""
    if "/" not in fixture_key or not MARKETPLACE_ID.match(fixture_key):
        return None
    entry = load_marketplace_index(package_root).get(fixture_key)
    if entry is None:
        return None
    if entry.mockdrift_key:
        return entry.mockdrift_key
    if entry.path and entry.path.is_dir():
        return entry.path.name
    if entry.ref:
        raise MisconfigurationError(
            f"Fixture '{fixture_key}' is hosted-catalog only ({entry.ref}). "
            "Use driftguard.org hosted trial for catalog install."
        )
    raise MisconfigurationError(f"Marketplace entry '{fixture_key}' has no local path or mockdrift_key")


def marketplace_entry_for_key(fixture_key: str, package_root: Path | None = None) -> MarketplaceEntry | None:
    index = load_marketplace_index(package_root)
    if fixture_key in index:
        return index[fixture_key]
    for entry in index.values():
        if entry.mockdrift_key == fixture_key:
            return entry
    return None


def marketplace_fixture_config(
    fixture_key: str,
    package_root: Path | None = None,
) -> MarketplaceEntry | None:
    if "/" not in fixture_key or not MARKETPLACE_ID.match(fixture_key):
        return None
    entry = load_marketplace_index(package_root).get(fixture_key)
    if entry is None:
        return None
    if entry.ref and not entry.path:
        raise MisconfigurationError(
            f"Fixture '{fixture_key}' is hosted-catalog only ({entry.ref}). "
            "See https://driftguard.org/start for hosted fixture catalog."
        )
    return entry


def _discover_package_root() -> Path:
    here = Path(__file__).resolve().parent
    candidate = here.parent
    if (candidate / "fixtures").is_dir():
        return candidate
    raise MisconfigurationError("Could not locate mockdrift fixtures root")
