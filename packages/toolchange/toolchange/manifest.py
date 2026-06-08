from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


API_VERSION = "toolchange.dev/v1"


@dataclass(frozen=True)
class ToolEntry:
    name: str
    input_schema: dict[str, Any]
    scope: str
    source: str
    source_hash: str | None = None

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "name": self.name,
            "inputSchema": self.input_schema,
            "scope": self.scope,
            "source": self.source,
        }
        if self.source_hash:
            out["sourceHash"] = self.source_hash
        return out


@dataclass(frozen=True)
class ToolManifest:
    api_version: str
    generated_at: str
    tools: tuple[ToolEntry, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "apiVersion": self.api_version,
            "generated_at": self.generated_at,
            "tools": [t.to_dict() for t in self.tools],
        }


def source_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def load_manifest(path: Path) -> ToolManifest:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if raw.get("apiVersion") != API_VERSION:
        raise ValueError(f"Unsupported apiVersion (expected {API_VERSION})")
    tools: list[ToolEntry] = []
    for item in raw.get("tools", []):
        if not isinstance(item, dict):
            raise ValueError("Each tool entry must be an object")
        tools.append(
            ToolEntry(
                name=str(item["name"]),
                input_schema=dict(item.get("inputSchema") or {}),
                scope=str(item.get("scope") or "read"),
                source=str(item.get("source") or ""),
                source_hash=item.get("sourceHash"),
            )
        )
    return ToolManifest(
        api_version=API_VERSION,
        generated_at=str(raw.get("generated_at") or ""),
        tools=tuple(tools),
    )


def write_manifest(path: Path, manifest: ToolManifest) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest.to_dict(), indent=2) + "\n", encoding="utf-8")
