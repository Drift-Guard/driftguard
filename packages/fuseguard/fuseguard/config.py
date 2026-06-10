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
    watch_ids: tuple[str, ...] = ()
    agent_id: str | None = None
    api_key: str | None = None
    api_base: str = "https://driftguard.org"
    preflight_cache_ttl_sec: float = 30.0
    preflight_timeout_sec: float = 15.0

    def has_drift_gate(self) -> bool:
        return bool(self.api_key and (self.watch_ids or self.agent_id))

    @classmethod
    def from_env(cls) -> FuseConfig:
        cap = os.environ.get("FUSEGUARD_BUDGET_CAP_USD", "").strip()
        watch_raw = os.environ.get("FUSEGUARD_WATCH_IDS", "").strip()
        watch_ids = tuple(w.strip() for w in watch_raw.split(",") if w.strip())
        agent_id = os.environ.get("FUSEGUARD_AGENT_ID", "").strip() or None
        api_key = os.environ.get("DRIFTGUARD_API_KEY", "").strip() or None
        api_base = os.environ.get("DRIFTGUARD_API", "https://driftguard.org").strip() or "https://driftguard.org"
        cache_ttl = os.environ.get("FUSEGUARD_PREFLIGHT_CACHE_TTL_SEC", "30").strip()
        preflight_timeout = os.environ.get("FUSEGUARD_PREFLIGHT_TIMEOUT_SEC", "15").strip()
        return cls(
            max_identical_tool_hashes=int(os.environ.get("FUSEGUARD_MAX_IDENTICAL_HASHES", "3")),
            window_steps=int(os.environ.get("FUSEGUARD_WINDOW_STEPS", "10")),
            same_error_streak=int(os.environ.get("FUSEGUARD_SAME_ERROR_STREAK", "3")),
            budget_cap_usd=float(cap) if cap else None,
            trip_log_path=os.environ.get("FUSEGUARD_TRIP_LOG", "").strip() or None,
            watch_ids=watch_ids,
            agent_id=agent_id,
            api_key=api_key,
            api_base=api_base,
            preflight_cache_ttl_sec=float(cache_ttl) if cache_ttl else 30.0,
            preflight_timeout_sec=float(preflight_timeout) if preflight_timeout else 15.0,
        )
