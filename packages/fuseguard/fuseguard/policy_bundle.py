from __future__ import annotations

import fnmatch
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


class PolicyBundleError(ValueError):
    pass


@dataclass
class PolicyRule:
    id: str
    action: str
    match: dict[str, str] = field(default_factory=dict)


@dataclass
class ToolCostEntry:
    tool_pattern: str
    usd_per_call: float


@dataclass
class PolicyCosts:
    default_usd_per_block: float = 0.04
    tools: list[ToolCostEntry] = field(default_factory=list)


@dataclass
class PolicyAssignment:
    priority: int
    rule_ids: list[str]
    match: dict[str, str] = field(default_factory=dict)


@dataclass
class PolicyBundle:
    version: int
    bundle_version: str
    features: dict[str, Any]
    rules: dict[str, PolicyRule]
    assignments: list[PolicyAssignment]
    profiles: dict[str, Any]
    costs: PolicyCosts | None = None
    org_id: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PolicyBundle:
        if data.get("version") != 1:
            raise PolicyBundleError("unsupported policy bundle version")
        rules: dict[str, PolicyRule] = {}
        for item in data.get("rules") or []:
            if not isinstance(item, dict) or not item.get("id"):
                raise PolicyBundleError("rule missing id")
            rule = PolicyRule(
                id=str(item["id"]),
                action=str(item.get("action", "deny")),
                match={k: str(v) for k, v in (item.get("match") or {}).items()},
            )
            rules[rule.id] = rule
        assignments: list[PolicyAssignment] = []
        for item in data.get("assignments") or []:
            if not isinstance(item, dict):
                continue
            assignments.append(
                PolicyAssignment(
                    priority=int(item.get("priority", 0)),
                    rule_ids=[str(r) for r in item.get("rules") or []],
                    match={k: str(v) for k, v in (item.get("match") or {}).items()},
                )
            )
        assignments.sort(key=lambda a: a.priority, reverse=True)
        bundle_version = str(data.get("bundleVersion") or "1")
        costs = _parse_costs(data.get("costs"))
        return cls(
            version=1,
            bundle_version=bundle_version,
            features=dict(data.get("features") or {}),
            rules=rules,
            assignments=assignments,
            profiles=dict(data.get("profiles") or {}),
            costs=costs,
            org_id=data.get("orgId"),
            raw=data,
        )

    @classmethod
    def load_path(cls, path: str | Path) -> PolicyBundle:
        text = Path(path).read_text(encoding="utf-8")
        if path.__str__().endswith((".yaml", ".yml")):
            try:
                import yaml
            except ImportError as exc:
                raise PolicyBundleError("PyYAML required for .yaml policy files") from exc
            data = yaml.safe_load(text)
        else:
            data = json.loads(text)
        if not isinstance(data, dict):
            raise PolicyBundleError("policy bundle must be an object")
        return cls.from_dict(data)

    def feature_enabled(self, name: str) -> bool:
        block = self.features.get(name)
        if not isinstance(block, dict):
            return False
        return bool(block.get("enabled"))

    def kill_switch_active(self) -> bool:
        block = self.features.get("killSwitch") or {}
        return bool(block.get("active"))

    def cost_for_tool(self, tool: str, *, fallback_usd: float = 0.0) -> float:
        """Resolve per-call USD estimate for budget gates and spend tracking."""
        if self.costs is None:
            return fallback_usd
        for entry in self.costs.tools:
            if pattern_match(entry.tool_pattern, tool):
                return entry.usd_per_call
        return self.costs.default_usd_per_block


def _parse_costs(raw: Any) -> PolicyCosts | None:
    if not isinstance(raw, dict):
        return None
    default = float(raw.get("defaultUsdPerBlock", 0.04))
    tools: list[ToolCostEntry] = []
    for item in raw.get("tools") or []:
        if not isinstance(item, dict):
            continue
        pattern = item.get("toolPattern")
        usd = item.get("usdPerCall")
        if not pattern or usd is None:
            continue
        tools.append(ToolCostEntry(tool_pattern=str(pattern), usd_per_call=float(usd)))
    return PolicyCosts(default_usd_per_block=default, tools=tools)


def pattern_match(pattern: str, value: str) -> bool:
    return fnmatch.fnmatchcase(value, pattern)
