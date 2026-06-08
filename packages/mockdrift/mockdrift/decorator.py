from __future__ import annotations

import functools
import inspect
import os
from collections.abc import Callable
from pathlib import Path
from typing import Any, TypeVar

import pytest

from mockdrift.session import MisconfigurationError, MockDriftSession
from mockdrift.types import FailureProfile

F = TypeVar("F", bound=Callable[..., Any])


def drift_replay(
    *,
    fixture: str,
    runner: str = "langgraph",
    entry: str | None = None,
    failure_profile: FailureProfile | None = None,
    state_schema: str | Path | None = None,
    assert_profiles: bool = True,
    inputs: dict[str, Any] | None = None,
    config: dict[str, Any] | None = None,
) -> Callable[[F], F]:
    """Mark a pytest test as a MockDrift drift-replay scenario."""

    def decorator(test_fn: F) -> F:
        @functools.wraps(test_fn)
        def wrapper() -> None:
            session = MockDriftSession.from_test_context(
                fixture=fixture,
                runner=runner,
                entry=entry,
                failure_profile=failure_profile,
                state_schema=state_schema,
                assert_profiles=assert_profiles,
                inputs=inputs,
                config=config,
            )
            params = inspect.signature(test_fn).parameters
            try:
                if len(params) == 0:
                    result = session.run()
                elif len(params) == 1 and "mockdrift_session" in params:
                    test_fn(session)
                    result = session._last_result if session._run_called else session.run()
                else:
                    raise TypeError(
                        "@drift_replay tests must take no args (auto-run) or "
                        "(mockdrift_session: MockDriftSession)"
                    )
            except MisconfigurationError as exc:
                pytest.fail(str(exc), pytrace=False)

            if result.verdict == "FAIL":
                emit_path = os.environ.get("MOCKDRIFT_EMIT_SCENARIO")
                if emit_path:
                    Path(emit_path).write_text(result.emit_scenario(), encoding="utf-8")
                pytest.fail(result.failure_detail(), pytrace=False)

        # Prevent pytest from treating mockdrift_session as a fixture via __wrapped__.
        wrapper.__signature__ = inspect.Signature()  # type: ignore[attr-defined]
        wrapper.__pytest_wrapped__ = None  # type: ignore[attr-defined]
        wrapper.__mockdrift__ = {  # type: ignore[attr-defined]
            "fixture": fixture,
            "runner": runner,
            "entry": entry,
            "failure_profile": failure_profile,
            "assert_profiles": assert_profiles,
        }
        return wrapper  # type: ignore[return-value]

    return decorator
