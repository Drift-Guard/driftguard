from __future__ import annotations

from mockdrift.ledger import SideEffectLedger


def test_ledger_counts_duplicate_side_effects():
    ledger = SideEffectLedger(side_effect_tools={"stripe_create_refund"})
    first = ledger.record("stripe_create_refund", "hash1", idempotency_key=None)
    second = ledger.record("stripe_create_refund", "hash1", idempotency_key=None)
    assert first == 1
    assert second == 2
    assert ledger.max_duplicates() == 2


def test_ledger_ignores_non_side_effect_tools():
    ledger = SideEffectLedger(side_effect_tools={"write_tool"})
    assert ledger.record("read_tool", "h", idempotency_key=None) == 0
    assert ledger.max_duplicates() == 0


def test_ledger_requires_idempotency_key_when_configured():
    ledger = SideEffectLedger(
        side_effect_tools={"write_tool"},
        require_idempotency_key=True,
    )
    assert ledger.record("write_tool", "h", idempotency_key=None) == 1
