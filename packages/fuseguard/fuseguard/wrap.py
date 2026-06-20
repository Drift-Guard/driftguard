from __future__ import annotations

import os
from typing import Any, Protocol

from fuseguard.config import FuseConfig
from fuseguard.monitor import FuseMonitor
from fuseguard.trip import FuseTrip


class ToolRunner(Protocol):
    def invoke_tool(self, tool: str, args: dict[str, Any]) -> Any: ...


def wrap_agent(runner: ToolRunner, config: FuseConfig | None = None) -> ToolRunner:
    """One-line runner wrap — records tool calls and trips on loop/budget."""
    monitor = FuseMonitor(config=config or FuseConfig.from_env())

    class WrappedRunner:
        def invoke_tool(self, tool: str, args: dict[str, Any], *, estimated_cost_usd: float = 0.0) -> Any:
            ingress_key = os.environ.get("FUSEGUARD_INGRESS_PAYLOAD_ARG", "").strip()
            if ingress_key and isinstance(args.get(ingress_key), dict):
                monitor.assert_ingress_valid(args[ingress_key])
            monitor.assert_pre_call_budget(estimated_cost_usd)
            try:
                result = runner.invoke_tool(tool, args)
            except FuseTrip:
                raise
            except Exception as exc:
                status = getattr(exc, "status_code", None)
                err_class = getattr(exc, "error_class", None) or type(exc).__name__
                try:
                    monitor.record_call(tool=tool, args=args, status_code=status, error_class=err_class)
                except FuseTrip:
                    raise
                raise
            monitor.record_spend(estimated_cost_usd)
            return result

        @property
        def fuse(self) -> FuseMonitor:
            return monitor

    return WrappedRunner()  # type: ignore[return-value]
