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

    sensor_report = config.getoption("--mockdrift-sensor-report", default=None)
    if sensor_report:
        os.environ["MOCKDRIFT_SENSOR_JSON"] = sensor_report

    watch_id = config.getoption("--simulate-drift", default=None)
    if watch_id:
        from mockdrift.cloud_client import fetch_fixture_from_watch
        from mockdrift.cache import write_cached_fixture

        use_cache = config.getoption("--cache-fixture", default=False)
        cloud = fetch_fixture_from_watch(watch_id, use_cache=use_cache)
        fixture_dir = write_cached_fixture(watch_id, cloud)
        fixture = cloud.get("fixture", {})
        os.environ["MOCKDRIFT_SIMULATE_WATCH"] = watch_id
        os.environ["MOCKDRIFT_SIMULATE_FIXTURE"] = str(fixture_dir)
        if fixture.get("driftTarget"):
            os.environ["MOCKDRIFT_SIMULATE_DRIFT_TARGET"] = str(fixture["driftTarget"])
        if fixture.get("match"):
            os.environ["MOCKDRIFT_SIMULATE_MATCH"] = str(fixture["match"])
        if fixture.get("failureProfile"):
            os.environ["MOCKDRIFT_SIMULATE_FAILURE_PROFILE"] = str(fixture["failureProfile"])


def pytest_addoption(parser):
    parser.addoption(
        "--emit-scenario",
        action="store",
        default=None,
        help="Write YAML scenario artifact on MockDrift FAIL",
    )
    parser.addoption(
        "--mockdrift-sensor-report",
        action="store",
        default=None,
        help="Write mockdrift.sensor/v1 JSON artifact (file or directory per test)",
    )
    parser.addoption(
        "--simulate-drift",
        action="store",
        default=None,
        help="Fetch fixture from hosted watch (requires DRIFTGUARD_API_KEY + mockdrift_cloud)",
    )
    parser.addoption(
        "--cache-fixture",
        action="store_true",
        default=False,
        help="Cache cloud fixture under .mockdrift/cache/",
    )
