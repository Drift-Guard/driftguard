from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from fuseguard.budget import BudgetGate
from fuseguard.config import FuseConfig, fuse_enabled
from fuseguard.drift_gate import DriftPreflightGate
from fuseguard.ingress_gate import IngressValidateGate
from fuseguard.local_store import LocalStore
from fuseguard.loop_bridge import LoopDetector, tool_args_hash
from fuseguard.policy_bundle import PolicyBundle
from fuseguard.policy_eval import EvalContext, evaluate_policy
from fuseguard.rate_gate import RateGate
from fuseguard.run_context import RunContext
from fuseguard.schema_gate import validate_tool_args
from fuseguard.streak import counts_toward_loop, effective_error_class
from fuseguard.sync_client import SyncClient
from fuseguard.trip import CallRecord, FuseTrip, Trip, new_trip_id, utc_now_iso, write_trip_log


@dataclass
class FuseMonitor:
    config: FuseConfig
    enabled: bool = True
    detector: LoopDetector = field(init=False)
    budget: BudgetGate | None = field(init=False, default=None)
    rate: RateGate | None = field(init=False, default=None)
    calls: list[CallRecord] = field(default_factory=list)
    run_context: RunContext = field(default_factory=RunContext.from_env)
    policy_bundle: PolicyBundle | None = field(default=None, init=False)
    store: LocalStore | None = field(default=None, init=False)
    sync: SyncClient | None = field(default=None, init=False)

    def __post_init__(self) -> None:
        self.detector = LoopDetector(
            max_identical_tool_hashes=self.config.max_identical_tool_hashes,
            window_steps=self.config.window_steps,
            same_error_streak=self.config.same_error_streak,
        )
        if self.config.budget_cap_usd is not None:
            self.budget = BudgetGate(cap_usd=self.config.budget_cap_usd)
        if self.config.rate_max_per_minute is not None:
            self.rate = RateGate(max_per_minute=self.config.rate_max_per_minute)
        self._drift_gate: DriftPreflightGate | None = (
            DriftPreflightGate(self.config) if self.config.has_drift_gate() else None
        )
        self._ingress_gate: IngressValidateGate | None = (
            IngressValidateGate(self.config) if self.config.has_ingress_gate() else None
        )
        self._load_policy_bundle()
        try:
            self.store = LocalStore.open(self.config.local_db_path)
            self.sync = SyncClient(store=self.store, api_key=self.config.api_key, api_base=self.config.api_base)
        except OSError:
            self.store = None
            self.sync = None

    def _load_policy_bundle(self) -> None:
        path = self.config.policy_path
        if not path:
            default = Path.home() / ".fuseguard" / "policy.bundle.json"
            if default.is_file():
                path = str(default)
        if path and Path(path).is_file():
            self.policy_bundle = PolicyBundle.load_path(path)

    @classmethod
    def from_env(cls) -> FuseMonitor:
        return cls(config=FuseConfig.from_env(), enabled=fuse_enabled())

    def assert_pre_call_gates(self, tool: str, args: dict[str, Any], *, estimated_cost_usd: float = 0.0) -> None:
        if not self.enabled:
            return
        self._assert_kill_switch()
        self._assert_policy(tool, args)
        self._assert_rate()
        self.assert_pre_call_budget(estimated_cost_usd)
        self.assert_contract_drift_clear()

    def _assert_kill_switch(self) -> None:
        if self.policy_bundle and self.policy_bundle.kill_switch_active():
            self._trip("kill_switch_active", tool_name=None)

    def _assert_policy(self, tool: str, args: dict[str, Any]) -> None:
        if not self.enabled or self.policy_bundle is None:
            return
        endpoint_host = None
        host = args.get("host") or args.get("endpoint")
        if isinstance(host, str):
            endpoint_host = host
        ctx = EvalContext(
            tool=tool,
            agent_id=self.config.agent_id or self.run_context.agent_id,
            agent_type=self.config.agent_type,
            environment=self.config.environment or self.run_context.environment,
            endpoint_host=endpoint_host,
        )
        result = evaluate_policy(self.policy_bundle, ctx)
        if not result.allowed and result.reason == "policy_denied":
            self._trip(
                "policy_denied",
                tool_name=tool,
                extra={
                    "policyRuleIds": result.rule_ids,
                    "evalTrace": result.to_trace_dicts(),
                },
            )

    def _assert_rate(self) -> None:
        if not self.enabled or self.rate is None:
            return
        if self.rate.would_exceed():
            self._trip("rate_limited", tool_name=None)
        self.rate.record()

    def assert_contract_drift_clear(self) -> None:
        if not self.enabled or self._drift_gate is None:
            return
        if self.policy_bundle and not self.policy_bundle.feature_enabled("driftPreflight"):
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

    def assert_ingress_valid(self, payload: dict[str, Any], tool: str | None = None) -> None:
        profile = None
        if self.policy_bundle and tool:
            profile = self.policy_bundle.profiles.get(tool)
        if profile:
            result = validate_tool_args(profile, payload)
            if not result.ok:
                self._trip(
                    "ingress_validate_blocked",
                    tool_name=tool,
                    extra={"validateErrors": result.errors},
                )
        if not self.enabled or self._ingress_gate is None:
            return
        result = self._ingress_gate.validate_payload(payload)
        if result.ok:
            return
        self._trip(
            "ingress_validate_blocked",
            tool_name=tool,
            extra={"validate": result.payload, "statusCode": result.status_code},
        )

    def assert_response_valid(self, tool: str, response: Any) -> None:
        if not isinstance(response, dict) or not self.policy_bundle:
            return
        profile = self.policy_bundle.profiles.get(f"{tool}:response")
        if not profile:
            return
        result = validate_tool_args(profile, response)
        if not result.ok:
            self._trip("response_schema_drift", tool_name=tool, extra={"validateErrors": result.errors})

    def assert_pre_call_budget(self, estimated_cost_usd: float = 0.0) -> None:
        if not self.enabled or self.budget is None:
            return
        if self.budget.would_exceed(estimated_cost_usd):
            self._trip(
                "budget_exceeded",
                tool_name=None,
                extra={"spentUsd": self.budget.spent_usd, "estimatedUsd": estimated_cost_usd},
            )

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
                self._trip("loop_detected", tool_name=tool, extra={"argsHash": args_hash, "errorClass": err})

    def record_spend(self, amount_usd: float) -> None:
        if self.budget is not None:
            self.budget.record_spend(amount_usd)

    def _trip(self, reason: str, tool_name: str | None, extra: dict[str, Any] | None = None) -> None:
        trip = Trip(
            trip_id=new_trip_id(),
            reason=reason,  # type: ignore[arg-type]
            created_at=utc_now_iso(),
            tool_name=tool_name,
            calls=list(self.calls),
            agent_id=self.config.agent_id or self.run_context.agent_id,
            run_id=self.run_context.run_id,
            parent_run_id=self.run_context.parent_run_id,
            environment=self.config.environment or self.run_context.environment,
            device_id=self.run_context.device_id,
            org_id=self.run_context.org_id,
            policy_bundle_version=self.policy_bundle.bundle_version if self.policy_bundle else None,
            metadata=extra or {},
        )
        if extra and "policyRuleIds" in extra:
            trip.policy_rule_ids = list(extra["policyRuleIds"])
        if extra and "evalTrace" in extra:
            trip.eval_trace = list(extra["evalTrace"])
        self._persist_trip(trip)
        raise FuseTrip(trip)

    def _persist_trip(self, trip: Trip) -> None:
        if self.config.trip_log_path:
            write_trip_log(self.config.trip_log_path, trip)
        if self.store is not None:
            payload = trip.to_log_dict()
            self.store.insert_trip(payload)
            if self.config.sync_on_trip and self.sync is not None:
                index_row = {
                    "tripId": trip.trip_id,
                    "deviceId": trip.device_id or self.run_context.device_id or "local",
                    "reason": trip.reason,
                    "tool": trip.tool_name,
                    "argsHash": trip.calls[-1].args_hash if trip.calls else "",
                    "decision": "block",
                    "createdAt": trip.created_at,
                    "evalTrace": trip.eval_trace,
                    "policyRuleIds": trip.policy_rule_ids,
                }
                self.store.enqueue_sync("block", index_row)
                try:
                    self.sync.push_pending()
                except OSError:
                    pass
