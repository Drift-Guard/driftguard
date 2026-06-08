"""Decorator contract tests — no LangGraph required."""

import pytest

from mockdrift import drift_replay
from mockdrift.session import MockDriftSession


def test_drift_replay_accepts_session_param():
    @drift_replay(fixture="stripe-required-field", runner="custom", entry="true", assert_profiles=False)
    def sample(mockdrift_session: MockDriftSession):
        assert isinstance(mockdrift_session, MockDriftSession)
        assert mockdrift_session.fixture == "stripe-required-field"

    assert sample.__mockdrift__["fixture"] == "stripe-required-field"


def test_drift_replay_rejects_bad_signature():
    @drift_replay(fixture="x", runner="custom", entry="true", assert_profiles=False)
    def bad(a, b):
        pass

    with pytest.raises(TypeError):
        bad()
