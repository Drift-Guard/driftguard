from __future__ import annotations

from pathlib import Path

import pytest

from mockdrift.init_cmd import run_init


def test_init_langgraph_writes_harness_bundle(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.chdir(tmp_path)
    code = run_init(["--runner", "langgraph", "--fixture", "stripe/required-field"])
    assert code == 0
    assert (tmp_path / ".driftguard" / "gates.yaml").is_file()
    assert (tmp_path / ".driftguard" / "harness.lock").is_file()
    assert (tmp_path / ".mockdrift.toml").is_file()
    assert (tmp_path / "agents" / "billing" / "refund_graph.py").is_file()
    assert (tmp_path / "tests" / "harness" / "test_drift.py").is_file()
    harness = (tmp_path / "tests" / "harness" / "test_drift.py").read_text(encoding="utf-8")
    assert "refund_graph" in harness
    assert "bubble_to_orchestrator" in harness


def test_init_crewai_writes_crew_scaffold(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.chdir(tmp_path)
    code = run_init(["--runner", "crewai", "--fixture", "stripe/required-field"])
    assert code == 0
    assert (tmp_path / "agents" / "crewai" / "refund_crew.py").is_file()
    harness = (tmp_path / "tests" / "harness" / "test_drift.py").read_text(encoding="utf-8")
    assert "refund_crew" in harness


def test_init_rejects_hosted_only_fixture(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.chdir(tmp_path)
    code = run_init(["--fixture", "openai/chat-completions-tool-required"])
    assert code == 2
    assert not (tmp_path / ".mockdrift.toml").exists()


def test_init_skips_existing_without_force(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.chdir(tmp_path)
    assert run_init(["--fixture", "stripe/required-field"]) == 0
    assert run_init(["--fixture", "stripe/required-field"]) == 2
