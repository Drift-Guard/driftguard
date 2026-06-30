"""MockDrift — drift-replay pytest harness (Gate 1)."""

from mockdrift.session import MockDriftResult, MockDriftSession
from mockdrift.types import FailureProfile

__all__ = [
    "drift_replay",
    "MockDriftSession",
    "MockDriftResult",
    "FailureProfile",
]

__version__ = "0.1.0"


def __getattr__(name: str):
    if name == "drift_replay":
        from mockdrift.decorator import drift_replay

        return drift_replay
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
