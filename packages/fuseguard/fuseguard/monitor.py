from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from fuseguard.budget import BudgetGate
from fuseguard.config import FuseConfig, fuse_enabled
from fuseguard.drift_gate import DriftPreflightGate
from fuseguard.loop_bridge import LoopDetector, tool_args_hash
from fuseguard.streak import counts_toward_loop, effective_error_class
from fuseguard.trip import CallRecord, FuseTrip, Trip, new_trip_id, utc_now_iso, write_trip_log


@dataclass
class FuseMonitor:
    config: FuseConfig
    enabled: bool = True
    detector: LoopDetector = field(init=False)
    budget: BudgetGate | None = field(init=False, default=None)
    calls: list[CallRecord] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.detector = LoopDetector(
            max_identical_tool_hashes=self.config.max_identical_tool_hashes,
            window_steps=self.config.window_steps,
            same_error_streak=self.config.same_error_streak,
        )
        if self.config.budget_cap_usd is not None:
            self.budget = BudgetGate(cap_usd=self.config.budget_cap_usd)
        self._drift_gate: DriftPreflightGate | None = (
            DriftPreflightGate(self.config) if self.config.has_drift_gate() else None
        )

    @classmethod
    def from_env(cls) -> FuseMonitor:
        return cls(config=FuseConfig.from_env(), enabled=fuse_enabled())

    def assert_contract_drift_clear(self) -> None:
        if not self.enabled or self._drift_gate is None:
            return
        result = self._drift_gate.check()
        if result.get("allowed", True):
            return
        blocked = result.get("blocked") or []
        agent_actions: list[str] = []
        for item in blocked:
            if isinstance(item, dict):
                for action in item.get("agentActions") or []:
                    if isinstance(action, str):
                        agent_actions.append(action)
        trip = Trip(
            trip_id=new_trip_id(),
            reason="contract_drift_blocked",
            created_at=utc_now_iso(),
            watch_id=blocked[0].get("watchId") if blocked and isinstance(blocked[0], dict) else None,
            calls=list(self.calls),
            agent_action=agent_actions[0] if agent_actions else None,
            metadata={
                "preflight": result,
                "blocked": blocked,
                "agentActions": agent_actions,
                "policyBlocked": result.get("policyBlocked"),
            },
        )
        self._persist_trip(trip)
        raise FuseTrip(trip)

    def assert_pre_call_budget(self, estimated_cost_usd: float = 0.0) -> None:
        self.assert_contract_drift_clear()
        if not self.enabled or self.budget is None:
            return
        if self.budget.would_exceed(estimated_cost_usd):
            trip = Trip(
                trip_id=new_trip_id(),
                reason="budget_exceeded",
                created_at=utc_now_iso(),
                calls=list(self.calls),
                metadata={"spentUsd": self.budget.spent_usd, "estimatedUsd": estimated_cost_usd},
            )
            self._persist_trip(trip)
            raise FuseTrip(trip)

    def record_call(
        self,
        *,
        tool: str,
        args: dict[str, Any],
        status_code: int | None = None,
        error_class: str | None = None,
    ) -> None:
        if not self.enabled:
            return

        step = len(self.calls) + 1
        args_hash = tool_args_hash(tool, args)
        err = effective_error_class(status_code=status_code, error_class=error_class)
        record = CallRecord(step=step, tool=tool, args_hash=args_hash, status_code=status_code, error_class=err)
        self.calls.append(record)

        if counts_toward_loop(status_code=status_code):
            self.detector.record(step=step, tool=tool, args_hash=args_hash, error_class=err)
            if self.detector.spiral_detected(args_hash, err):
                trip = Trip(
                    trip_id=new_trip_id(),
                    reason="loop_detected",
                    created_at=utc_now_iso(),
                    tool_name=tool,
                    calls=list(self.calls),
                    metadata={"argsHash": args_hash, "errorClass": err},
                )
                self._persist_trip(trip)
                raise FuseTrip(trip)

    def record_spend(self, amount_usd: float) -> None:
        if self.budget is not None:
            self.budget.record_spend(amount_usd)

    def _persist_trip(self, trip: Trip) -> None:
        if self.config.trip_log_path:
            write_trip_log(self.config.trip_log_path, trip)
