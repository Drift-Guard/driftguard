from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

from mockdrift.cache import write_cached_fixture
from mockdrift.cloud_client import CloudClientError, MissingApiKeyError, fetch_fixture_from_watch
from mockdrift.config import load_config, resolve_fixture_config
from mockdrift.evaluator import evaluate_sensor_file
from mockdrift.fixture import load_fixture
from mockdrift.init_cmd import run_init
from mockdrift.session import MisconfigurationError, MockDriftSession
from mockdrift.telemetry import emit_cloud_ci_run


def main() -> None:
    if len(sys.argv) < 2:
        _usage()
    command = sys.argv[1]
    if command == "demo":
        _demo(sys.argv[2] if len(sys.argv) > 2 else "")
        return
    if command == "run":
        _run(sys.argv[2:])
        return
    if command == "init":
        sys.exit(run_init(sys.argv[2:]))
    if command == "evaluate":
        _evaluate(sys.argv[2:])
        return
    if command == "catalog":
        _catalog()
        return
    if command == "install":
        _install(sys.argv[2:] if len(sys.argv) > 2 else [])
        return
    _usage()


def _demo(fixture_key: str) -> None:
    if not fixture_key:
        print("Usage: mockdrift demo <fixture|vendor/scenario>", file=sys.stderr)
        sys.exit(2)
    root = Path.cwd()
    try:
        config = load_config(root)
        fixture_cfg = resolve_fixture_config(config, fixture_key)
        load_fixture(fixture_cfg, defaults=config.defaults)
    except MisconfigurationError as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(2)

    session = MockDriftSession.from_fixture(fixture_cfg.name, root=root)
    session.entry = "mockdrift.golden.refund_proxy_smoke:run"
    session.runner = "custom"
    session.assert_profiles = False
    try:
        result = session.run()
    except MisconfigurationError as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(2)

    _print_result(result)
    sys.exit(0 if result.verdict == "PASS" else 1)


def _catalog() -> None:
    try:
        from mockdrift.cloud_client import fetch_fixture_catalog

        data = fetch_fixture_catalog()
    except Exception as exc:  # noqa: BLE001 — CLI surface
        # Offline: print OSS index hint
        from pathlib import Path

        index = Path(__file__).resolve().parent.parent / "fixtures" / "index.yaml"
        if index.is_file():
            print(f"Hosted catalog unreachable ({exc}); local index: {index}", file=sys.stderr)
        else:
            print(str(exc), file=sys.stderr)
        sys.exit(2)

    fixtures = data.get("fixtures", [])
    for row in fixtures:
        lane = row.get("lane", "?")
        tags = ",".join(row.get("tags", []))
        print(f"{row.get('id')} [{lane}] {tags}")
    sys.exit(0)


def _install(argv: list[str]) -> None:
    parser = argparse.ArgumentParser(prog="mockdrift install")
    parser.add_argument("id", help="Catalog id vendor/scenario")
    parser.add_argument("--cache-fixture", action="store_true")
    args = parser.parse_args(argv)

    try:
        from mockdrift.cloud_client import fetch_fixture_from_catalog
        from mockdrift.cache import write_cached_catalog_fixture

        body = fetch_fixture_from_catalog(args.id, use_cache=args.cache_fixture)
        fixture_dir = write_cached_catalog_fixture(args.id, body)
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        sys.exit(2)

    print(f"installed {args.id} -> {fixture_dir}", file=sys.stderr)
    sys.exit(0)


def _evaluate(argv: list[str]) -> None:
    parser = argparse.ArgumentParser(prog="mockdrift evaluate")
    parser.add_argument("--report", required=True, help="Path to mockdrift.sensor/v1 JSON")
    args = parser.parse_args(argv)
    path = Path(args.report)
    if not path.is_file():
        print(f"sensor report not found: {path}", file=sys.stderr)
        sys.exit(2)

    result = evaluate_sensor_file(path)
    print(json.dumps(result.to_dict(), indent=2))
    sys.exit(0 if result.verdict == "PASS" else 1)


def _run(argv: list[str]) -> None:
    parser = argparse.ArgumentParser(prog="mockdrift run", add_help=False)
    parser.add_argument("--pytest", nargs=argparse.REMAINDER, required=True)
    parser.add_argument("--simulate-drift", dest="simulate_drift", default=None)
    parser.add_argument("--cache-fixture", action="store_true")
    parser.add_argument("--event-id", dest="event_id", default=None)
    parser.add_argument("--mockdrift-sensor-report", dest="sensor_report", default=None)
    args, _ = parser.parse_known_args(argv)

    env = os.environ.copy()
    pytest_args = list(args.pytest or [])
    if pytest_args and pytest_args[0] == "--":
        pytest_args = pytest_args[1:]

    if args.sensor_report:
        env["MOCKDRIFT_SENSOR_JSON"] = args.sensor_report

    if args.simulate_drift:
        try:
            cloud = fetch_fixture_from_watch(
                args.simulate_drift,
                event_id=args.event_id,
                use_cache=args.cache_fixture,
            )
            fixture_dir = write_cached_fixture(args.simulate_drift, cloud)
        except MissingApiKeyError as exc:
            print(str(exc), file=sys.stderr)
            sys.exit(2)
        except CloudClientError as exc:
            print(str(exc), file=sys.stderr)
            sys.exit(2 if "PRODUCT_REQUIRED" not in str(exc) else 2)

        env["MOCKDRIFT_SIMULATE_WATCH"] = args.simulate_drift
        env["MOCKDRIFT_SIMULATE_FIXTURE"] = str(fixture_dir)
        fixture = cloud.get("fixture", {})
        if fixture.get("driftTarget"):
            env["MOCKDRIFT_SIMULATE_DRIFT_TARGET"] = str(fixture["driftTarget"])
        if fixture.get("match"):
            env["MOCKDRIFT_SIMULATE_MATCH"] = str(fixture["match"])
        if fixture.get("failureProfile"):
            env["MOCKDRIFT_SIMULATE_FAILURE_PROFILE"] = str(fixture["failureProfile"])
        print(f"simulate-drift: watch={args.simulate_drift} cache={fixture_dir}", file=sys.stderr)

    emit_cloud_ci_run(metadata={"simulateDrift": args.simulate_drift or ""})

    cmd = [sys.executable, "-m", "pytest", *pytest_args]
    if args.sensor_report:
        cmd.extend(["--mockdrift-sensor-report", args.sensor_report])
    result = subprocess.run(cmd, env=env, check=False)
    sys.exit(result.returncode)


def _print_result(result) -> None:
    print(f"scenario: {result.scenario_name}")
    for name, criterion in result.criteria.items():
        status = "PASS" if criterion.pass_ else "FAIL"
        detail = f" ({criterion.detail})" if criterion.detail else ""
        print(f"  {name}: {status}{detail}")
    print(f"verdict: {result.verdict}")


def _usage() -> None:
    print(
        "Usage: mockdrift demo <fixture> | mockdrift init [options] | "
        "mockdrift catalog | mockdrift install <vendor/scenario> | "
        "mockdrift evaluate --report <sensor.json> | "
        "mockdrift run --pytest [args] [--simulate-drift WATCH_ID] "
        "[--mockdrift-sensor-report PATH]",
        file=sys.stderr,
    )
    sys.exit(2)


if __name__ == "__main__":
    main()
