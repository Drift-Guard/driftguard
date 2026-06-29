from __future__ import annotations

import os
import uuid
from dataclasses import dataclass, field


@dataclass
class RunContext:
    run_id: str
    agent_id: str | None = None
    parent_run_id: str | None = None
    environment: str | None = None
    device_id: str | None = None
    org_id: str | None = None
    child_budgets: dict[str, float] = field(default_factory=dict)

    @classmethod
    def from_env(cls) -> RunContext:
        run_id = os.environ.get("FUSEGUARD_RUN_ID", "").strip() or f"run_{uuid.uuid4().hex[:12]}"
        return cls(
            run_id=run_id,
            agent_id=os.environ.get("FUSEGUARD_AGENT_ID", "").strip() or None,
            parent_run_id=os.environ.get("FUSEGUARD_PARENT_RUN_ID", "").strip() or None,
            environment=os.environ.get("FUSEGUARD_ENVIRONMENT", "").strip() or None,
            device_id=os.environ.get("FUSEGUARD_DEVICE_ID", "").strip() or None,
            org_id=os.environ.get("FUSEGUARD_ORG_ID", "").strip() or None,
        )
