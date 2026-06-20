from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from fuseguard.config import FuseConfig


@dataclass
class IngressValidateResult:
    ok: bool
    status_code: int
    payload: dict[str, Any]


class IngressValidateGate:
    """Optional ingress validate hook — pairs with egress preflight (drift gate)."""

    def __init__(self, config: FuseConfig) -> None:
        self.config = config

    def validate_payload(self, payload: dict[str, Any]) -> IngressValidateResult:
        if not self.config.api_key:
            raise ValueError("DRIFTGUARD_API_KEY required for FuseGuard ingress gate")

        body: dict[str, Any] = {
            "payload": payload,
            "options": {"mode": self.config.ingress_mode, "profileMode": "hosted"},
        }
        if self.config.ingress_profile_id:
            body["profileId"] = self.config.ingress_profile_id
        elif self.config.ingress_profile:
            body["profile"] = self.config.ingress_profile
        else:
            raise ValueError("FUSEGUARD_INGRESS_PROFILE_ID or FUSEGUARD_INGRESS_PROFILE_JSON required")

        if self.config.ingress_mode == "quarantine" and self.config.ingress_webhook_url:
            body["options"]["webhookUrl"] = self.config.ingress_webhook_url

        url = f"{self.config.api_base.rstrip('/')}/api/validate"
        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "FuseGuard/0.1 (+https://driftguard.org)",
                "X-DriftGuard-Source": "fuseguard",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=self.config.ingress_timeout_sec) as resp:
                raw = resp.read().decode("utf-8")
                parsed = json.loads(raw) if raw else {}
                return IngressValidateResult(ok=bool(parsed.get("ok")), status_code=resp.status, payload=parsed)
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8") if exc.fp else "{}"
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = {"error": raw or exc.reason}
            return IngressValidateResult(ok=False, status_code=exc.code, payload=parsed)
