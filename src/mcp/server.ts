#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { diffSchemas, inferSchema } from "../core/diff.js";
import { captureSnapshot } from "../core/snapshot.js";
import {
  checkWatchById,
  listDriftEvents,
  listWatches,
  registerWatch,
} from "../services/watcher.js";

const API_BASE = process.env.DRIFTGUARD_API ?? "http://localhost:3000";

const server = new McpServer({
  name: "driftguard",
  version: "0.1.0",
});

server.tool(
  "compare_json",
  "Compare two JSON payloads and detect breaking schema changes",
  {
    before: z.string().describe("JSON string of the previous payload"),
    after: z.string().describe("JSON string of the new payload"),
  },
  async ({ before, after }) => {
    const beforeSchema = inferSchema(JSON.parse(before));
    const afterSchema = inferSchema(JSON.parse(after));
    const result = diffSchemas(beforeSchema, afterSchema);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "snapshot_url",
  "Capture a schema snapshot from an API endpoint or MCP server URL",
  {
    url: z.string().url(),
    watchType: z.enum(["api", "mcp"]).default("api"),
  },
  async ({ url, watchType }) => {
    const snapshot = await captureSnapshot(url, watchType);
    return {
      content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }],
    };
  },
);

server.tool(
  "register_watch",
  "Register a URL for continuous drift monitoring (free: 3 watches, daily checks)",
  {
    name: z.string(),
    url: z.string().url(),
    watchType: z.enum(["api", "mcp"]),
    webhookUrl: z.string().url().optional(),
    email: z.string().email().optional(),
  },
  async ({ name, url, watchType, webhookUrl, email }) => {
    const watch = registerWatch({ name, url, watchType, webhookUrl, email });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              message: "Watch registered. First snapshot captured on next check.",
              watch: {
                id: watch.id,
                name: watch.name,
                url: watch.url,
                watchType: watch.watch_type,
                plan: watch.plan,
                intervalMinutes: watch.interval_minutes,
              },
              upgrade: "Pro ($19/mo): 25 watches, hourly checks → https://driftguard.org/pricing",
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

server.tool(
  "check_watch",
  "Run an immediate drift check on a registered watch",
  { watchId: z.string().uuid() },
  async ({ watchId }) => {
    const result = await checkWatchById(watchId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.tool(
  "list_watches",
  "List all registered drift watches",
  {},
  async () => {
    const watches = listWatches();
    return {
      content: [{ type: "text", text: JSON.stringify(watches, null, 2) }],
    };
  },
);

server.tool(
  "list_drift_events",
  "List recent schema drift events",
  {
    watchId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(50).default(10),
  },
  async ({ watchId, limit }) => {
    const events = listDriftEvents(watchId, limit);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            events.map((e) => ({
              ...e,
              changes: JSON.parse(e.changes_json),
            })),
            null,
            2,
          ),
        },
      ],
    };
  },
);

server.tool(
  "hosted_diff",
  "Call the hosted DriftGuard API to diff two payloads (uses cloud if local DB empty)",
  {
    before: z.string(),
    after: z.string(),
  },
  async ({ before, after }) => {
    const response = await fetch(`${API_BASE}/api/diff`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        before: JSON.parse(before),
        after: JSON.parse(after),
      }),
    });
    const result = await response.json();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
