from __future__ import annotations

from typing import Any

from mockdrift.errors import DriftToolError
from mockdrift.proxy import ToolProxy


def run(proxy: ToolProxy, inputs: dict[str, Any]) -> None:
    """Golden agent: valid pre-drift call, halt on injected 422."""
    try:
        proxy.invoke(
            "stripe_create_refund",
            {
                "amount": inputs.get("amount", 100),
                "currency": "usd",
                "billing_country": "US",
            },
        )
    except DriftToolError:
        return
