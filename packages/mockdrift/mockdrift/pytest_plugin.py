"""pytest integration for MockDrift."""

from __future__ import annotations

import os


def pytest_configure(config):
    config.addinivalue_line("markers", "mockdrift: drift-replay scenario test")
    config.addinivalue_line("markers", "skip_mockdrift: skip mockdrift harness")
    os.environ.setdefault("MOCKDRIFT_MOCK", "1")
    emit = config.getoption("--emit-scenario", default=None)
    if emit:
        os.environ["MOCKDRIFT_EMIT_SCENARIO"] = emit


def pytest_addoption(parser):
    parser.addoption(
        "--emit-scenario",
        action="store",
        default=None,
        help="Write YAML scenario artifact on MockDrift FAIL",
    )
