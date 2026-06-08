from __future__ import annotations

from pathlib import Path

import pytest

PKG_ROOT = Path(__file__).resolve().parents[1]
EXAMPLE_ROOT = PKG_ROOT / "examples" / "reference_langgraph"


@pytest.fixture
def pkg_root() -> Path:
    return PKG_ROOT


@pytest.fixture
def example_root() -> Path:
    return EXAMPLE_ROOT
