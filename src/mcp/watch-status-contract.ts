/**
 * CP-0.2 status plane — fields returned by GET /api/watches/:id/status.
 * MCP `get_watch_status` proxies this route verbatim (OSS-1).
 */
export const WATCH_STATUS_PLANE_KEYS = [
  "watchId",
  "name",
  "url",
  "watchType",
  "driftStatus",
  "lastCheckedAt",
  "lastCheckStatus",
  "lastError",
  "failureClass",
  "failureLabel",
  "health",
  "incident",
  "lastDriftEvent",
  "agentActions",
] as const;

export const WATCH_STATUS_INCIDENT_KEYS = ["status", "key", "at", "breakingCount"] as const;

export const WATCH_STATUS_HEALTH_KEYS = [
  "band",
  "isStaleCheck",
  "minutesSinceLastCheck",
  "expectedIntervalMinutes",
] as const;

export type WatchStatusPlaneKey = (typeof WATCH_STATUS_PLANE_KEYS)[number];

export function assertWatchStatusPlane(payload: unknown): void {
  if (!payload || typeof payload !== "object") {
    throw new Error("watch status payload must be an object");
  }
  const record = payload as Record<string, unknown>;
  for (const key of WATCH_STATUS_PLANE_KEYS) {
    if (!(key in record)) {
      throw new Error(`watch status missing field: ${key}`);
    }
  }
  const incident = record.incident;
  if (!incident || typeof incident !== "object") {
    throw new Error("watch status incident must be an object");
  }
  for (const key of WATCH_STATUS_INCIDENT_KEYS) {
    if (!(key in (incident as Record<string, unknown>))) {
      throw new Error(`watch status incident missing field: ${key}`);
    }
  }
  const health = record.health;
  if (!health || typeof health !== "object") {
    throw new Error("watch status health must be an object");
  }
  for (const key of WATCH_STATUS_HEALTH_KEYS) {
    if (!(key in (health as Record<string, unknown>))) {
      throw new Error(`watch status health missing field: ${key}`);
    }
  }
  if (!Array.isArray(record.agentActions)) {
    throw new Error("watch status agentActions must be an array");
  }
}
