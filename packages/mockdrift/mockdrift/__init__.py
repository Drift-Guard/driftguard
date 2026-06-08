"""MockDrift — drift-replay pytest harness (Gate 1)."""

from mockdrift.decorator import drift_replay
from mockdrift.session import MockDriftResult, MockDriftSession
from mockdrift.types import FailureProfile

__all__ = [
    "drift_replay",
    "MockDriftSession",
    "MockDriftResult",
    "FailureProfile",
]

__version__ = "0.1.0"
