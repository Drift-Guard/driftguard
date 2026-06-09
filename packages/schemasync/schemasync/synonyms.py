from __future__ import annotations

from pathlib import Path
from typing import Mapping

import yaml


def load_synonyms(path: Path | None) -> dict[str, list[str]]:
    if path is None or not path.is_file():
        return {}
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, Mapping):
        return {}
    out: dict[str, list[str]] = {}
    for key, value in data.items():
        if not isinstance(key, str):
            continue
        if isinstance(value, list):
            out[key] = [str(v) for v in value]
        elif isinstance(value, str):
            out[key] = [value]
    return out
