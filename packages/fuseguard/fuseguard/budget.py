from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class BudgetGate:
    cap_usd: float
    spent_usd: float = field(default=0.0)
    parent: BudgetGate | None = None
    children: dict[str, BudgetGate] = field(default_factory=dict)

    def child_gate(self, child_id: str, cap_usd: float | None = None) -> BudgetGate:
        if child_id not in self.children:
            self.children[child_id] = BudgetGate(cap_usd=cap_usd or self.cap_usd, parent=self)
        return self.children[child_id]

    def would_exceed(self, estimated_cost_usd: float) -> bool:
        if self.parent is not None and self.parent.would_exceed(estimated_cost_usd):
            return True
        return self.spent_usd + estimated_cost_usd > self.cap_usd

    def record_spend(self, amount_usd: float) -> None:
        self.spent_usd += amount_usd
        if self.parent is not None:
            self.parent.record_spend(amount_usd)
