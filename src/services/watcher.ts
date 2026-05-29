import { randomUUID } from "node:crypto";
import {
  createWatch,
  getLatestSnapshot,
  getWatch,
  listDriftEvents,
  listWatches,
  markWatchChecked,
  saveDriftEvent,
  saveSnapshot,
  type WatchRow,
} from "../db/index.js";
import {
  countFreeWatchesWithoutCustomer,
  countWatchesForCustomer,
  type CustomerRow,
} from "../db/customers.js";
import { compareSnapshots, captureSnapshot } from "../core/snapshot.js";
import type { DiffResult } from "../core/diff.js";

const PLAN_LIMITS = {
  free: { maxWatches: 3, minIntervalMinutes: 1440 },
  pro: { maxWatches: 25, minIntervalMinutes: 60 },
  team: { maxWatches: 100, minIntervalMinutes: 15 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string): (typeof PLAN_LIMITS)[Plan] {
  return PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.free;
}

export async function runWatchCheck(watch: WatchRow): Promise<{
  diff: DiffResult | null;
  isFirstSnapshot: boolean;
}> {
  const headers = JSON.parse(watch.headers_json) as Record<string, string>;
  const snapshot = await captureSnapshot(watch.url, watch.watch_type, headers);
  const previous = getLatestSnapshot(watch.id);

  saveSnapshot({
    id: randomUUID(),
    watchId: watch.id,
    schema: snapshot.schema,
    raw: snapshot.raw,
    capturedAt: snapshot.capturedAt,
  });

  markWatchChecked(watch.id);

  if (!previous) {
    return { diff: null, isFirstSnapshot: true };
  }

  const before = {
    watchType: watch.watch_type,
    schema: JSON.parse(previous.schema_json),
    raw: JSON.parse(previous.raw_json),
    capturedAt: previous.captured_at,
  };

  const diff = compareSnapshots(before, snapshot);

  if (diff.hasChanges) {
    const eventId = randomUUID();
    saveDriftEvent({
      id: eventId,
      watchId: watch.id,
      breakingCount: diff.breakingCount,
      warningCount: diff.warningCount,
      infoCount: diff.infoCount,
      changes: diff.changes,
      detectedAt: new Date().toISOString(),
    });

    if (watch.webhook_url) {
      await sendWebhook(watch.webhook_url, watch, diff).catch(() => undefined);
    }
  }

  return { diff, isFirstSnapshot: false };
}

async function sendWebhook(webhookUrl: string, watch: WatchRow, diff: DiffResult): Promise<void> {
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event: "drift.detected",
      watch: { id: watch.id, name: watch.name, url: watch.url, type: watch.watch_type },
      summary: {
        breaking: diff.breakingCount,
        warning: diff.warningCount,
        info: diff.infoCount,
      },
      changes: diff.changes,
    }),
    signal: AbortSignal.timeout(10_000),
  });
}

function watchCountForPlan(plan: Plan, customer?: CustomerRow): number {
  if (customer) return countWatchesForCustomer(customer.id);
  if (plan === "free") return countFreeWatchesWithoutCustomer();
  return listWatches().filter((w) => w.plan === plan).length;
}

export function registerWatch(input: {
  name: string;
  url: string;
  watchType: "api" | "mcp";
  headers?: Record<string, string>;
  webhookUrl?: string;
  email?: string;
  plan?: Plan;
  intervalMinutes?: number;
  customer?: CustomerRow;
}): WatchRow {
  const plan = input.customer?.plan ?? input.plan ?? "free";
  const limits = getPlanLimits(plan);
  const count = watchCountForPlan(plan, input.customer);

  if (count >= limits.maxWatches) {
    throw new Error(
      `Plan '${plan}' allows max ${limits.maxWatches} watches. Upgrade at /pricing`,
    );
  }

  const interval = Math.max(
    input.intervalMinutes ?? limits.minIntervalMinutes,
    limits.minIntervalMinutes,
  );

  return createWatch({
    id: randomUUID(),
    name: input.name,
    url: input.url,
    watchType: input.watchType,
    headers: input.headers,
    webhookUrl: input.webhookUrl,
    email: input.email ?? input.customer?.email,
    plan,
    intervalMinutes: interval,
    customerId: input.customer?.id,
  });
}

export async function checkWatchById(id: string) {
  const watch = getWatch(id);
  if (!watch) throw new Error(`Watch not found: ${id}`);
  return runWatchCheck(watch);
}

export { listWatches, listDriftEvents, getWatch };
