from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

_VAR_PATTERN = re.compile(r"\{\{mockdrift\.([a-z_]+)(?::([a-zA-Z0-9_.]+))?\}\}")


class ScopeLedger:
    """Transient execution scope for {{mockdrift.*}} variable substitution."""

    def __init__(self) -> None:
        self._uuid = str(uuid.uuid4())
        self._refs: dict[str, Any] = {}

    def remember(self, field: str, value: Any) -> None:
        self._refs[field] = value

    def substitute(self, value: Any) -> Any:
        if isinstance(value, str):
            return self._substitute_string(value)
        if isinstance(value, list):
            return [self.substitute(item) for item in value]
        if isinstance(value, dict):
            return {k: self.substitute(v) for k, v in value.items()}
        return value

    def _substitute_string(self, text: str) -> str:
        def repl(match: re.Match[str]) -> str:
            kind = match.group(1)
            ref_field = match.group(2)
            if kind == "uuid":
                return self._uuid
            if kind == "timestamp":
                return datetime.now(timezone.utc).isoformat()
            if kind == "ref" and ref_field:
                if ref_field not in self._refs:
                    raise KeyError(f"Unknown mockdrift ref: {ref_field}")
                return str(self._refs[ref_field])
            return match.group(0)

        return _VAR_PATTERN.sub(repl, text)
