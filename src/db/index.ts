import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { migrateCustomers } from "./customers.js";

const DB_PATH = process.env.DRIFTGUARD_DB ?? path.join(process.cwd(), "driftguard.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    migrate(db);
  }
  return db;
}

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS watches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      watch_type TEXT NOT NULL CHECK (watch_type IN ('api', 'mcp')),
      headers_json TEXT DEFAULT '{}',
      webhook_url TEXT,
      email TEXT,
      plan TEXT NOT NULL DEFAULT 'free',
      interval_minutes INTEGER NOT NULL DEFAULT 1440,
      created_at TEXT NOT NULL,
      last_checked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id TEXT PRIMARY KEY,
      watch_id TEXT NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
      schema_json TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      captured_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drift_events (
      id TEXT PRIMARY KEY,
      watch_id TEXT NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
      breaking_count INTEGER NOT NULL,
      warning_count INTEGER NOT NULL,
      info_count INTEGER NOT NULL,
      changes_json TEXT NOT NULL,
      detected_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_watch ON snapshots(watch_id, captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_events_watch ON drift_events(watch_id, detected_at DESC);
  `);
  migrateCustomers(database);
}

export interface WatchRow {
  id: string;
  name: string;
  url: string;
  watch_type: "api" | "mcp";
  headers_json: string;
  webhook_url: string | null;
  email: string | null;
  plan: string;
  interval_minutes: number;
  created_at: string;
  last_checked_at: string | null;
  customer_id: string | null;
}

export function createWatch(input: {
  id: string;
  name: string;
  url: string;
  watchType: "api" | "mcp";
  headers?: Record<string, string>;
  webhookUrl?: string;
  email?: string;
  plan?: string;
  intervalMinutes?: number;
  customerId?: string;
}): WatchRow {
  const database = getDb();
  const row: WatchRow = {
    id: input.id,
    name: input.name,
    url: input.url,
    watch_type: input.watchType,
    headers_json: JSON.stringify(input.headers ?? {}),
    webhook_url: input.webhookUrl ?? null,
    email: input.email ?? null,
    plan: input.plan ?? "free",
    interval_minutes: input.intervalMinutes ?? 1440,
    created_at: new Date().toISOString(),
    last_checked_at: null,
    customer_id: input.customerId ?? null,
  };
  database
    .prepare(
      `INSERT INTO watches (id, name, url, watch_type, headers_json, webhook_url, email, plan, interval_minutes, created_at, customer_id)
       VALUES (@id, @name, @url, @watch_type, @headers_json, @webhook_url, @email, @plan, @interval_minutes, @created_at, @customer_id)`,
    )
    .run(row);
  return row;
}

export function listWatches(): WatchRow[] {
  return getDb().prepare("SELECT * FROM watches ORDER BY created_at DESC").all() as WatchRow[];
}

export function getWatch(id: string): WatchRow | undefined {
  return getDb().prepare("SELECT * FROM watches WHERE id = ?").get(id) as WatchRow | undefined;
}

export function saveSnapshot(input: {
  id: string;
  watchId: string;
  schema: unknown;
  raw: unknown;
  capturedAt: string;
}): void {
  getDb()
    .prepare(
      `INSERT INTO snapshots (id, watch_id, schema_json, raw_json, captured_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      input.id,
      input.watchId,
      JSON.stringify(input.schema),
      JSON.stringify(input.raw),
      input.capturedAt,
    );
}

export function getLatestSnapshot(watchId: string): {
  schema_json: string;
  raw_json: string;
  captured_at: string;
} | undefined {
  return getDb()
    .prepare(
      `SELECT schema_json, raw_json, captured_at FROM snapshots
       WHERE watch_id = ? ORDER BY captured_at DESC LIMIT 1`,
    )
    .get(watchId) as { schema_json: string; raw_json: string; captured_at: string } | undefined;
}

export function saveDriftEvent(input: {
  id: string;
  watchId: string;
  breakingCount: number;
  warningCount: number;
  infoCount: number;
  changes: unknown;
  detectedAt: string;
}): void {
  getDb()
    .prepare(
      `INSERT INTO drift_events (id, watch_id, breaking_count, warning_count, info_count, changes_json, detected_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.id,
      input.watchId,
      input.breakingCount,
      input.warningCount,
      input.infoCount,
      JSON.stringify(input.changes),
      input.detectedAt,
    );
}

export function listDriftEvents(watchId?: string, limit = 20): Array<{
  id: string;
  watch_id: string;
  breaking_count: number;
  warning_count: number;
  info_count: number;
  changes_json: string;
  detected_at: string;
}> {
  if (watchId) {
    return getDb()
      .prepare(
        `SELECT * FROM drift_events WHERE watch_id = ? ORDER BY detected_at DESC LIMIT ?`,
      )
      .all(watchId, limit) as Array<{
      id: string;
      watch_id: string;
      breaking_count: number;
      warning_count: number;
      info_count: number;
      changes_json: string;
      detected_at: string;
    }>;
  }
  return getDb()
    .prepare(`SELECT * FROM drift_events ORDER BY detected_at DESC LIMIT ?`)
    .all(limit) as Array<{
    id: string;
    watch_id: string;
    breaking_count: number;
    warning_count: number;
    info_count: number;
    changes_json: string;
    detected_at: string;
  }>;
}

export function markWatchChecked(watchId: string): void {
  getDb()
    .prepare(`UPDATE watches SET last_checked_at = ? WHERE id = ?`)
    .run(new Date().toISOString(), watchId);
}

export function watchesDueForCheck(): WatchRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM watches
       WHERE last_checked_at IS NULL
          OR datetime(last_checked_at, '+' || interval_minutes || ' minutes') <= datetime('now')
       ORDER BY last_checked_at ASC NULLS FIRST`,
    )
    .all() as WatchRow[];
}

export function countWatchesForPlan(plan: string): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) as count FROM watches WHERE plan = ?`)
    .get(plan) as { count: number };
  return row.count;
}
