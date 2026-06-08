from __future__ import annotations

import sys
from pathlib import Path

import pytest

PKG_ROOT = Path(__file__).resolve().parents[1]
EXAMPLE_ROOT = PKG_ROOT / "examples" / "reference_langgraph"

# agents.billing.* imports for layer-2 integration tests
if str(EXAMPLE_ROOT) not in sys.path:
    sys.path.insert(0, str(EXAMPLE_ROOT))


@pytest.fixture
def pkg_root() -> Path:
    return PKG_ROOT


@pytest.fixture
def example_root() -> Path:
    return EXAMPLE_ROOT
