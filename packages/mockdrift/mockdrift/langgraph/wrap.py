from __future__ import annotations

from typing import Any

from mockdrift.config import load_config, resolve_fixture_config
from mockdrift.fixture import load_fixture
from mockdrift.langgraph.context import bind_session, clear_session
from mockdrift.langgraph.profiles import LangGraphRunContext
from mockdrift.proxy import ToolProxy
from mockdrift.session import MisconfigurationError, MockDriftResult, MockDriftSession


def wrap_graph(graph: Any, session: MockDriftSession) -> Any:
    """Layer 2 wrap — capture invoke boundaries and state checkpoints."""
    original_invoke = graph.invoke

    def invoke(inputs: dict[str, Any] | None = None, config: dict[str, Any] | None = None) -> Any:
        payload = dict(inputs or session.inputs or {})
        session._pre_drift_checkpoint = dict(payload)  # type: ignore[attr-defined]
        session._post_run_state = dict(payload)  # type: ignore[attr-defined]
        session._invoke_error = None  # type: ignore[attr-defined]
        session._graph_reached_end = False  # type: ignore[attr-defined]
        try:
            result = original_invoke(payload, config)
            session._post_run_state = result if isinstance(result, dict) else {"result": result}  # type: ignore[attr-defined]
            session._graph_reached_end = True  # type: ignore[attr-defined]
            return result
        except Exception as exc:  # noqa: BLE001
            session._invoke_error = exc  # type: ignore[attr-defined]
            session._graph_reached_end = True  # type: ignore[attr-defined]
            raise

    graph.invoke = invoke  # type: ignore[method-assign]
    return graph


def run_langgraph_scenario(
    session: MockDriftSession,
    *,
    inputs: dict,
    config: dict,
) -> MockDriftResult:
    from mockdrift.assertion.engine import AssertionEngine

    bind_session(session)
    try:
        cfg = load_config(session.root)
        fixture_cfg = resolve_fixture_config(cfg, session.fixture)
        fixture = load_fixture(fixture_cfg, defaults=cfg.defaults)
        profile = session.failure_profile or fixture.failure_profile
        if session.assert_profiles and not profile:
            raise MisconfigurationError("failure_profile required when assert_profiles=True")

        proxy = ToolProxy(fixture=fixture)
        session._proxy = proxy  # type: ignore[attr-defined]

        graph = session.resolve_entry()
        wrapped = wrap_graph(graph, session)
        merged_config = {**(session.config or {}), **(config or {})}
        run_inputs = {**fixture.inputs, **session.inputs, **inputs}

        try:
            wrapped.invoke(run_inputs, merged_config)
        except Exception:
            pass

        run_ctx = LangGraphRunContext(
            trace=proxy.trace,
            profile=profile,
            invoke_error=getattr(session, "_invoke_error", None),
            post_run_state=getattr(session, "_post_run_state", {}),
            pre_drift_state=getattr(session, "_pre_drift_checkpoint", {}),
            graph_reached_end=getattr(session, "_graph_reached_end", False),
        )
        return AssertionEngine.evaluate_langgraph(
            run_ctx,
            fixture,
            assert_profiles=session.assert_profiles,
            scenario_name=fixture.name,
        )
    finally:
        clear_session()
