"""FG-P-040..042 — policy CDN pull via heartbeat policyCdnUrl."""

from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from fuseguard.sync_client import SyncClient


class _CdnHandler(BaseHTTPRequestHandler):
    bundle: dict = {}

    def log_message(self, fmt: str, *args) -> None:  # noqa: ARG002
        return

    def do_GET(self) -> None:
        data = json.dumps(self.bundle).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("ETag", '"fuse-cdn-1"')
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def test_fg_p_042_sync_client_prefers_cdn():
    bundle = {
        "version": 1,
        "bundleVersion": "cdn-1",
        "features": {"policy": {"enabled": True}},
        "rules": [],
        "assignments": [],
        "costs": {"defaultUsdPerBlock": 0.05, "tools": []},
    }
    _CdnHandler.bundle = bundle
    server = ThreadingHTTPServer(("127.0.0.1", 0), _CdnHandler)
    port = server.server_address[1]
    cdn_url = f"http://127.0.0.1:{port}/cdn/fuse/policy/acct/cdn-1.json"

    client = SyncClient(api_base="http://127.0.0.1:9")
    client._policy_cdn_url = cdn_url

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        pulled = client.pull_policy_bundle()
        assert pulled is not None
        assert pulled.bundle_version == "cdn-1"
        assert pulled.cost_for_tool("any") == 0.05
    finally:
        server.shutdown()
