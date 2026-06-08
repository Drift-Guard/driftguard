from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class SideEffectLedger:
    """Counts duplicate write/side-effect tool invocations."""

    side_effect_tools: set[str] = field(default_factory=set)
    require_idempotency_key: bool = False
    _counts: dict[tuple[str, str], int] = field(default_factory=dict)

    def record(self, tool: str, args_hash: str, *, idempotency_key: str | None) -> int:
        if tool not in self.side_effect_tools:
            return 0
        if self.require_idempotency_key and not idempotency_key:
            return 1
        key = (tool, args_hash)
        self._counts[key] = self._counts.get(key, 0) + 1
        return self._counts[key]

    def duplicate_count(self, tool: str, args_hash: str) -> int:
        return self._counts.get((tool, args_hash), 0)

    def max_duplicates(self) -> int:
        return max(self._counts.values(), default=0)
