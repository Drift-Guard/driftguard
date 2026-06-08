from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class BudgetGate:
    cap_usd: float
    spent_usd: float = field(default=0.0)

    def would_exceed(self, estimated_cost_usd: float) -> bool:
        return self.spent_usd + estimated_cost_usd > self.cap_usd

    def record_spend(self, amount_usd: float) -> None:
        self.spent_usd += amount_usd
