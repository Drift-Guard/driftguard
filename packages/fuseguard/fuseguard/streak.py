from __future__ import annotations

TRANSIENT_HTTP_CODES = frozenset({429, 502, 503, 504})


def is_transient_http(status_code: int | None) -> bool:
    return status_code in TRANSIENT_HTTP_CODES


def effective_error_class(*, status_code: int | None, error_class: str | None) -> str | None:
    """Transient infra codes are excluded from same-error streak counting."""
    if is_transient_http(status_code):
        return None
    if status_code is not None and status_code >= 400:
        return error_class or str(status_code)
    return error_class


def counts_toward_loop(*, status_code: int | None) -> bool:
    """Transient HTTP responses do not advance loop detection."""
    return not is_transient_http(status_code)
