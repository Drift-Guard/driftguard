from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any

from fuseguard.sync_client import device_json_path, load_device, save_device


def ensure_device_id() -> dict[str, Any]:
    device = load_device()
    if not device.get("deviceId"):
        device["deviceId"] = f"dev_{uuid.uuid4().hex[:16]}"
        save_device(device)
    return device


def write_device_meta(**fields: Any) -> dict[str, Any]:
    device = ensure_device_id()
    device.update({k: v for k, v in fields.items() if v is not None})
    save_device(device)
    return device


def device_path() -> Path:
    return device_json_path()
