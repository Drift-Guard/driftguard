from __future__ import annotations

from pathlib import Path

import pytest

from schemasync.lint_nl import lint_literal, lint_semantic_hints
from schemasync.synonyms import load_synonyms

PKG = Path(__file__).resolve().parents[1]
SYNONYMS = PKG / "schemasync.synonyms.yaml"


def test_ss_n01_literal_removed_field():
    """SS-N01: prompt mentions removed field billing_address."""
    findings = lint_literal(
        "Collect billing_address before charging the card.",
        ["billing_address"],
    )
    assert findings
    assert any("billing_address" in f.message for f in findings)


def test_ss_n02_paraphrase_without_synonyms_no_violation():
    """SS-N02: paraphrase only — no violation without synonyms map."""
    findings = lint_literal("Use the billing street from the profile.", ["billing_address"])
    assert findings == []


def test_ss_n03_synonym_maps_to_removed_field():
    """SS-N03: paraphrase + synonyms map triggers violation."""
    synonyms = load_synonyms(SYNONYMS)
    findings = lint_literal("Use the billing street from checkout.", ["billing_address"], synonyms)
    assert findings
    assert any("synonym" in f.code for f in findings)


def test_ss_n04_stripe_word_false_positive_documented():
    """SS-N04: prose word stripe still flags removed field stripe (known FP)."""
    findings = lint_literal("Route payment through stripe for this invoice.", ["stripe"])
    assert findings
    assert any("stripe" in f.message for f in findings)


def test_ss_n05_semantic_hints_never_exit_nonzero():
    """SS-N05: semantic-hints mode never exits non-zero."""
    from schemasync.cli import main

    code = main(
        [
            "lint-nl",
            "--mode",
            "semantic-hints",
            "--prompt",
            "Maybe billing_address is still required?",
            "--removed",
            "billing_address",
        ]
    )
    assert code == 0
    hints = lint_semantic_hints("Maybe billing_address is still required?", ["billing_address"])
    assert hints
