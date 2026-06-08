from __future__ import annotations

from typing import Any

from mockdrift.proxy import ToolProxy


def run(proxy: ToolProxy, inputs: dict[str, Any]) -> None:
    """Two-step flow: uuid from step 1 flows to step 2 via scope refs."""
    first = proxy.invoke(
        "stripe_create_refund",
        {
            "amount": 100,
            "currency": "usd",
            "billing_country": "US",
        },
    )
    proxy.invoke(
        "stripe_confirm_refund",
        {"refund_id": first["id"]},
    )
