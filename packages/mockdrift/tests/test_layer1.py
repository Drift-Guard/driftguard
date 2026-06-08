"""Phase 1A Layer 1 tests — MD-L1-001 through MD-L1-010."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

from mockdrift import drift_replay
from mockdrift.config import load_config, resolve_fixture_config
from mockdrift.errors import DriftToolError, EgressBlockedError
from mockdrift.fixture import load_fixture
from mockdrift.proxy import ToolProxy, guard_egress
from mockdrift.session import MisconfigurationError, MockDriftSession

PKG_ROOT = Path(__file__).resolve().parents[1]


def _fixture(name: str):
    config = load_config(PKG_ROOT)
    cfg = resolve_fixture_config(config, name)
    return load_fixture(cfg, defaults=config.defaults)


def test_md_l1_001_variable_substitution_two_step():
    """MD-L1-001: uuid from step 1 reaches step 2."""
    fixture = _fixture("no-drift-two-step")
    proxy = ToolProxy(fixture=fixture)
    first = proxy.invoke(
        "stripe_create_refund",
        {"amount": 100, "currency": "usd", "billing_country": "US"},
    )
    second = proxy.invoke("stripe_confirm_refund", {"refund_id": first["id"]})
    assert second["id"] == first["id"]


def test_md_l1_002_egress_blocked_when_mock_enabled(monkeypatch):
    """MD-L1-002: MOCKDRIFT_MOCK=1 blocks real HTTPS."""
    monkeypatch.setenv("MOCKDRIFT_MOCK", "1")
    with pytest.raises(EgressBlockedError):
        guard_egress("https://api.stripe.com/v1/refunds")


def test_md_l1_003_egress_allowed_when_mock_disabled(monkeypatch):
    """MD-L1-003: MOCKDRIFT_MOCK=0 allows egress guard to pass."""
    monkeypatch.setenv("MOCKDRIFT_MOCK", "0")
    guard_egress("https://api.stripe.com/v1/refunds")


def test_md_l1_004_drift_only_on_first_call():
    """MD-L1-004: drift target fires only on first call."""
    fixture = _fixture("stripe-required-field")
    proxy = ToolProxy(fixture=fixture)
    with pytest.raises(DriftToolError):
        proxy.invoke(
            "stripe_create_refund",
            {"amount": 1, "currency": "usd", "billing_country": "US"},
        )
    second = proxy.invoke(
        "stripe_create_refund",
        {"amount": 2, "currency": "usd", "billing_country": "US"},
    )
    assert second["status"] == "pending"
    assert proxy.trace.drift_step == 1


def test_md_l1_005_idempotency_duplicate_side_effect_fails():
    """MD-L1-005: duplicate side-effect calls fail assertion."""
    fixture = _fixture("idempotency-violation")
    proxy = ToolProxy(fixture=fixture)
    args = {"amount": 1, "currency": "usd", "billing_country": "US"}
    proxy.invoke("stripe_create_refund", args)
    proxy.invoke("stripe_create_refund", args)
    assert proxy.trace.max_side_effect_duplicates == 2


def test_md_l1_006_loop_spiral_on_repeated_422():
    """MD-L1-006: same tool+args hash 4x with 422 triggers loop spiral."""
    config = load_config(PKG_ROOT)
    cfg = resolve_fixture_config(config, "loop-spiral")
    fixture = load_fixture(cfg, defaults=config.defaults)
    proxy = ToolProxy(fixture=fixture)
    args = {"amount": 1, "currency": "usd", "billing_country": "US"}
    for _ in range(4):
        try:
            proxy.invoke("stripe_create_refund", args)
        except DriftToolError:
            pass
    assert proxy.trace.loop_spiral is True


def test_md_l1_007_demo_cli_exit_zero():
    """MD-L1-007: mockdrift demo exits 0 with PASS summary."""
    result = subprocess.run(
        [sys.executable, "-m", "mockdrift.cli", "demo", "stripe-required-field"],
        cwd=PKG_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert "verdict: PASS" in result.stdout


def test_md_l1_008_demo_unknown_fixture_exit_two():
    """MD-L1-008: missing fixture exits 2 with clear message."""
    result = subprocess.run(
        [sys.executable, "-m", "mockdrift.cli", "demo", "unknown-fixture-xyz"],
        cwd=PKG_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 2
    assert "Unknown fixture" in result.stderr or "not found" in result.stderr.lower()


def test_md_l1_010_invalid_toml_exit_two(tmp_path: Path):
    """MD-L1-010: invalid toml raises MisconfigurationError."""
    bad = tmp_path / ".mockdrift.toml"
    bad.write_text("fixtures = [", encoding="utf-8")
    with pytest.raises(MisconfigurationError):
        load_config(tmp_path)


@drift_replay(
    fixture="stripe-required-field",
    runner="custom",
    entry="mockdrift.golden.refund_proxy_smoke:run",
    assert_profiles=False,
)
def test_md_l1_009_proxy_smoke(mockdrift_session: MockDriftSession):
    """MD-L1-009: proxy smoke via @drift_replay exits PASS."""
    mockdrift_session.run()
