from __future__ import annotations


class EgressBlockedError(Exception):
    """Raised when MOCKDRIFT_MOCK=1 blocks outbound network."""

    def __init__(self, url: str) -> None:
        self.url = url
        super().__init__(f"Egress blocked (MOCKDRIFT_MOCK=1): {url}")


class DriftToolError(Exception):
    """Injected drift error surfaced to the agent."""

    def __init__(self, status: str, body: dict) -> None:
        self.status = status
        self.body = body
        super().__init__(f"Drift tool error {status}")
