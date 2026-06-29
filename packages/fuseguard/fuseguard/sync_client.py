from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from fuseguard.local_store import LocalStore
from fuseguard.policy_bundle import PolicyBundle


def device_json_path() -> Path:
    return Path.home() / ".fuseguard" / "device.json"


def load_device() -> dict[str, Any]:
    path = device_json_path()
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_device(data: dict[str, Any]) -> None:
    path = device_json_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


class SyncClient:
    def __init__(
        self,
        *,
        api_base: str | None = None,
        api_key: str | None = None,
        device_credential: str | None = None,
        store: LocalStore | None = None,
    ) -> None:
        self.api_base = (api_base or os.environ.get("DRIFTGUARD_API", "https://driftguard.org")).rstrip("/")
        self.api_key = api_key or os.environ.get("DRIFTGUARD_API_KEY", "").strip() or None
        self.device_credential = device_credential
        self.store = store or LocalStore.open()
        device = load_device()
        if not self.device_credential:
            self.device_credential = device.get("credential")

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json", "Accept": "application/json", "User-Agent": "FuseGuard/0.2"}
        if self.device_credential:
            headers["Authorization"] = f"Bearer {self.device_credential}"
        elif self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def pull_policy_bundle(self, etag: str | None = None) -> PolicyBundle | None:
        url = f"{self.api_base}/v1/fuseguard/policy/bundle"
        req = urllib.request.Request(url, method="GET", headers=self._headers())
        if etag:
            req.add_header("If-None-Match", etag)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                bundle = PolicyBundle.from_dict(data.get("bundle") or data)
                cache_path = Path.home() / ".fuseguard" / "policy.bundle.json"
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                cache_path.write_text(json.dumps(bundle.raw, indent=2) + "\n", encoding="utf-8")
                new_etag = resp.headers.get("ETag")
                if new_etag:
                    (Path.home() / ".fuseguard" / "policy.etag").write_text(new_etag.strip(), encoding="utf-8")
                return bundle
        except urllib.error.HTTPError as exc:
            if exc.code == 304:
                cache_path = Path.home() / ".fuseguard" / "policy.bundle.json"
                if cache_path.is_file():
                    return PolicyBundle.load_path(cache_path)
            return None

    def push_pending(self) -> int:
        sent = 0
        for item in self.store.pending_sync():
            kind = item["kind"]
            if kind == "heartbeat":
                ok = self._post_json("/v1/fuseguard/devices/heartbeat", item["payload"])
            elif kind in ("block", "sample", "rollup"):
                ok = self._post_json("/v1/fuseguard/events/batch", {"events": [item["payload"]]})
            else:
                ok = False
            if ok:
                self.store.mark_synced(item["id"])
                sent += 1
            else:
                self.store.bump_sync_attempt(item["id"])
        return sent

    def _post_json(self, path: str, body: dict[str, Any]) -> bool:
        url = f"{self.api_base}{path}"
        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST", headers=self._headers())
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if path.endswith("/heartbeat"):
                    payload = json.loads(resp.read().decode("utf-8"))
                    if isinstance(payload, dict) and "killSwitchActive" in payload:
                        self.apply_cloud_kill_switch(bool(payload["killSwitchActive"]))
                return 200 <= resp.status < 300
        except urllib.error.HTTPError:
            return False

    def apply_cloud_kill_switch(self, active: bool) -> None:
        cache_path = Path.home() / ".fuseguard" / "policy.bundle.json"
        if not cache_path.is_file():
            return
        data = json.loads(cache_path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return
        features = data.setdefault("features", {})
        if not isinstance(features, dict):
            return
        kill = features.setdefault("killSwitch", {})
        if not isinstance(kill, dict):
            kill = {}
            features["killSwitch"] = kill
        kill["active"] = bool(active)
        cache_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    def enroll(self, token: str, device_meta: dict[str, Any]) -> dict[str, Any]:
        payload = {"token": token, **device_meta}
        url = f"{self.api_base}/v1/fuseguard/devices/enroll"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            method="POST",
            headers={"Content-Type": "application/json", "User-Agent": "FuseGuard/0.2"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            save_device(result)
            self.device_credential = result.get("credential")
            return result
