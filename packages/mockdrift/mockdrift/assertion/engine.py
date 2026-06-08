from __future__ import annotations

from typing import Any

from mockdrift.fixture import LoadedFixture
from mockdrift.langgraph.profiles import LangGraphRunContext, evaluate_failure_profile, evaluate_state_invariants
from mockdrift.proxy import ToolTrace
from mockdrift.session import CriterionResult, MockDriftResult


class AssertionEngine:
    @classmethod
    def evaluate(
        cls,
        trace: ToolTrace,
        fixture: LoadedFixture,
        *,
        assert_profiles: bool,
        scenario_name: str,
    ) -> MockDriftResult:
        return cls._evaluate(trace, fixture, assert_profiles=assert_profiles, scenario_name=scenario_name)

    @classmethod
    def evaluate_langgraph(
        cls,
        ctx: LangGraphRunContext,
        fixture: LoadedFixture,
        *,
        assert_profiles: bool,
        scenario_name: str,
    ) -> MockDriftResult:
        return cls._evaluate(
            ctx.trace,
            fixture,
            assert_profiles=assert_profiles,
            scenario_name=scenario_name,
            langgraph_ctx=ctx,
        )

    @classmethod
    def _evaluate(
        cls,
        trace: ToolTrace,
        fixture: LoadedFixture,
        *,
        assert_profiles: bool,
        scenario_name: str,
        langgraph_ctx: LangGraphRunContext | None = None,
    ) -> MockDriftResult:
        expect = fixture.expect
        criteria: dict[str, CriterionResult] = {}

        schema_cfg = expect.get("schema_valid", {"enabled": True})
        if schema_cfg.get("enabled", True):
            criteria["schema_valid"] = cls._schema_valid(trace)
        else:
            criteria["schema_valid"] = CriterionResult(True, "disabled")

        loop_cfg = expect.get("no_loop_spiral", {})
        criteria["no_loop_spiral"] = cls._no_loop_spiral(trace, loop_cfg)

        if assert_profiles:
            profile = (
                langgraph_ctx.profile if langgraph_ctx else fixture.failure_profile
            )
            if not profile:
                criteria["failure_profile_met"] = CriterionResult(
                    False, "failure_profile required when assert_profiles=True"
                )
            elif langgraph_ctx is not None:
                if profile == "fallback_state":
                    invariants = expect.get("state_invariants", [])
                    criteria["state_invariants"] = evaluate_state_invariants(
                        langgraph_ctx.post_run_state,
                        langgraph_ctx.pre_drift_state,
                        invariants=invariants,
                    )
                    criteria["failure_profile_met"] = (
                        criteria["state_invariants"]
                        if criteria["state_invariants"].pass_
                        else CriterionResult(False, "fallback_state invariants not met")
                    )
                else:
                    criteria["failure_profile_met"] = evaluate_failure_profile(langgraph_ctx)
            else:
                criteria["failure_profile_met"] = CriterionResult(
                    False, f"failure_profile '{profile}' requires LangGraph wrap (M2)"
                )
            criteria["next_step_valid"] = cls._next_step_valid(trace, expect.get("next_step_valid", {}))
            criteria["idempotency"] = cls._idempotency(trace, expect.get("idempotency", {}))

        verdict = "PASS" if all(c.pass_ for c in criteria.values()) else "FAIL"
        return MockDriftResult(
            verdict=verdict,
            criteria=criteria,
            trace_summary=trace.summary(),
            scenario_name=scenario_name,
        )

    @staticmethod
    def _schema_valid(trace: ToolTrace) -> CriterionResult:
        if trace.schema_violations:
            detail = "; ".join(trace.schema_violations[:3])
            return CriterionResult(False, detail)
        return CriterionResult(True)

    @staticmethod
    def _no_loop_spiral(trace: ToolTrace, cfg: dict[str, Any]) -> CriterionResult:
        if trace.loop_spiral:
            return CriterionResult(False, "loop spiral detected")
        max_hashes = cfg.get("max_identical_tool_hashes", 3)
        if trace.max_identical_hash_count > max_hashes:
            return CriterionResult(
                False,
                f"identical tool hash count {trace.max_identical_hash_count} > {max_hashes}",
            )
        return CriterionResult(True)

    @staticmethod
    def _next_step_valid(trace: ToolTrace, cfg: dict[str, Any]) -> CriterionResult:
        if not cfg:
            return CriterionResult(True, f"steps_after_drift={trace.steps_after_drift()}")
        max_after = cfg.get("max_steps_after_drift")
        if max_after is not None and trace.steps_after_drift() > max_after:
            return CriterionResult(False, f"steps_after_drift={trace.steps_after_drift()}")
        forbidden = set(cfg.get("forbid_tools_after_drift", []))
        drift_step = trace.drift_step
        if drift_step is not None:
            for record in trace.records:
                if record.step > drift_step and record.tool in forbidden:
                    return CriterionResult(False, f"forbidden tool after drift: {record.tool}")
        return CriterionResult(True, f"steps_after_drift={trace.steps_after_drift()}")

    @staticmethod
    def _idempotency(trace: ToolTrace, cfg: dict[str, Any]) -> CriterionResult:
        if not cfg.get("enabled", False):
            return CriterionResult(True, "disabled")
        max_dup = cfg.get("max_duplicate_side_effects", 0)
        if trace.max_side_effect_duplicates > max_dup:
            return CriterionResult(
                False,
                f"side_effect duplicates={trace.max_side_effect_duplicates}",
            )
        return CriterionResult(True, f"side_effect_calls={trace.side_effect_calls}")
