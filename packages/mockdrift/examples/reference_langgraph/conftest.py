"""Pytest setup for reference LangGraph examples."""

from __future__ import annotations

import sys
from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parent

# agents.billing.* imports
if str(EXAMPLE_ROOT) not in sys.path:
    sys.path.insert(0, str(EXAMPLE_ROOT))


def pytest_configure(config):
    import os

    os.environ.setdefault("MOCKDRIFT_ROOT", str(EXAMPLE_ROOT))
