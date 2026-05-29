import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diffSchemas, inferSchema } from "../core/diff.js";
import { captureSnapshot } from "../core/snapshot.js";
import {
  checkWatchById,
  listDriftEvents,
  listWatches,
  registerWatch,
  runWatchCheck,
} from "../services/watcher.js";
import { watchesDueForCheck } from "../db/index.js";
import { optionalApiKey, requireApiKey } from "./auth.js";
import { billingConfig } from "../billing/lemonsqueezy.js";
import { handleLemonSqueezyWebhook } from "../billing/webhook.js";
import { claimApiKey } from "../billing/claim.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true, service: "driftguard", version: "0.1.0" }));

app.get("/api/billing/config", (c) => {
  try {
    return c.json(billingConfig());
  } catch {
    return c.json({
      provider: "lemonsqueezy",
      currency: "USD",
      pro: { priceUsd: 19, checkoutUrl: null, variantId: null },
      team: { priceUsd: 49, checkoutUrl: null, variantId: null },
      foundingPriceUsd: 15,
      setupRequired: true,
    });
  }
});

app.post("/api/webhooks/lemonsqueezy", handleLemonSqueezyWebhook);
app.post("/api/billing/claim", claimApiKey);

app.get("/api/me", requireApiKey, (c) => {
  const customer = c.get("customer");
  return c.json({
    email: customer.email,
    plan: customer.plan,
    apiKey: customer.api_key,
    status: customer.status,
  });
});

app.use("/api/watches", optionalApiKey);

app.get("/api/watches", (c) => {
  const watches = listWatches().map((w) => ({
    id: w.id,
    name: w.name,
    url: w.url,
    watchType: w.watch_type,
    plan: w.plan,
    intervalMinutes: w.interval_minutes,
    lastCheckedAt: w.last_checked_at,
    createdAt: w.created_at,
  }));
  return c.json({ watches });
});

app.post("/api/watches", async (c) => {
  const body = await c.req.json<{
    name: string;
    url: string;
    watchType: "api" | "mcp";
    headers?: Record<string, string>;
    webhookUrl?: string;
    email?: string;
    plan?: "free" | "pro" | "team";
    intervalMinutes?: number;
  }>();

  try {
    const customer = c.get("customer");
    const watch = registerWatch({ ...body, customer });
    return c.json({ watch }, 201);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Failed to create watch" }, 400);
  }
});

app.post("/api/watches/:id/check", async (c) => {
  const id = c.req.param("id");
  try {
    const result = await checkWatchById(id);
    return c.json(result);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Check failed" }, 400);
  }
});

app.get("/api/drift", (c) => {
  const watchId = c.req.query("watchId");
  const events = listDriftEvents(watchId).map((e) => ({
    id: e.id,
    watchId: e.watch_id,
    breakingCount: e.breaking_count,
    warningCount: e.warning_count,
    infoCount: e.info_count,
    changes: JSON.parse(e.changes_json),
    detectedAt: e.detected_at,
  }));
  return c.json({ events });
});

app.post("/api/diff", async (c) => {
  const body = await c.req.json<{ before: unknown; after: unknown }>();
  const beforeSchema = inferSchema(body.before);
  const afterSchema = inferSchema(body.after);
  return c.json(diffSchemas(beforeSchema, afterSchema));
});

app.post("/api/snapshot", async (c) => {
  const body = await c.req.json<{
    url: string;
    watchType: "api" | "mcp";
    headers?: Record<string, string>;
  }>();
  try {
    const snapshot = await captureSnapshot(body.url, body.watchType, body.headers ?? {});
    return c.json(snapshot);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Snapshot failed" }, 400);
  }
});

app.post("/internal/cron", async (c) => {
  const secret = c.req.header("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const due = watchesDueForCheck();
  const results = [];
  for (const watch of due) {
    try {
      const result = await runWatchCheck(watch);
      results.push({ watchId: watch.id, name: watch.name, ...result });
    } catch (err) {
      results.push({
        watchId: watch.id,
        name: watch.name,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }
  return c.json({ checked: results.length, results });
});

const webRoot = path.join(__dirname, "../../web");
app.use("/*", serveStatic({ root: webRoot }));
app.get("/", serveStatic({ path: "index.html", root: webRoot }));
app.get("/pricing", serveStatic({ path: "pricing.html", root: webRoot }));
app.get("/activate", serveStatic({ path: "activate.html", root: webRoot }));

const port = Number(process.env.PORT ?? 3000);

async function startScheduler(): Promise<void> {
  if (process.env.DISABLE_SCHEDULER === "1") return;
  setInterval(async () => {
    const due = watchesDueForCheck();
    for (const watch of due) {
      try {
        await runWatchCheck(watch);
      } catch {
        // logged per-watch in production
      }
    }
  }, 60_000);
}

console.log(`DriftGuard API listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
startScheduler();

export { app };
