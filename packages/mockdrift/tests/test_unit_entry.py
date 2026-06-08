from __future__ import annotations

import os
from pathlib import Path

import pytest

from mockdrift.langgraph.entry import resolve_entry
from mockdrift.session import MisconfigurationError

EXAMPLE_ROOT = Path(__file__).resolve().parents[1] / "examples" / "reference_langgraph"


def test_resolve_entry_compiles_refund_graph():
    os.environ["MOCKDRIFT_ROOT"] = str(EXAMPLE_ROOT)
    import sys

    if str(EXAMPLE_ROOT) not in sys.path:
        sys.path.insert(0, str(EXAMPLE_ROOT))
    graph = resolve_entry("agents.billing.refund_graph:refund_graph")
    assert hasattr(graph, "invoke")


def test_resolve_entry_rejects_bad_symbol():
    with pytest.raises(MisconfigurationError, match="could not be resolved"):
        resolve_entry("agents.billing.refund_graph:missing_symbol_xyz")


def test_resolve_entry_rejects_malformed_entry():
    with pytest.raises(MisconfigurationError, match="module.path:symbol"):
        resolve_entry("not-a-valid-entry")
