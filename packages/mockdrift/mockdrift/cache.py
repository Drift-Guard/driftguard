from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def cache_root(root: Path | str | None = None) -> Path:
    base = Path(root).resolve() if root is not None else Path.cwd().resolve()
    return base / ".mockdrift" / "cache"


def cache_dir_for_watch(watch_id: str, *, root: Path | str | None = None) -> Path:
    safe = watch_id.replace("/", "_")
    return cache_root(root) / safe


def write_cached_fixture(watch_id: str, cloud_response: dict[str, Any], *, root: Path | str | None = None) -> Path:
    """Materialize cloud fixture payload as on-disk MockDrift fixture files."""
    fixture_dir = cache_dir_for_watch(watch_id, root=root)
    fixture_dir.mkdir(parents=True, exist_ok=True)

    fixture = cloud_response.get("fixture", {})
    (fixture_dir / "before.schema.json").write_text(
        json.dumps(fixture.get("beforeSchema", {}), indent=2) + "\n",
        encoding="utf-8",
    )
    (fixture_dir / "after.schema.json").write_text(
        json.dumps(fixture.get("afterSchema", {}), indent=2) + "\n",
        encoding="utf-8",
    )
    if fixture.get("sampleError"):
        (fixture_dir / "sample-422.json").write_text(
            json.dumps(fixture["sampleError"], indent=2) + "\n",
            encoding="utf-8",
        )
    if fixture.get("metadata"):
        (fixture_dir / "metadata.json").write_text(
            json.dumps(fixture["metadata"], indent=2) + "\n",
            encoding="utf-8",
        )
    if fixture.get("expect"):
        (fixture_dir / "expect.json").write_text(
            json.dumps(fixture["expect"], indent=2) + "\n",
            encoding="utf-8",
        )

    mocks = fixture.get("mockResponses") or {}
    if mocks:
        responses_dir = fixture_dir / "mock-responses"
        responses_dir.mkdir(exist_ok=True)
        for name, data in mocks.items():
            (responses_dir / f"{name}.json").write_text(
                json.dumps(data, indent=2) + "\n",
                encoding="utf-8",
            )

    meta = {
        "watchId": cloud_response.get("watchId", watch_id),
        "fixtureId": cloud_response.get("fixtureId"),
        "eventId": cloud_response.get("eventId"),
        "driftTarget": fixture.get("driftTarget"),
        "match": fixture.get("match", "first_call"),
        "failureProfile": fixture.get("failureProfile"),
    }
    (fixture_dir / "cloud-meta.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    return fixture_dir


def load_cached_fixture(watch_id: str, *, root: Path | str | None = None) -> dict[str, Any] | None:
    fixture_dir = cache_dir_for_watch(watch_id, root=root)
    meta_path = fixture_dir / "cloud-meta.json"
    if not meta_path.is_file():
        return None
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    return {
        "watchId": meta.get("watchId", watch_id),
        "fixtureId": meta.get("fixtureId", f"fixture-{watch_id[:8]}"),
        "status": "cached",
        "eventId": meta.get("eventId"),
        "fixture": {
            "driftTarget": meta.get("driftTarget"),
            "match": meta.get("match", "first_call"),
        },
        "cacheDir": str(fixture_dir),
    }
