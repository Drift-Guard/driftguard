from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from fuseguard.config import FuseConfig


@dataclass
class PreflightCache:
    """In-process TTL cache for preflight responses (CP-3.1 KV stand-in)."""

    ttl_sec: float
    _expires_at: float = 0.0
    _payload: dict[str, Any] | None = None

    def get(self) -> dict[str, Any] | None:
        if self._payload is not None and time.monotonic() < self._expires_at:
            return self._payload
        return None

    def set(self, payload: dict[str, Any]) -> None:
        self._payload = payload
        self._expires_at = time.monotonic() + self.ttl_sec

    def clear(self) -> None:
        self._payload = None
        self._expires_at = 0.0


def _post_preflight(config: FuseConfig) -> dict[str, Any]:
    if not config.api_key:
        raise ValueError("DRIFTGUARD_API_KEY required for FuseGuard drift gate")

    body: dict[str, Any] = {}
    if config.agent_id:
        body["agentId"] = config.agent_id
    else:
        body["watchIds"] = list(config.watch_ids)

    url = f"{config.api_base.rstrip('/')}/api/preflight"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "FuseGuard/0.1 (+https://driftguard.org)",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=config.preflight_timeout_sec) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"error": raw or exc.reason}
        if exc.code == 409:
            payload.setdefault("allowed", False)
            payload.setdefault("policyBlocked", True)
            return payload
        raise RuntimeError(f"preflight HTTP {exc.code}: {payload.get('error', raw)}") from exc


class DriftPreflightGate:
    def __init__(self, config: FuseConfig) -> None:
        self.config = config
        self._cache = PreflightCache(ttl_sec=config.preflight_cache_ttl_sec)

    def check(self) -> dict[str, Any]:
        cached = self._cache.get()
        if cached is not None:
            return cached

        result = _post_preflight(self.config)
        self._cache.set(result)
        return result

    def clear_cache(self) -> None:
        self._cache.clear()
