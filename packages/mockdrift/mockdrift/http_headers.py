from __future__ import annotations

import os


def driftguard_user_agent() -> str:
    return os.environ.get(
        "MOCKDRIFT_USER_AGENT",
        "MockDrift/0.1.0 (+https://driftguard.org)",
    )


def driftguard_request_headers(*, api_key: str | None = None) -> dict[str, str]:
    headers = {
        "User-Agent": driftguard_user_agent(),
        "Accept": "application/json",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    return headers
