from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fuseguard.config import FuseConfig
from fuseguard.device import ensure_device_id
from fuseguard.local_store import LocalStore, default_db_path
from fuseguard.policy_bundle import PolicyBundle, PolicyBundleError
from fuseguard.sync_client import load_device


def _policy_path(config: FuseConfig) -> Path:
    if config.policy_path:
        return Path(config.policy_path)
    return Path.home() / ".fuseguard" / "policy.bundle.json"


def build_doctor_report() -> dict[str, Any]:
    config = FuseConfig.from_env()
    device_meta = ensure_device_id()
    enrolled = load_device()
    policy_path = _policy_path(config)
    policy_exists = policy_path.is_file()
    bundle_version: str | None = None
    kill_switch_active = False
    policy_enabled = False
    lint_errors: list[str] = []

    if policy_exists:
        try:
            bundle = PolicyBundle.load_path(policy_path)
            bundle_version = bundle.bundle_version
            kill_switch_active = bundle.kill_switch_active()
            policy_enabled = bundle.feature_enabled("policy")
        except (OSError, PolicyBundleError, json.JSONDecodeError) as exc:
            lint_errors.append(str(exc))

    db_path = Path(config.local_db_path) if config.local_db_path else default_db_path()
    sync_depth = 0
    if db_path.is_file():
        try:
            sync_depth = len(LocalStore.open(db_path).pending_sync(limit=500))
        except OSError:
            sync_depth = -1

    checks = [
        {
            "id": "device_id",
            "ok": bool(device_meta.get("deviceId")),
            "detail": device_meta.get("deviceId") or "missing",
        },
        {
            "id": "enrolled",
            "ok": bool(enrolled.get("credential")),
            "detail": "credential present" if enrolled.get("credential") else "run fuseguard device enroll",
        },
        {
            "id": "policy_bundle",
            "ok": policy_exists and not lint_errors,
            "detail": str(policy_path) if policy_exists else "missing",
        },
        {
            "id": "kill_switch",
            "ok": not kill_switch_active,
            "detail": "active" if kill_switch_active else "off",
        },
        {
            "id": "sync_queue",
            "ok": sync_depth >= 0 and sync_depth < 100,
            "detail": "unavailable" if sync_depth < 0 else str(sync_depth),
        },
    ]

    return {
        "fuseEnabled": fuse_enabled(config),
        "deviceId": device_meta.get("deviceId"),
        "enrolled": bool(enrolled.get("credential")),
        "policyPath": str(policy_path),
        "policyBundleVersion": bundle_version,
        "policyEnabled": policy_enabled,
        "killSwitchActive": kill_switch_active,
        "syncQueueDepth": sync_depth,
        "apiKeyConfigured": bool(config.api_key),
        "environment": config.environment,
        "agentType": config.agent_type,
        "lintErrors": lint_errors,
        "checks": checks,
        "ok": all(c["ok"] for c in checks),
    }


def fuse_enabled(config: FuseConfig) -> bool:
    from fuseguard.config import fuse_enabled as env_fuse_enabled

    return env_fuse_enabled()


def format_doctor_report_text(report: dict[str, Any]) -> str:
    lines = [
        "FuseGuard doctor",
        f"  fuse enabled: {report['fuseEnabled']}",
        f"  deviceId: {report.get('deviceId') or '—'}",
        f"  enrolled: {'yes' if report.get('enrolled') else 'no'}",
        f"  policy: {report.get('policyPath')} ({'ok' if report.get('policyBundleVersion') else 'missing/invalid'})",
        f"  bundle version: {report.get('policyBundleVersion') or '—'}",
        f"  kill switch: {'ACTIVE' if report.get('killSwitchActive') else 'off'}",
        f"  sync queue: {report.get('syncQueueDepth')}",
        f"  api key: {'set' if report.get('apiKeyConfigured') else 'not set'}",
    ]
    for err in report.get("lintErrors") or []:
        lines.append(f"  policy error: {err}")
    for check in report.get("checks") or []:
        mark = "ok" if check.get("ok") else "FAIL"
        lines.append(f"  [{mark}] {check.get('id')}: {check.get('detail')}")
    lines.append(f"overall: {'PASS' if report.get('ok') else 'NEEDS ATTENTION'}")
    return "\n".join(lines)


def doctor_report_json() -> str:
    return json.dumps(build_doctor_report(), indent=2)
