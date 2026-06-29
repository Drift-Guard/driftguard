from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from fuseguard.config import FuseConfig
from fuseguard.daemon.proxy import DaemonProxy
from fuseguard.device import ensure_device_id, write_device_meta
from fuseguard.monitor import FuseMonitor
from fuseguard.policy_bundle import PolicyBundle
from fuseguard.policy_eval import EvalContext, evaluate_policy
from fuseguard.policy_lint import lint_policy_path
from fuseguard.sync_client import SyncClient


def main() -> None:
    parser = argparse.ArgumentParser(prog="fuseguard", description="FuseGuard loop/budget fuse utilities")
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate-trip-log", help="Validate a trip log JSON file against schema")
    validate.add_argument("path", type=Path)

    policy = sub.add_parser("policy", help="Policy bundle commands")
    policy_sub = policy.add_subparsers(dest="policy_command", required=True)
    lint = policy_sub.add_parser("lint", help="Lint a policy bundle file")
    lint.add_argument("path", type=Path)
    simulate = policy_sub.add_parser("simulate", help="Simulate policy eval for a tool call")
    simulate.add_argument("path", type=Path, nargs="?", default=None)
    simulate.add_argument("--tool", required=True)
    simulate.add_argument("--agent-id", default=None)
    simulate.add_argument("--agent-type", default=None)
    simulate.add_argument("--environment", default=None)

    daemon = sub.add_parser("daemon", help="Local daemon")
    daemon_sub = daemon.add_subparsers(dest="daemon_command", required=True)
    start = daemon_sub.add_parser("start", help="Start localhost proxy daemon")
    start.add_argument("--host", default="127.0.0.1")
    start.add_argument("--port", type=int, default=9477)

    device = sub.add_parser("device", help="Device identity")
    device_sub = device.add_subparsers(dest="device_command", required=True)
    enroll = device_sub.add_parser("enroll", help="Enroll device with hosted DriftGuard")
    enroll.add_argument("--token", required=True)
    show = device_sub.add_parser("show", help="Show local device.json")

    export = sub.add_parser("export", help="Export local data")
    export_sub = export.add_subparsers(dest="export_command", required=True)
    trips = export_sub.add_parser("trips", help="Export trips since timestamp")
    trips.add_argument("--since", required=True)
    otel = export_sub.add_parser("otel", help="Export trips as OTel span JSONL")
    otel.add_argument("--since", required=True)
    cef = export_sub.add_parser("cef", help="Export trips as CEF lines")
    cef.add_argument("--since", required=True)

    doctor = sub.add_parser("doctor", help="Diagnose local fuse setup")
    doctor.add_argument("--json", action="store_true", help="Emit JSON report")

    args = parser.parse_args()

    if args.command == "validate-trip-log":
        _validate_trip_log(args.path)
    elif args.command == "policy":
        if args.policy_command == "lint":
            _policy_lint(args.path)
        elif args.policy_command == "simulate":
            _policy_simulate(args)
    elif args.command == "daemon" and args.daemon_command == "start":
        _daemon_start(args.host, args.port)
    elif args.command == "device":
        if args.device_command == "enroll":
            _device_enroll(args.token)
        elif args.device_command == "show":
            _device_show()
    elif args.command == "export" and args.export_command == "trips":
        _export_trips(args.since)
    elif args.command == "export" and args.export_command == "otel":
        _export_otel(args.since)
    elif args.command == "export" and args.export_command == "cef":
        _export_cef(args.since)
    elif args.command == "doctor":
        _doctor(json_output=args.json)
    else:
        parser.print_help()
        sys.exit(2)


def _schema_path() -> Path:
    pkg = Path(__file__).resolve().parent
    v2 = pkg / "trip_log.v2.schema.json"
    if v2.is_file():
        return v2
    return pkg / "trip_log.schema.json"


def _validate_trip_log(path: Path) -> None:
    try:
        import jsonschema
    except ImportError:
        print("jsonschema required: pip install fuseguard[dev]", file=sys.stderr)
        sys.exit(2)

    schema = json.loads(_schema_path().read_text(encoding="utf-8"))
    payload = json.loads(path.read_text(encoding="utf-8"))
    jsonschema.validate(payload, schema)
    print(f"valid: {path}")


def _policy_lint(path: Path) -> None:
    errors = lint_policy_path(path)
    if errors:
        for err in errors:
            print(err, file=sys.stderr)
        sys.exit(1)
    print(f"ok: {path}")


def _policy_simulate(args: argparse.Namespace) -> None:
    path = args.path
    if path is None:
        default = Path.home() / ".fuseguard" / "policy.bundle.json"
        path = default if default.is_file() else Path("examples/fuseguard/fuse.policy.yaml")
    bundle = PolicyBundle.load_path(path)
    ctx = EvalContext(
        tool=args.tool,
        agent_id=args.agent_id,
        agent_type=args.agent_type,
        environment=args.environment,
    )
    result = evaluate_policy(bundle, ctx)
    print(json.dumps({"allowed": result.allowed, "reason": result.reason, "trace": result.to_trace_dicts()}, indent=2))
    sys.exit(0 if result.allowed else 1)


def _daemon_start(host: str, port: int) -> None:
    config = FuseConfig.from_env()
    monitor = FuseMonitor(config=config)
    client = SyncClient(store=monitor.store, api_key=config.api_key, api_base=config.api_base)
    try:
        client.pull_policy_bundle()
        monitor._load_policy_bundle()
    except OSError:
        pass

    def passthrough(tool: str, args: dict[str, Any]) -> dict[str, Any]:
        return {"tool": tool, "forwarded": True, "argsKeys": list(args.keys())}

    DaemonProxy(passthrough, monitor=monitor).serve(host=host, port=port)


def _device_enroll(token: str) -> None:
    meta = ensure_device_id()
    client = SyncClient()
    result = client.enroll(token, {"deviceId": meta["deviceId"], "platform": sys.platform})
    print(json.dumps(result, indent=2))


def _device_show() -> None:
    print(json.dumps(ensure_device_id(), indent=2))


def _export_trips(since: str) -> None:
    from fuseguard.local_store import LocalStore

    store = LocalStore.open()
    for row in store.export_trips_since(since):
        print(json.dumps(row))


def _export_otel(since: str) -> None:
    from fuseguard.local_store import LocalStore
    from fuseguard.otel_export import trip_to_otel_span

    store = LocalStore.open()
    for row in store.export_trips_since(since):
        print(json.dumps(trip_to_otel_span(row)))


def _export_cef(since: str) -> None:
    from fuseguard.local_store import LocalStore
    from fuseguard.otel_export import trip_to_cef

    store = LocalStore.open()
    for row in store.export_trips_since(since):
        print(trip_to_cef(row))


def _doctor(*, json_output: bool = False) -> None:
    from fuseguard.doctor import build_doctor_report, format_doctor_report_text

    report = build_doctor_report()
    if json_output:
        print(json.dumps(report, indent=2))
    else:
        print(format_doctor_report_text(report))
    sys.exit(0 if report.get("ok") else 1)


if __name__ == "__main__":
    main()
