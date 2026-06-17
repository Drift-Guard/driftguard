"""Example: consume cloud replay fixture via @drift_replay (simulate-drift key).

Run locally with mocked cloud (see tests/test_phase1c.py) or against hosted API:

  export DRIFTGUARD_API_KEY=dg_live_...
  pytest --simulate-drift watch_abc123 --cache-fixture examples/mockdrift/test_simulate_drift_replay.py -v
"""

from __future__ import annotations

from mockdrift.decorators import drift_replay


@drift_replay(fixture="simulate-drift", failure_profile="bubble_to_orchestrator")
def test_cloud_replay_fixture_materialized():
    """Passes when --simulate-drift materialized cache; skipped locally without env."""
    assert True
