"""FuseGuard — loop and budget fuse for AI agents."""

from fuseguard.budget import BudgetGate
from fuseguard.config import FuseConfig, fuse_enabled
from fuseguard.loop_bridge import LoopDetector, tool_args_hash
from fuseguard.proxy import FuseProxy
from fuseguard.trip import FuseTrip, Trip, write_trip_log
from fuseguard.wrap import wrap_agent

__all__ = [
    "BudgetGate",
    "FuseConfig",
    "FuseProxy",
    "FuseTrip",
    "LoopDetector",
    "Trip",
    "fuse_enabled",
    "tool_args_hash",
    "wrap_agent",
    "write_trip_log",
]
