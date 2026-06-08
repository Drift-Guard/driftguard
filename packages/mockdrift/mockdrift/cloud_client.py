from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from mockdrift.http_headers import driftguard_request_headers


class CloudClientError(Exception):
    """Hosted MockDrift API error."""


class MissingApiKeyError(CloudClientError):
    """DRIFTGUARD_API_KEY is required for --simulate-drift."""


def hosted_api_base() -> str:
    return os.environ.get("DRIFTGUARD_API_URL", "https://driftguard.org").rstrip("/")


def api_key() -> str:
    key = os.environ.get("DRIFTGUARD_API_KEY", "").strip()
    if not key:
        raise MissingApiKeyError(
            "DRIFTGUARD_API_KEY is required for --simulate-drift. "
            "Start a trial: https://driftguard.org/start"
        )
    return key


def fetch_fixture_from_watch(
    watch_id: str,
    *,
    event_id: str | None = None,
    use_cache: bool = False,
) -> dict[str, Any]:
    from mockdrift.cache import load_cached_fixture, write_cached_fixture

    if use_cache:
        cached = load_cached_fixture(watch_id)
        if cached is not None:
            return cached

    payload: dict[str, Any] = {"watchId": watch_id}
    if event_id:
        payload["eventId"] = event_id

    url = f"{hosted_api_base()}/v1/mockdrift/fixtures/from-watch"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            **driftguard_request_headers(api_key=api_key()),
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(detail)
            message = parsed.get("error", detail)
        except json.JSONDecodeError:
            message = detail or exc.reason
        if exc.code == 403 and "PRODUCT_REQUIRED" in str(message):
            raise CloudClientError(str(message)) from exc
        raise CloudClientError(f"Cloud replay failed ({exc.code}): {message}") from exc
    except urllib.error.URLError as exc:
        raise CloudClientError(f"Cloud replay unreachable: {exc.reason}") from exc

    if use_cache:
        write_cached_fixture(watch_id, body)
    return body
