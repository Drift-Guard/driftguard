"""Loop hash detection — shared with FuseGuard (import path: mockdrift.loop_detect)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field


def tool_args_hash(tool: str, args: dict) -> str:
    payload = json.dumps({"tool": tool, "args": args}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


@dataclass
class LoopDetector:
    max_identical_tool_hashes: int = 3
    window_steps: int = 10
    same_error_streak: int = 3
    _recent: list[tuple[str, str | None]] = field(default_factory=list)

    def record(self, *, step: int, tool: str, args_hash: str, error_class: str | None) -> None:
        _ = (step, tool)  # reserved for trace enrichment
        self._recent.append((args_hash, error_class))
        if len(self._recent) > self.window_steps:
            self._recent.pop(0)

    def identical_hash_count(self, args_hash: str) -> int:
        return sum(1 for h, _ in self._recent if h == args_hash)

    def same_error_streak_count(self, error_class: str | None) -> int:
        if not error_class:
            return 0
        streak = 0
        for _, err in reversed(self._recent):
            if err != error_class:
                break
            streak += 1
        return streak

    def spiral_detected(self, args_hash: str, error_class: str | None) -> bool:
        if self.identical_hash_count(args_hash) > self.max_identical_tool_hashes:
            return True
        return self.same_error_streak_count(error_class) >= self.same_error_streak
