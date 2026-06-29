from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def default_db_path() -> Path:
    return Path.home() / ".fuseguard" / "trips.db"


@dataclass
class LocalStore:
    db_path: Path

    @classmethod
    def open(cls, db_path: str | Path | None = None) -> LocalStore:
        path = Path(db_path) if db_path else default_db_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        store = cls(db_path=path)
        store._migrate()
        return store

    def _migrate(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS trips (
                  trip_id TEXT PRIMARY KEY,
                  reason TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  payload_json TEXT NOT NULL,
                  synced_at TEXT
                );
                CREATE TABLE IF NOT EXISTS sync_queue (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  kind TEXT NOT NULL,
                  payload_json TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  attempts INTEGER DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS sessions (
                  run_id TEXT PRIMARY KEY,
                  agent_id TEXT,
                  parent_run_id TEXT,
                  started_at TEXT,
                  spent_usd REAL DEFAULT 0
                );
                """
            )

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def insert_trip(self, payload: dict[str, Any]) -> None:
        now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        with self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO trips (trip_id, reason, created_at, payload_json) VALUES (?, ?, ?, ?)",
                (payload["tripId"], payload["reason"], payload.get("createdAt", now), json.dumps(payload)),
            )

    def enqueue_sync(self, kind: str, payload: dict[str, Any]) -> None:
        now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO sync_queue (kind, payload_json, created_at) VALUES (?, ?, ?)",
                (kind, json.dumps(payload), now),
            )

    def pending_sync(self, limit: int = 50) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT id, kind, payload_json, attempts FROM sync_queue ORDER BY id LIMIT ?",
                (limit,),
            ).fetchall()
        return [
            {"id": r[0], "kind": r[1], "payload": json.loads(r[2]), "attempts": r[3]}
            for r in rows
        ]

    def mark_synced(self, queue_id: int) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM sync_queue WHERE id = ?", (queue_id,))

    def bump_sync_attempt(self, queue_id: int) -> None:
        with self._connect() as conn:
            conn.execute("UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?", (queue_id,))

    def export_trips_since(self, since_iso: str) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT payload_json FROM trips WHERE created_at >= ? ORDER BY created_at",
                (since_iso,),
            ).fetchall()
        return [json.loads(r[0]) for r in rows]
