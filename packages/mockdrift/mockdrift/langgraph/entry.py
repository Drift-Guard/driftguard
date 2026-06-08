from __future__ import annotations

import importlib
from typing import Any

from mockdrift.session import MisconfigurationError


def resolve_entry(entry: str) -> Any:
    if ":" not in entry:
        raise MisconfigurationError(f"entry must be module.path:symbol, got {entry!r}")
    module_path, symbol = entry.rsplit(":", 1)
    try:
        module = importlib.import_module(module_path)
        obj = getattr(module, symbol)
    except (ImportError, AttributeError) as exc:
        raise MisconfigurationError(f"entry {entry!r} could not be resolved: {exc}") from exc
    if callable(obj) and not hasattr(obj, "invoke"):
        obj = obj()
    if hasattr(obj, "compile") and not hasattr(obj, "invoke"):
        obj = obj.compile()
    if not hasattr(obj, "invoke"):
        raise MisconfigurationError(f"entry {entry!r} did not resolve to a CompiledGraph")
    return obj
