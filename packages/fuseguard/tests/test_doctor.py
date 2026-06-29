import json
from pathlib import Path

import pytest

from fuseguard.doctor import build_doctor_report, format_doctor_report_text


def test_fg_u_056_doctor_reports_device_and_policy(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    policy = tmp_path / "policy.bundle.json"
    policy.write_text(
        json.dumps(
            {
                "version": 1,
                "bundleVersion": "9",
                "features": {"policy": {"enabled": True}, "killSwitch": {"active": False}},
                "rules": [],
                "assignments": [],
                "profiles": {},
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("FUSEGUARD_POLICY_PATH", str(policy))
    report = build_doctor_report()
    assert report["deviceId"]
    assert report["policyBundleVersion"] == "9"
    assert report["killSwitchActive"] is False
    text = format_doctor_report_text(report)
    assert "FuseGuard doctor" in text
    assert "bundle version: 9" in text
