from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal

from mockdrift.types import FailureProfile


@dataclass(frozen=True)
class CriterionResult:
    pass_: bool
    detail: str = ""


@dataclass(frozen=True)
class TraceSummary:
    steps_total: int = 0
    steps_after_drift: int = 0
    drift_injected_at_step: int | None = None
    tools_called: list[dict[str, Any]] = field(default_factory=list)


@dataclass(frozen=True)
class MockDriftResult:
    verdict: Literal["PASS", "FAIL"]
    criteria: dict[str, CriterionResult]
    trace_summary: TraceSummary
    scenario_name: str

    def emit_scenario(self) -> str:
        import yaml

        payload = {
            "apiVersion": "mockdrift.assertion/v2",
            "scenario": self.scenario_name,
            "verdict": self.verdict,
            "criteria": {
                name: {"pass": c.pass_, "detail": c.detail}
                for name, c in self.criteria.items()
            },
            "trace_summary": {
                "steps_total": self.trace_summary.steps_total,
                "steps_after_drift": self.trace_summary.steps_after_drift,
                "drift_injected_at_step": self.trace_summary.drift_injected_at_step,
                "tools_called": self.trace_summary.tools_called,
            },
        }
        return yaml.safe_dump(payload, sort_keys=False)

    def failure_detail(self) -> str:
        failed = [f"{k}: {v.detail}" for k, v in self.criteria.items() if not v.pass_]
        return "; ".join(failed) or "assertion failed"

    def to_sensor_dict(
        self,
        *,
        scenario_id: str | None = None,
        failure_profile: FailureProfile | None = None,
        runner: str | None = None,
        entry: str | None = None,
        session_id: str | None = None,
        fixture_ref: str | None = None,
        harness_bundle: str | None = None,
    ) -> dict[str, Any]:
        from mockdrift.sensor import project_sensor

        return project_sensor(
            self,
            scenario_id=scenario_id,
            failure_profile=failure_profile,
            runner=runner,
            entry=entry,
            session_id=session_id,
            fixture_ref=fixture_ref,
            harness_bundle=harness_bundle,
        )

    def to_sensor_json(
        self,
        *,
        scenario_id: str | None = None,
        failure_profile: FailureProfile | None = None,
        runner: str | None = None,
        entry: str | None = None,
        session_id: str | None = None,
        fixture_ref: str | None = None,
        harness_bundle: str | None = None,
        indent: int | None = 2,
    ) -> str:
        from mockdrift.sensor import sensor_json

        return sensor_json(
            self,
            scenario_id=scenario_id,
            failure_profile=failure_profile,
            runner=runner,
            entry=entry,
            session_id=session_id,
            fixture_ref=fixture_ref,
            harness_bundle=harness_bundle,
            indent=indent,
        )


class MockDriftSession:
    """Per-test MockDrift harness. See docs/mockdrift/R3-API.md."""

    _run_called: bool = False

    def __init__(
        self,
        *,
        fixture: str,
        runner: str = "langgraph",
        entry: str | None = None,
        failure_profile: FailureProfile | None = None,
        state_schema: str | Path | None = None,
        assert_profiles: bool = True,
        inputs: dict[str, Any] | None = None,
        config: dict[str, Any] | None = None,
        root: Path | None = None,
    ) -> None:
        self.fixture = fixture
        self.runner = runner
        self.entry = entry
        self.failure_profile = failure_profile
        self.state_schema = state_schema
        self.assert_profiles = assert_profiles
        self.inputs = inputs or {}
        self.config = config or {}
        self.root = root or _discover_root()
        self._run_called = False
        self._proxy: Any | None = None
        self._last_result: MockDriftResult | None = None

    @classmethod
    def from_test_context(
        cls,
        *,
        fixture: str,
        runner: str = "langgraph",
        entry: str | None = None,
        failure_profile: FailureProfile | None = None,
        state_schema: str | Path | None = None,
        assert_profiles: bool = True,
        inputs: dict[str, Any] | None = None,
        config: dict[str, Any] | None = None,
        root: Path | None = None,
    ) -> MockDriftSession:
        return cls(
            fixture=fixture,
            runner=runner,
            entry=entry,
            failure_profile=failure_profile,
            state_schema=state_schema,
            assert_profiles=assert_profiles,
            inputs=inputs,
            config=config,
            root=root,
        )

    @classmethod
    def from_fixture(cls, fixture: str, *, root: Path | None = None) -> MockDriftSession:
        return cls(fixture=fixture, runner="custom", assert_profiles=False, root=root)

    def run(
        self,
        _graph: Any | None = None,
        *,
        inputs: dict[str, Any] | None = None,
        config: dict[str, Any] | None = None,
    ) -> MockDriftResult:
        if self._run_called:
            raise MisconfigurationError("MockDriftSession.run() must be called at most once per test")
        self._run_called = True

        if self.runner == "langgraph" and self.assert_profiles:
            if not self.entry:
                raise MisconfigurationError("entry is required for runner=langgraph")
            from mockdrift.langgraph.wrap import run_langgraph_scenario

            result = run_langgraph_scenario(
                self, inputs=inputs or self.inputs, config=config or self.config
            )
        else:
            from mockdrift.proxy import run_proxy_scenario

            result = run_proxy_scenario(self, inputs=inputs or self.inputs)

        self._last_result = result
        return result

    def ensure_proxy(self) -> Any:
        if self._proxy is None:
            from mockdrift.config import load_config, resolve_fixture_config
            from mockdrift.fixture import load_fixture
            from mockdrift.proxy import ToolProxy

            cfg = load_config(self.root)
            fixture_cfg = resolve_fixture_config(cfg, self.fixture)
            fixture = load_fixture(fixture_cfg, defaults=cfg.defaults)
            self._proxy = ToolProxy(fixture=fixture)
        return self._proxy

    def wrap_graph(self, graph: Any) -> Any:
        from mockdrift.langgraph.wrap import wrap_graph

        return wrap_graph(graph, self)

    def resolve_entry(self, entry: str | None = None) -> Any:
        from mockdrift.langgraph.entry import resolve_entry

        return resolve_entry(entry or self.entry or "")

    def patch_tool(self, tool: Any) -> Any:
        from mockdrift.proxy import patch_tool

        return patch_tool(tool, self)


class MisconfigurationError(Exception):
    """Scenario or API misconfiguration → pytest exit 2."""


def _discover_root() -> Path:
    env_root = os.environ.get("MOCKDRIFT_ROOT")
    if env_root:
        return Path(env_root).resolve()
    cwd = Path.cwd().resolve()
    for path in [cwd, *cwd.parents]:
        if (path / ".mockdrift.toml").is_file() or (path / "mockdrift.toml").is_file():
            return path
    return cwd
