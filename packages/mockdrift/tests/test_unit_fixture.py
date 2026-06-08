from __future__ import annotations

from pathlib import Path

import pytest

from mockdrift.config import load_config, resolve_fixture_config
from mockdrift.fixture import load_fixture
from mockdrift.session import MisconfigurationError


def test_load_fixture_reads_schemas_and_mocks(pkg_root: Path):
    config = load_config(pkg_root)
    cfg = resolve_fixture_config(config, "no-drift-two-step")
    fixture = load_fixture(cfg)
    assert "stripe_create_refund" in fixture.mock_responses
    assert "tools" in fixture.before_schema
    assert fixture.match == "first_call"


def test_load_fixture_missing_schema_files_raises(tmp_path: Path, pkg_root: Path):
    fixture_dir = tmp_path / "empty-fixture"
    fixture_dir.mkdir()
    cfg = resolve_fixture_config(load_config(pkg_root), str(fixture_dir))
    with pytest.raises(MisconfigurationError, match="Missing fixture file"):
        load_fixture(cfg)


def test_load_fixture_invalid_json_raises(tmp_path: Path, pkg_root: Path):
    bad = tmp_path / "bad-fixture"
    bad.mkdir()
    (bad / "before.schema.json").write_text("{", encoding="utf-8")
    (bad / "after.schema.json").write_text("{}", encoding="utf-8")
    cfg = resolve_fixture_config(load_config(pkg_root), str(bad))
    with pytest.raises(MisconfigurationError, match="Invalid JSON"):
        load_fixture(cfg)
