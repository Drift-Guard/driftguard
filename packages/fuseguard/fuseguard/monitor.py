from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from fuseguard.budget import BudgetGate
from fuseguard.config import FuseConfig, fuse_enabled
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

    @classmethod
    def from_env(cls) -> FuseMonitor:
        return cls(config=FuseConfig.from_env(), enabled=fuse_enabled())

    def assert_pre_call_budget(self, estimated_cost_usd: float = 0.0) -> None:
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
