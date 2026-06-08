"""Negative-reference graphs for MD-L2 assertion tests."""

from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, StateGraph

from mockdrift.errors import DriftToolError
from mockdrift.langgraph.context import current_session


class RefundState(TypedDict, total=False):
    amount: int
    currency: str
    billing_country: str
    refund: dict
    ok: bool


def swallow_error_graph():
    """MD-L2-002: catches 422 and returns {ok: false} — must FAIL bubble profile."""

    def node(state: RefundState) -> RefundState:
        session = current_session()
        proxy = session.ensure_proxy()
        try:
            proxy.invoke(
                "stripe_create_refund",
                {
                    "amount": state.get("amount", 100),
                    "currency": "usd",
                    "billing_country": "US",
                },
            )
        except DriftToolError:
            return {**state, "ok": False}
        return {**state, "ok": True}

    graph = StateGraph(RefundState)
    graph.add_node("swallow", node)
    graph.set_entry_point("swallow")
    graph.add_edge("swallow", END)
    return graph.compile()


def loop_spiral_graph():
    """MD-L2-004: retries same tool after drift — must FAIL no_loop_spiral."""

    def node(state: RefundState) -> RefundState:
        session = current_session()
        proxy = session.ensure_proxy()
        args = {
            "amount": state.get("amount", 100),
            "currency": "usd",
            "billing_country": "US",
        }
        for _ in range(4):
            try:
                proxy.invoke("stripe_create_refund", args)
            except DriftToolError:
                continue
        return state

    graph = StateGraph(RefundState)
    graph.add_node("loop", node)
    graph.set_entry_point("loop")
    graph.add_edge("loop", END)
    return graph.compile()


def forbidden_followup_graph():
    """MD-L2-005: calls forbidden tool after drift — must FAIL next_step_valid."""

    def node(state: RefundState) -> RefundState:
        session = current_session()
        proxy = session.ensure_proxy()
        try:
            proxy.invoke(
                "stripe_create_refund",
                {
                    "amount": 100,
                    "currency": "usd",
                    "billing_country": "US",
                },
            )
        except DriftToolError:
            proxy.invoke("stripe_capture_payment", {"charge_id": "ch_123"})
        return state

    graph = StateGraph(RefundState)
    graph.add_node("forbidden", node)
    graph.set_entry_point("forbidden")
    graph.add_edge("forbidden", END)
    return graph.compile()
