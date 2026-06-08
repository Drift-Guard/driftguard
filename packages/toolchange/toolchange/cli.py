from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from toolchange.lint import run_lint
from toolchange.manifest import API_VERSION, ToolEntry, ToolManifest, load_manifest, source_hash, write_manifest


def _cmd_export(args: argparse.Namespace) -> int:
    manifest_path = Path(args.manifest)
    if manifest_path.is_file():
        manifest = load_manifest(manifest_path)
        write_manifest(manifest_path, manifest)
        print(f"Refreshed {manifest_path}")
        return 0

    if not args.source.is_file():
        print(f"Source not found: {args.source}", file=sys.stderr)
        return 2

    text = args.source.read_text(encoding="utf-8")
    entry = ToolEntry(
        name=args.tool_name,
        input_schema=json.loads(args.schema_json),
        scope=args.scope,
        source=str(args.source),
        source_hash=source_hash(text),
    )
    manifest = ToolManifest(
        api_version=API_VERSION,
        generated_at=datetime.now(timezone.utc).isoformat(),
        tools=(entry,),
    )
    write_manifest(manifest_path, manifest)
    print(f"Wrote {manifest_path}")
    return 0


def _cmd_lint(args: argparse.Namespace) -> int:
    result = run_lint(
        Path(args.manifest),
        Path(args.baseline),
        advisory=args.advisory,
        repo_root=Path(args.repo_root) if args.repo_root else None,
    )
    for finding in result.findings:
        prefix = finding.severity.upper()
        tool = f" [{finding.tool}]" if finding.tool else ""
        print(f"{prefix}{tool}: {finding.message}")
    return result.exit_code


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="toolchange")
    sub = parser.add_subparsers(dest="command", required=True)

    export = sub.add_parser("export", help="Write or refresh tools.json manifest")
    export.add_argument("--out", dest="manifest", required=True, help="Output manifest path")
    export.add_argument("--source", type=Path, default=Path("tools.py"))
    export.add_argument("--tool-name", default="example_tool")
    export.add_argument("--scope", default="read", choices=["read", "write"])
    export.add_argument("--schema-json", default='{"type":"object","properties":{}}')
    export.set_defaults(func=_cmd_export)

    lint = sub.add_parser("lint", help="Lint manifest against baseline")
    lint.add_argument("--manifest", required=True)
    lint.add_argument("--baseline", required=True)
    lint.add_argument("--advisory", action="store_true", help="Report findings but exit 0")
    lint.add_argument("--repo-root", default=".")
    lint.set_defaults(func=_cmd_lint)

    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
