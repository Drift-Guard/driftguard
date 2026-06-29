from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Callable
from urllib.parse import urlparse

from fuseguard.monitor import FuseMonitor
from fuseguard.trip import FuseTrip


ToolHandler = Callable[[str, dict[str, Any]], Any]


class DaemonProxy:
    """Localhost HTTP proxy that forwards tool calls through FuseMonitor."""

    def __init__(self, handler: ToolHandler, monitor: FuseMonitor | None = None) -> None:
        self.handler = handler
        self.monitor = monitor or FuseMonitor.from_env()

    def invoke(self, tool: str, args: dict[str, Any], *, estimated_cost_usd: float = 0.0) -> Any:
        resolved_cost = estimated_cost_usd
        if resolved_cost <= 0 and self.monitor.policy_bundle is not None:
            resolved_cost = self.monitor.policy_bundle.cost_for_tool(tool)
        self.monitor.assert_pre_call_gates(tool, args, estimated_cost_usd=resolved_cost)
        ingress_key = None
        if isinstance(args.get("arguments"), dict):
            self.monitor.assert_ingress_valid(args["arguments"], tool=tool)
        try:
            result = self.handler(tool, args)
        except FuseTrip:
            raise
        except Exception as exc:
            status = getattr(exc, "status_code", None)
            err_class = getattr(exc, "error_class", None) or type(exc).__name__
            try:
                self.monitor.record_call(tool=tool, args=args, status_code=status, error_class=err_class)
            except FuseTrip:
                raise
            raise
        if isinstance(result, dict) and result.get("error"):
            status_code = int(result.get("status", 422))
            err_class = str(result.get("error_class") or result.get("error"))
            self.monitor.record_call(tool=tool, args=args, status_code=status_code, error_class=err_class)
            return result
        self.monitor.assert_response_valid(tool, result)
        self.monitor.record_spend(resolved_cost)
        return result

    def serve(self, host: str = "127.0.0.1", port: int = 9477) -> None:
        proxy = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, fmt: str, *args: Any) -> None:
                return

            def do_POST(self) -> None:
                length = int(self.headers.get("Content-Length", "0"))
                raw = self.rfile.read(length) if length else b"{}"
                try:
                    body = json.loads(raw.decode("utf-8"))
                except json.JSONDecodeError:
                    self.send_error(400, "invalid json")
                    return
                tool = str(body.get("tool") or body.get("name") or "")
                args = body.get("arguments") if isinstance(body.get("arguments"), dict) else body.get("args") or {}
                if not tool:
                    self.send_error(400, "tool required")
                    return
                try:
                    result = proxy.invoke(tool, args if isinstance(args, dict) else {})
                except FuseTrip as trip:
                    payload = trip.to_response_dict()
                    data = json.dumps(payload).encode("utf-8")
                    self.send_response(422)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(data)))
                    self.end_headers()
                    self.wfile.write(data)
                    return
                data = json.dumps({"result": result}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def do_GET(self) -> None:
                path = urlparse(self.path).path
                if path in ("/health", "/healthz"):
                    data = json.dumps({"ok": True, "service": "fuseguard-daemon"}).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(data)))
                    self.end_headers()
                    self.wfile.write(data)
                    return
                self.send_error(404)

        server = ThreadingHTTPServer((host, port), Handler)
        print(f"fuseguard daemon listening on http://{host}:{port}", flush=True)
        server.serve_forever()
