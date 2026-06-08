from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from fuseguard.monitor import FuseMonitor
from fuseguard.trip import write_trip_log


def main() -> None:
    parser = argparse.ArgumentParser(prog="fuseguard", description="FuseGuard loop/budget fuse utilities")
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate-trip-log", help="Validate a trip log JSON file against schema")
    validate.add_argument("path", type=Path)

    args = parser.parse_args()
    if args.command == "validate-trip-log":
        _validate_trip_log(args.path)
        return

    parser.print_help()
    sys.exit(2)


def _validate_trip_log(path: Path) -> None:
    try:
        import jsonschema
    except ImportError:
        print("jsonschema required: pip install fuseguard[dev]", file=sys.stderr)
        sys.exit(2)

    schema_path = Path(__file__).resolve().parent / "trip_log.schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    payload = json.loads(path.read_text(encoding="utf-8"))
    jsonschema.validate(payload, schema)
    print(f"valid: {path}")


if __name__ == "__main__":
    main()
