from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass, field


@dataclass
class RateGate:
    max_per_minute: int
    _timestamps: deque[float] = field(default_factory=deque)

    def would_exceed(self) -> bool:
        self._prune()
        return len(self._timestamps) >= self.max_per_minute

    def record(self) -> None:
        self._prune()
        self._timestamps.append(time.monotonic())

    def _prune(self) -> None:
        cutoff = time.monotonic() - 60.0
        while self._timestamps and self._timestamps[0] < cutoff:
            self._timestamps.popleft()
