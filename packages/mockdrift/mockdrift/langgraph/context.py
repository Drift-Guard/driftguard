from __future__ import annotations

from contextvars import ContextVar
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from mockdrift.session import MockDriftSession

_session_var: ContextVar[MockDriftSession | None] = ContextVar("mockdrift_session", default=None)


def bind_session(session: MockDriftSession) -> None:
    _session_var.set(session)


def current_session() -> MockDriftSession:
    session = _session_var.get()
    if session is None:
        raise RuntimeError("No MockDriftSession bound — call bind_session() before building graphs")
    return session


def clear_session() -> None:
    _session_var.set(None)
