from __future__ import annotations

from pathlib import Path

import pytest

from mockdrift.config import load_config, resolve_fixture_config
from mockdrift.session import MisconfigurationError


def test_load_config_reads_fixtures(pkg_root: Path):
    config = load_config(pkg_root)
    assert "stripe-required-field" in config.fixtures
    assert config.fixtures["stripe-required-field"].drift_target == "stripe_create_refund"


def test_resolve_fixture_config_by_directory(tmp_path: Path):
    fixture_dir = tmp_path / "custom-fixture"
    fixture_dir.mkdir()
    (fixture_dir / "before.schema.json").write_text('{"tools":{}}', encoding="utf-8")
    (fixture_dir / "after.schema.json").write_text('{"tools":{}}', encoding="utf-8")
    config = load_config(Path(__file__).resolve().parents[1])
    resolved = resolve_fixture_config(config, str(fixture_dir))
    assert resolved.path == fixture_dir.resolve()


def test_resolve_unknown_fixture_raises():
    config = load_config(Path(__file__).resolve().parents[1])
    with pytest.raises(MisconfigurationError, match="Unknown fixture"):
        resolve_fixture_config(config, "does-not-exist")


def test_resolve_fixture_rejects_path_traversal(pkg_root: Path):
    config = load_config(pkg_root)
    with pytest.raises(MisconfigurationError, match="escapes mockdrift package root"):
        resolve_fixture_config(config, "../../../..")


def test_load_config_allows_shared_fixtures_from_examples(pkg_root: Path):
    config = load_config(pkg_root / "examples" / "reference_langgraph")
    assert config.fixtures["stripe-required-field"].path.is_dir()
