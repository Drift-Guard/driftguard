from __future__ import annotations

import json
import os
import urllib.request
import uuid
from typing import Any

from mockdrift.http_headers import driftguard_request_headers


def telemetry_enabled() -> bool:
    return os.environ.get("MOCKDRIFT_TELEMETRY", "1").strip() != "0"


def emit_cloud_ci_run(*, framework: str = "pytest", metadata: dict[str, Any] | None = None) -> None:
    """Best-effort usage event for CI runs (opt-out via MOCKDRIFT_TELEMETRY=0)."""
    if not telemetry_enabled():
        return

    api_key = os.environ.get("DRIFTGUARD_API_KEY", "").strip()
    if not api_key:
        return

    base = os.environ.get("DRIFTGUARD_API_URL", "https://driftguard.org").rstrip("/")
    payload = {
        "eventId": str(uuid.uuid4()),
        "productId": "mockdrift",
        "eventType": "mockdrift.cloud_ci_run",
        "quantity": 1,
        "metadata": {"framework": framework, **(metadata or {})},
    }
    req = urllib.request.Request(
        f"{base}/api/usage/events",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            **driftguard_request_headers(api_key=api_key),
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=15)
    except Exception:
        return
