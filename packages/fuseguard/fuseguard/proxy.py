from __future__ import annotations

from typing import Any, Callable

from fuseguard.config import FuseConfig
from fuseguard.monitor import FuseMonitor
from fuseguard.trip import FuseTrip

ToolHandler = Callable[[str, dict[str, Any]], Any]


class FuseProxy:
    """MCP/HTTP-style proxy — swap tool endpoint URL, fuse records each invocation."""

    def __init__(self, handler: ToolHandler, config: FuseConfig | None = None) -> None:
        self.handler = handler
        self.monitor = FuseMonitor(config=config or FuseConfig.from_env())

    def invoke(self, tool: str, args: dict[str, Any], *, estimated_cost_usd: float = 0.0) -> Any:
        self.monitor.assert_pre_call_gates(tool, args, estimated_cost_usd=estimated_cost_usd)
        try:
            result = self.handler(tool, args)
        except FuseTrip:
            raise
        except Exception as exc:
            status = getattr(exc, "status_code", None)
            err_class = getattr(exc, "error_class", None) or type(exc).__name__
            try:
                self.monitor.record_call(tool=tool, args=args, status_code=status, error_class=err_class)
            except FuseTrip:
                raise
            raise
        status_code = getattr(result, "status_code", None) if not isinstance(result, dict) else result.get("status_code")
        error_class = None
        if isinstance(result, dict) and result.get("error"):
            error_class = str(result.get("error_class") or result.get("error"))
            status_code = status_code or int(result.get("status", 422))
            self.monitor.record_call(tool=tool, args=args, status_code=status_code, error_class=error_class)
            return result
        self.monitor.assert_response_valid(tool, result)
        self.monitor.record_spend(estimated_cost_usd)
        return result
