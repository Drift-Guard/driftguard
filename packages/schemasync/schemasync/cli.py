from __future__ import annotations

import argparse
import sys
from pathlib import Path

from schemasync.lint_nl import lint_literal, lint_semantic_hints
from schemasync.synonyms import load_synonyms


def _read_prompt(args: argparse.Namespace) -> str:
    if args.prompt:
        return args.prompt
    if args.prompt_file:
        return Path(args.prompt_file).read_text(encoding="utf-8")
    return sys.stdin.read()


def _cmd_lint_nl(args: argparse.Namespace) -> int:
    prompt = _read_prompt(args)
    removed = [s.strip() for s in args.removed.split(",") if s.strip()]
    synonyms = load_synonyms(Path(args.synonyms)) if args.synonyms else {}

    if args.mode == "semantic-hints":
        findings = lint_semantic_hints(prompt, removed)
        for finding in findings:
            print(f"HINT: {finding.message}")
        return 0

    findings = lint_literal(prompt, removed, synonyms)
    for finding in findings:
        print(f"ERROR: {finding.message}")
    if findings and not args.advisory:
        return 1
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="schemasync")
    sub = parser.add_subparsers(dest="command", required=True)

    lint_nl = sub.add_parser("lint-nl", help="Natural-language literal reference lint")
    lint_nl.add_argument("--mode", choices=["literal", "semantic-hints"], default="literal")
    lint_nl.add_argument("--prompt", help="Prompt text")
    lint_nl.add_argument("--prompt-file", help="Path to prompt text file")
    lint_nl.add_argument("--removed", required=True, help="Comma-separated removed field names")
    lint_nl.add_argument("--synonyms", help="Path to schemasync.synonyms.yaml")
    lint_nl.add_argument("--advisory", action="store_true", help="Report findings but exit 0")
    lint_nl.set_defaults(func=_cmd_lint_nl)

    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
