#!/usr/bin/env python3
"""E5 — FuseGuard runtime contract preflight before tool calls.

Requires: pip install -e packages/mockdrift -e packages/fuseguard
Env: DRIFTGUARD_API_KEY, FUSEGUARD_WATCH_IDS or FUSEGUARD_AGENT_ID
"""

from __future__ import annotations

import os
import sys

from fuseguard import FuseConfig, FuseTrip, wrap_agent


class DemoAgent:
    """Minimal agent with one irreversible tool."""

    def invoke_tool(self, tool: str, args: dict) -> dict:
        if tool == "stripe_refund":
            return {"status": "refunded", "amount": args.get("amount")}
        return {"status": "ok", "tool": tool}


def main() -> int:
    if not os.environ.get("DRIFTGUARD_API_KEY"):
        print("Set DRIFTGUARD_API_KEY and FUSEGUARD_WATCH_IDS or FUSEGUARD_AGENT_ID", file=sys.stderr)
        return 1

    cfg = FuseConfig.from_env()
    if not cfg.has_drift_gate():
        print("Preflight requires watch IDs or agent id — see packages/fuseguard/README.md", file=sys.stderr)
        return 1

    agent = wrap_agent(DemoAgent(), cfg)
    try:
        result = agent.invoke_tool("stripe_refund", {"amount": 1}, estimated_cost_usd=0.01)
    except FuseTrip as exc:
        trip = exc.trip
        print(f"Blocked: {trip.reason}")
        blocked = trip.metadata.get("blocked") or []
        for item in blocked:
            if isinstance(item, dict):
                print(f"  watch={item.get('watchId')} reasons={item.get('reasons')}")
                print(f"  agentActions={item.get('agentActions')}")
        return 2

    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
