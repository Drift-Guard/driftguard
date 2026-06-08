"""Reference LangGraph refund agent — Gate 1 M2 (three failure profiles)."""

from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, StateGraph

from mockdrift.errors import DriftToolError
from mockdrift.langgraph.context import current_session


class RefundState(TypedDict, total=False):
    amount: int
    currency: str
    billing_country: str
    query: str
    refund: dict
    status: str


def _tool_args(state: RefundState, tool_name: str) -> dict:
    if tool_name == "mcp_search":
        return {"query": state.get("query", "refund policy")}
    return {
        "amount": state.get("amount", 100),
        "currency": state.get("currency", "usd"),
        "billing_country": state.get("billing_country", "US"),
    }


def _invoke_drift_tool(state: RefundState) -> RefundState:
    session = current_session()
    proxy = session.ensure_proxy()
    tool_name = proxy.fixture.drift_target or "stripe_create_refund"
    profile = session.failure_profile or proxy.fixture.failure_profile or "bubble_to_orchestrator"

    try:
        result = proxy.invoke(tool_name, _tool_args(state, tool_name))
        return {**state, "refund": result, "status": "ok"}
    except DriftToolError:
        if profile == "bubble_to_orchestrator":
            raise
        if profile == "halt_clean":
            return {**state, "status": "halted"}
        if profile == "fallback_state":
            return {
                **state,
                "refund": {
                    "status": "pending_human",
                    "amount": state.get("amount", 100),
                },
                "status": "fallback",
            }
        raise


def refund_graph():
    """Return CompiledGraph — profile driven by MockDriftSession.failure_profile."""
    graph = StateGraph(RefundState)
    graph.add_node("invoke_drift_tool", _invoke_drift_tool)
    graph.set_entry_point("invoke_drift_tool")
    graph.add_edge("invoke_drift_tool", END)
    return graph.compile()
