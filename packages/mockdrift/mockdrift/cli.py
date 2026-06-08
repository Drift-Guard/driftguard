from __future__ import annotations

import sys
from pathlib import Path

from mockdrift.config import load_config, resolve_fixture_config
from mockdrift.fixture import load_fixture
from mockdrift.proxy import ToolProxy
from mockdrift.assertion.engine import AssertionEngine
from mockdrift.session import MisconfigurationError, MockDriftSession


def main() -> None:
    if len(sys.argv) < 2:
        _usage()
    command = sys.argv[1]
    if command == "demo":
        _demo(sys.argv[2] if len(sys.argv) > 2 else "")
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
        fixture = load_fixture(fixture_cfg, defaults=config.defaults)
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

    print(f"scenario: {result.scenario_name}")
    for name, criterion in result.criteria.items():
        status = "PASS" if criterion.pass_ else "FAIL"
        detail = f" ({criterion.detail})" if criterion.detail else ""
        print(f"  {name}: {status}{detail}")
    print(f"verdict: {result.verdict}")
    sys.exit(0 if result.verdict == "PASS" else 1)


def _usage() -> None:
    print("Usage: mockdrift demo <fixture> | mockdrift run --pytest ...", file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    main()
