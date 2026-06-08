"""Reference tests — three failure profiles + proxy smoke (R3-1 scope)."""

import os
from pathlib import Path

import pytest

from mockdrift import drift_replay

os.environ.setdefault("MOCKDRIFT_ROOT", str(Path(__file__).resolve().parents[1]))

pytestmark = pytest.mark.mockdrift


@drift_replay(fixture="stripe-required-field", entry="agents.billing.refund_graph:refund_graph")
def test_refund_bubbles(mockdrift_session):
    mockdrift_session.run()


@drift_replay(
    fixture="mcp-tool-removed",
    entry="agents.billing.refund_graph:refund_graph",
    failure_profile="halt_clean",
)
def test_support_halts(mockdrift_session):
    mockdrift_session.run()


@drift_replay(
    fixture="stripe-required-field",
    entry="agents.billing.refund_graph:refund_graph",
    failure_profile="fallback_state",
)
def test_billing_fallback(mockdrift_session):
    mockdrift_session.run()


@drift_replay(
    fixture="stripe-required-field",
    runner="custom",
    entry="mockdrift.golden.refund_proxy_smoke:run",
    assert_profiles=False,
)
def test_refund_proxy_smoke(mockdrift_session):
    mockdrift_session.run()
