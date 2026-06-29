from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from fuseguard.local_store import LocalStore
from fuseguard.policy_bundle import PolicyBundle
from fuseguard.trace_upload import MAX_TRACE_PAYLOAD_BYTES, build_trace_upload_payload, trim_trips_to_size_cap


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


def _policy_cache_paths() -> tuple[Path, Path]:
    base = Path.home() / ".fuseguard"
    return base / "policy.bundle.json", base / "policy.etag"


def _cache_policy_bundle(bundle: PolicyBundle, etag: str | None) -> None:
    cache_path, etag_path = _policy_cache_paths()
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(bundle.raw, indent=2) + "\n", encoding="utf-8")
    if etag:
        etag_path.write_text(etag.strip(), encoding="utf-8")


def _load_cached_policy_bundle() -> PolicyBundle | None:
    cache_path, _ = _policy_cache_paths()
    if not cache_path.is_file():
        return None
    return PolicyBundle.load_path(cache_path)


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
        self._policy_cdn_url: str | None = None
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
        _, etag_path = _policy_cache_paths()
        if etag is None and etag_path.is_file():
            etag = etag_path.read_text(encoding="utf-8").strip() or None
        if self._policy_cdn_url:
            cdn_bundle = self._pull_policy_from_cdn(self._policy_cdn_url, etag)
            if cdn_bundle is not None:
                return cdn_bundle
        return self._pull_policy_from_api(etag)

    def _pull_policy_from_cdn(self, url: str, etag: str | None) -> PolicyBundle | None:
        req = urllib.request.Request(url, method="GET", headers={"Accept": "application/json", "User-Agent": "FuseGuard/0.2"})
        if etag:
            req.add_header("If-None-Match", etag)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                bundle = PolicyBundle.from_dict(data if isinstance(data, dict) else {})
                new_etag = resp.headers.get("ETag")
                _cache_policy_bundle(bundle, new_etag)
                return bundle
        except urllib.error.HTTPError as exc:
            if exc.code == 304:
                return _load_cached_policy_bundle()
            return None

    def _pull_policy_from_api(self, etag: str | None) -> PolicyBundle | None:
        url = f"{self.api_base}/v1/fuseguard/policy/bundle"
        req = urllib.request.Request(url, method="GET", headers=self._headers())
        if etag:
            req.add_header("If-None-Match", etag)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                bundle = PolicyBundle.from_dict(data.get("bundle") or data)
                new_etag = resp.headers.get("ETag")
                _cache_policy_bundle(bundle, new_etag)
                return bundle
        except urllib.error.HTTPError as exc:
            if exc.code == 304:
                return _load_cached_policy_bundle()
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
                    if isinstance(payload, dict):
                        if "killSwitchActive" in payload:
                            self.apply_cloud_kill_switch(bool(payload["killSwitchActive"]))
                        cdn_url = payload.get("policyCdnUrl")
                        if isinstance(cdn_url, str) and cdn_url.strip():
                            self._policy_cdn_url = cdn_url.strip()
                        trace_req = payload.get("traceRequest")
                        if isinstance(trace_req, dict):
                            req_id = trace_req.get("traceRequestId")
                            since = trace_req.get("since")
                            if isinstance(req_id, str) and isinstance(since, str):
                                self.upload_trace(req_id, since)
                return 200 <= resp.status < 300
        except urllib.error.HTTPError:
            return False

    def upload_trace(self, trace_request_id: str, since_iso: str) -> bool:
        if self.store is None:
            self.store = LocalStore.open()
        trips, byte_size = build_trace_upload_payload(self.store, since_iso)
        if byte_size > MAX_TRACE_PAYLOAD_BYTES:
            trips = trim_trips_to_size_cap(trips)
        body = {"traceRequestId": trace_request_id, "trips": trips}
        return self._post_json("/v1/fuseguard/devices/trace", body)

    def apply_cloud_kill_switch(self, active: bool) -> None:
        cache_path, _ = _policy_cache_paths()
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
