"""Re-export shared loop detection from MockDrift (stable import path for FuseGuard)."""

from mockdrift.loop_detect import LoopDetector, tool_args_hash

__all__ = ["LoopDetector", "tool_args_hash"]
