from __future__ import annotations

import hashlib
import importlib
import json
import os
import subprocess
from dataclasses import dataclass, field
from typing import Any

from mockdrift.config import load_config, resolve_fixture_config
from mockdrift.errors import DriftToolError, EgressBlockedError
from mockdrift.fixture import LoadedFixture, load_fixture
from mockdrift.ledger import SideEffectLedger
from mockdrift.loop_detect import LoopDetector, tool_args_hash
from mockdrift.scope import ScopeLedger
from mockdrift.session import MisconfigurationError, MockDriftResult, MockDriftSession


@dataclass
class ToolCallRecord:
    step: int
    tool: str
    args: dict[str, Any]
    args_hash: str
    error_class: str | None = None
    drift_injected: bool = False


@dataclass
class ToolTrace:
    records: list[ToolCallRecord] = field(default_factory=list)
    drift_step: int | None = None
    schema_violations: list[str] = field(default_factory=list)
    loop_spiral: bool = False
    max_identical_hash_count: int = 0
    max_side_effect_duplicates: int = 0
    side_effect_calls: int = 0

    def steps_after_drift(self) -> int:
        if self.drift_step is None:
            return 0
        return sum(1 for r in self.records if r.step > self.drift_step)

    def summary(self):
        from mockdrift.session import TraceSummary

        return TraceSummary(
            steps_total=len(self.records),
            steps_after_drift=self.steps_after_drift(),
            drift_injected_at_step=self.drift_step,
            tools_called=[
                {
                    "tool": r.tool,
                    "hash": r.args_hash,
                    "error_class": r.error_class,
                }
                for r in self.records
            ],
        )


class ToolProxy:
    def __init__(self, *, fixture: LoadedFixture, trace: ToolTrace | None = None) -> None:
        self.fixture = fixture
        self.scope = ScopeLedger()
        self.trace = trace or ToolTrace()
        expect = fixture.expect
        idem = expect.get("idempotency", {})
        self.ledger = SideEffectLedger(
            side_effect_tools=set(idem.get("side_effect_tools", [])),
            require_idempotency_key=bool(idem.get("require_idempotency_key", False)),
        )
        loop_cfg = expect.get("no_loop_spiral", {})
        self.loop_detector = LoopDetector(
            max_identical_tool_hashes=loop_cfg.get("max_identical_tool_hashes", 3),
            window_steps=loop_cfg.get("window_steps", 10),
            same_error_streak=loop_cfg.get("same_error_streak", 3),
        )
        self._target_calls: dict[str, int] = {}

    def invoke(self, tool: str, args: dict[str, Any]) -> Any:
        step = len(self.trace.records) + 1
        args_hash = tool_args_hash(tool, args)
        schema = (
            self.fixture.before_schema
            if self.trace.drift_step is None
            else self.fixture.after_schema
        )
        violation = _validate_args(tool, args, schema)
        if violation:
            self.trace.schema_violations.append(violation)

        inject_drift = self._should_inject_drift(tool)
        if inject_drift:
            self.trace.drift_step = step
            body = self.fixture.sample_error or {"error": "drift_injected"}
            record = ToolCallRecord(
                step=step,
                tool=tool,
                args=args,
                args_hash=args_hash,
                error_class=str(body.get("status", "422")),
                drift_injected=True,
            )
            self.trace.records.append(record)
            self._post_call(record)
            raise DriftToolError(str(body.get("status", "422")), body)

        mock = self.fixture.mock_responses.get(tool, {"ok": True})
        response = self.scope.substitute(mock)
        if isinstance(response, dict) and "id" in response:
            self.scope.remember("id", response["id"])

        record = ToolCallRecord(
            step=step,
            tool=tool,
            args=args,
            args_hash=args_hash,
        )
        self.trace.records.append(record)
        idem_key = args.get("idempotency_key")
        dup = self.ledger.record(tool, args_hash, idempotency_key=idem_key)
        self.trace.side_effect_calls += 1 if tool in self.ledger.side_effect_tools else 0
        self.trace.max_side_effect_duplicates = max(self.trace.max_side_effect_duplicates, dup)
        self._post_call(record)
        return response

    def _should_inject_drift(self, tool: str) -> bool:
        target = self.fixture.drift_target
        if not target or tool != target:
            return False
        self._target_calls[tool] = self._target_calls.get(tool, 0) + 1
        if self.fixture.match == "first_call":
            return self._target_calls[tool] == 1
        if self.fixture.match == "every_call":
            return True
        return False

    def _post_call(self, record: ToolCallRecord) -> None:
        self.loop_detector.record(
            step=record.step,
            tool=record.tool,
            args_hash=record.args_hash,
            error_class=record.error_class,
        )
        count = self.loop_detector.identical_hash_count(record.args_hash)
        self.trace.max_identical_hash_count = max(self.trace.max_identical_hash_count, count)
        if self.loop_detector.spiral_detected(record.args_hash, record.error_class):
            self.trace.loop_spiral = True


def guard_egress(url: str) -> None:
    if os.environ.get("MOCKDRIFT_MOCK", "1") != "0":
        raise EgressBlockedError(url)


def patch_tool(tool: Any, session: MockDriftSession) -> Any:
    proxy = session.ensure_proxy()

    def wrapped(*args: Any, **kwargs: Any) -> Any:
        payload = kwargs if kwargs else (args[0] if args else {})
        if not isinstance(payload, dict):
            payload = {"value": payload}
        name = getattr(tool, "name", getattr(tool, "__name__", "tool"))
        return proxy.invoke(name, payload)

    if hasattr(tool, "func"):
        tool.func = wrapped  # type: ignore[attr-defined]
        return tool
    wrapped.__name__ = getattr(tool, "__name__", "patched_tool")
    return wrapped


def run_proxy_scenario(session: MockDriftSession, *, inputs: dict) -> MockDriftResult:
    from mockdrift.assertion.engine import AssertionEngine

    config = load_config(session.root)
    fixture_cfg = resolve_fixture_config(config, session.fixture)
    fixture = load_fixture(fixture_cfg, defaults=config.defaults)
    proxy = ToolProxy(fixture=fixture)
    session._proxy = proxy  # type: ignore[attr-defined]

    entry = session.entry or ""
    if entry.startswith("python "):
        _run_python_entry(entry, env=_proxy_env(session))
    elif ":" in entry:
        _run_callable_entry(entry, proxy, inputs)
    elif entry:
        raise MisconfigurationError(f"Unsupported custom entry: {entry}")
    else:
        raise MisconfigurationError("entry is required for runner=custom")

    return AssertionEngine.evaluate(
        proxy.trace,
        fixture,
        assert_profiles=session.assert_profiles,
        scenario_name=fixture.name,
    )


def _proxy_env(session: MockDriftSession) -> dict[str, str]:
    env = os.environ.copy()
    env.setdefault("MOCKDRIFT_MOCK", "1")
    env["MOCKDRIFT_ROOT"] = str(session.root)
    env["MOCKDRIFT_FIXTURE"] = session.fixture
    return env


def _run_python_entry(entry: str, *, env: dict[str, str]) -> None:
    parts = entry.split(maxsplit=1)
    if len(parts) < 2:
        raise MisconfigurationError(f"Invalid python entry: {entry}")
    result = subprocess.run(parts[1], shell=True, env=env, check=False)  # noqa: S602
    if result.returncode != 0:
        raise MisconfigurationError(f"Entry command failed with exit {result.returncode}")


def _run_callable_entry(entry: str, proxy: ToolProxy, inputs: dict) -> None:
    module_name, symbol = entry.rsplit(":", 1)
    module = importlib.import_module(module_name)
    target = getattr(module, symbol)
    target(proxy, inputs)


def _validate_args(tool: str, args: dict[str, Any], schema: dict[str, Any]) -> str | None:
    tools = schema.get("tools", {})
    tool_schema = tools.get(tool, schema)
    required = tool_schema.get("required", [])
    missing = [field for field in required if field not in args]
    if missing:
        return f"{tool}: missing required fields {missing}"
    return None
