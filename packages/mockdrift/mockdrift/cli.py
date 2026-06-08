from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

from mockdrift.cache import cache_dir_for_watch, write_cached_fixture
from mockdrift.cloud_client import CloudClientError, MissingApiKeyError, fetch_fixture_from_watch
from mockdrift.config import load_config, resolve_fixture_config
from mockdrift.fixture import load_fixture
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
    _usage()


def _demo(fixture_key: str) -> None:
    if not fixture_key:
        print("Usage: mockdrift demo <fixture>", file=sys.stderr)
        sys.exit(2)
    root = Path.cwd()
    try:
        config = load_config(root)
        fixture_cfg = resolve_fixture_config(config, fixture_key)
        load_fixture(fixture_cfg, defaults=config.defaults)
    except MisconfigurationError as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(2)

    session = MockDriftSession.from_fixture(fixture_key, root=root)
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


def _run(argv: list[str]) -> None:
    parser = argparse.ArgumentParser(prog="mockdrift run", add_help=False)
    parser.add_argument("--pytest", nargs=argparse.REMAINDER, required=True)
    parser.add_argument("--simulate-drift", dest="simulate_drift", default=None)
    parser.add_argument("--cache-fixture", action="store_true")
    parser.add_argument("--event-id", dest="event_id", default=None)
    args, _ = parser.parse_known_args(argv)

    env = os.environ.copy()
    pytest_args = list(args.pytest or [])
    if pytest_args and pytest_args[0] == "--":
        pytest_args = pytest_args[1:]

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
        "Usage: mockdrift demo <fixture> | mockdrift run --pytest [args] "
        "[--simulate-drift WATCH_ID] [--cache-fixture]",
        file=sys.stderr,
    )
    sys.exit(2)


if __name__ == "__main__":
    main()
