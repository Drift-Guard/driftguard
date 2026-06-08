from __future__ import annotations

import os
from dataclasses import dataclass


def fuse_enabled() -> bool:
    return os.environ.get("DRIFTGUARD_FUSE", "1").strip() != "0"


@dataclass
class FuseConfig:
    max_identical_tool_hashes: int = 3
    window_steps: int = 10
    same_error_streak: int = 3
    budget_cap_usd: float | None = None
    trip_log_path: str | None = None

    @classmethod
    def from_env(cls) -> FuseConfig:
        cap = os.environ.get("FUSEGUARD_BUDGET_CAP_USD", "").strip()
        return cls(
            max_identical_tool_hashes=int(os.environ.get("FUSEGUARD_MAX_IDENTICAL_HASHES", "3")),
            window_steps=int(os.environ.get("FUSEGUARD_WINDOW_STEPS", "10")),
            same_error_streak=int(os.environ.get("FUSEGUARD_SAME_ERROR_STREAK", "3")),
            budget_cap_usd=float(cap) if cap else None,
            trip_log_path=os.environ.get("FUSEGUARD_TRIP_LOG", "").strip() or None,
        )
