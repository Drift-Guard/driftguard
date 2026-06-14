from __future__ import annotations

import os
from pathlib import Path

from mockdrift.sensor import sensor_json
from mockdrift.session import MockDriftResult, MockDriftSession
from mockdrift.types import FailureProfile


def resolve_sensor_path(base: str | Path, session_id: str) -> Path:
    path = Path(base)
    if path.suffix == ".json":
        return path
    path.mkdir(parents=True, exist_ok=True)
    safe = session_id.replace("/", "_").replace("::", "__").replace(":", "_")
    return path / f"{safe}.json"


def write_sensor_report(
    result: MockDriftResult,
    session: MockDriftSession,
    path: str | Path,
    *,
    session_id: str | None = None,
) -> Path:
    profile: FailureProfile | None = session.failure_profile
    if profile is None and session.assert_profiles:
        from mockdrift.config import load_config, resolve_fixture_config
        from mockdrift.fixture import load_fixture

        cfg = load_config(session.root)
        fixture_cfg = resolve_fixture_config(cfg, session.fixture)
        fixture = load_fixture(fixture_cfg, defaults=cfg.defaults)
        profile = fixture.failure_profile

    out = resolve_sensor_path(path, session_id or session.fixture)
    out.write_text(
        sensor_json(
            result,
            scenario_id=session.fixture,
            failure_profile=profile,
            runner=session.runner,
            entry=session.entry,
            session_id=session_id,
            fixture_ref=session.fixture,
            harness_bundle=".driftguard/",
        ),
        encoding="utf-8",
    )
    return out


def write_configured_artifacts(
    result: MockDriftResult,
    session: MockDriftSession,
    *,
    session_id: str | None = None,
) -> None:
    sensor_path = os.environ.get("MOCKDRIFT_SENSOR_JSON")
    if sensor_path:
        write_sensor_report(result, session, sensor_path, session_id=session_id)
