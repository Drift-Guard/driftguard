from __future__ import annotations

from typing import Callable


def _gates_yaml() -> str:
    return """version: 1
gates:
  mockdrift:
    enabled: true
    advisory: false
  fuseguard:
    enabled: true
    max_tool_calls: 40
  agents_lint:
    enabled: true
  toolchange:
    enabled: true
    advisory: true
  schemasync:
    enabled: false
  evaluator:
    enabled: true
    advisory: false
defaults:
  failure_profile: bubble_to_orchestrator
  runner: langgraph
"""


def _harness_lock(fixture_id: str, fixture_path: str, mockdrift_key: str) -> str:
    return f"""version: 1
fixtures:
  - id: {fixture_id}
    version: "1.0.0"
    path: {fixture_path}
    mockdrift_key: {mockdrift_key}
packages:
  mockdrift: "0.1.x"
"""


def _agents_yaml(agent_id: str) -> str:
    return f"""version: 1
agents:
  - id: {agent_id}
    environment: staging
    policy: staging-strict
    mcp:
      configPath: .cursor/mcp.json
      skillToolMap:
        process_refund:
          - stripe_create_refund
    watches:
      - type: mcp
        url: https://mcp.example.com/sse
"""


def _mockdrift_toml(mockdrift_key: str, fixture_rel: str, failure_profile: str, runner: str) -> str:
    return f"""[defaults]
runner = "{runner}"
failure_profile = "{failure_profile}"
timeout_ms = 120000

[fixtures.{mockdrift_key}]
path = "{fixture_rel}"
drift_target = "stripe_create_refund"
match = "first_call"
failure_profile = "{failure_profile}"
"""


def _test_harness(mockdrift_key: str, runner: str, entry: str, failure_profile: str) -> str:
    if runner == "langgraph":
        decorator = f"@drift_replay(fixture=\"{mockdrift_key}\", entry=\"{entry}\", failure_profile=\"{failure_profile}\")"
    elif runner == "crewai":
        decorator = f"@drift_replay(fixture=\"{mockdrift_key}\", runner=\"custom\", entry=\"agents.crewai.refund_crew:run\", failure_profile=\"{failure_profile}\", assert_profiles=False)"
    else:
        decorator = f"@drift_replay(fixture=\"{mockdrift_key}\", runner=\"custom\", entry=\"agents.harness.proxy_smoke:run\", assert_profiles=False)"
    return f"""import pytest

from mockdrift import drift_replay

pytestmark = pytest.mark.mockdrift


{decorator}
def test_drift_harness(mockdrift_session):
    mockdrift_session.run()
"""


def _workflow() -> str:
    return """name: drift-harness

on:
  pull_request:
  push:
    branches: [main]

jobs:
  sensor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -e packages/mockdrift
      - run: pip install -e "packages/mockdrift[langgraph]"
      - run: |
          pytest tests/harness/ -q \\
            --mockdrift-sensor-report=./mockdrift-sensor.json
      - uses: actions/upload-artifact@v4
        with:
          name: mockdrift-sensor
          path: mockdrift-sensor.json

  evaluator:
    needs: sensor
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: mockdrift-sensor
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -e packages/mockdrift
      - run: mockdrift evaluate --report mockdrift-sensor.json

  harness-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/drift-harness-lint
"""


def _langgraph_agent() -> str:
    return '''"""LangGraph harness scaffold — Gate 1 drift replay."""

from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, StateGraph

from mockdrift.errors import DriftToolError
from mockdrift.langgraph.context import current_session


class RefundState(TypedDict, total=False):
    amount: int
    currency: str
    billing_country: str
    refund: dict
    status: str


def refund_node(state: RefundState) -> RefundState:
    session = current_session()
    proxy = session.ensure_proxy()
    tool_name = proxy.fixture.drift_target or "stripe_create_refund"
    profile = session.failure_profile or proxy.fixture.failure_profile or "bubble_to_orchestrator"
    try:
        result = proxy.invoke(
            tool_name,
            {
                "amount": state.get("amount", 100),
                "currency": state.get("currency", "usd"),
                "billing_country": state.get("billing_country", "US"),
            },
        )
        return {**state, "refund": result, "status": "ok"}
    except DriftToolError:
        if profile == "bubble_to_orchestrator":
            raise
        if profile == "halt_clean":
            return {**state, "status": "halted"}
        return {**state, "refund": {"status": "pending_human"}, "status": "needs_human"}


def refund_graph() -> StateGraph:
    graph = StateGraph(RefundState)
    graph.add_node("refund", refund_node)
    graph.set_entry_point("refund")
    graph.add_edge("refund", END)
    return graph.compile()
'''


def _crewai_agent() -> str:
    return '''"""CrewAI-style harness scaffold — proxy runner (Gate 1)."""

from __future__ import annotations

from mockdrift.errors import DriftToolError
from mockdrift.session import MockDriftSession


def run(session: MockDriftSession) -> None:
    proxy = session.ensure_proxy()
    tool_name = proxy.fixture.drift_target or "stripe_create_refund"
    try:
        proxy.invoke(
            tool_name,
            {"amount": 100, "currency": "usd", "billing_country": "US"},
        )
    except DriftToolError:
        profile = session.failure_profile or proxy.fixture.failure_profile or "halt_clean"
        if profile == "bubble_to_orchestrator":
            raise
'''


def _proxy_smoke() -> str:
    return '''"""Custom/proxy harness scaffold — no graph wrapper."""

from __future__ import annotations

from mockdrift.session import MockDriftSession


def run(session: MockDriftSession) -> None:
    proxy = session.ensure_proxy()
    tool_name = proxy.fixture.drift_target or "stripe_create_refund"
    proxy.invoke(
        tool_name,
        {"amount": 100, "currency": "usd", "billing_country": "US"},
    )
'''


RUNNER_FILES: dict[str, dict[str, str | Callable[..., str]]] = {
    "langgraph": {
        "agents/billing/refund_graph.py": _langgraph_agent,
        "entry": "agents.billing.refund_graph:refund_graph",
    },
    "crewai": {
        "agents/crewai/refund_crew.py": _crewai_agent,
        "entry": "agents.crewai.refund_crew:run",
    },
    "custom": {
        "agents/harness/proxy_smoke.py": _proxy_smoke,
        "entry": "agents.harness.proxy_smoke:run",
    },
}
