from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class LintFinding:
    code: str
    message: str


def _word_in_text(word: str, text: str) -> bool:
    return bool(re.search(rf"\b{re.escape(word)}\b", text, re.IGNORECASE))


def lint_literal(
    prompt: str,
    removed_fields: list[str],
    synonyms: dict[str, list[str]] | None = None,
) -> list[LintFinding]:
    findings: list[LintFinding] = []
    removed = {f.strip() for f in removed_fields if f.strip()}

    for field in sorted(removed):
        if _word_in_text(field, prompt):
            findings.append(
                LintFinding(
                    code="literal.field_removed",
                    message=f"Prompt references removed field '{field}'",
                )
            )

    if synonyms:
        for canonical, aliases in synonyms.items():
            if canonical not in removed:
                continue
            for alias in aliases:
                if _word_in_text(alias, prompt):
                    findings.append(
                        LintFinding(
                            code="literal.synonym_match",
                            message=f"Prompt references synonym '{alias}' for removed field '{canonical}'",
                        )
                    )

    return findings


def lint_semantic_hints(
    prompt: str,
    removed_fields: list[str],
) -> list[LintFinding]:
    """Advisory hints only — never used to fail CI in Gate 4 alpha."""
    hints: list[LintFinding] = []
    for field in removed_fields:
        if field.lower() in prompt.lower():
            hints.append(
                LintFinding(
                    code="semantic.hint",
                    message=f"Possible semantic reference to removed field '{field}'",
                )
            )
    return hints
