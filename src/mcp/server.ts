#!/usr/bin/env node
/**
 * Public MCP client — local JSON diff only.
 * Continuous monitoring, MCP tool tracking, and alerts run on hosted DriftGuard.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { diffSchemas, inferSchema } from "../core/diff.js";

const HOSTED_API = process.env.DRIFTGUARD_API ?? "https://api.driftguard.org";
const API_KEY = process.env.DRIFTGUARD_API_KEY;

const server = new McpServer({
  name: "driftguard",
  version: "0.2.0",
});

async function hostedRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  if (!API_KEY) {
    throw new Error(
      "Hosted features require DRIFTGUARD_API_KEY. Get Pro at the DriftGuard pricing page.",
    );
  }
  const response = await fetch(`${HOSTED_API}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${API_KEY}`,
      ...(init.headers as Record<string, string>),
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
  }
  return body;
}

server.tool(
  "compare_json",
  "Compare two JSON payloads locally for breaking schema changes",
  {
    before: z.string().describe("JSON string of the previous payload"),
    after: z.string().describe("JSON string of the new payload"),
  },
  async ({ before, after }) => {
    const result = diffSchemas(inferSchema(JSON.parse(before)), inferSchema(JSON.parse(after)));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
);

server.tool(
  "register_watch",
  "Register a URL for continuous drift monitoring (hosted Pro/Team)",
  {
    name: z.string(),
    url: z.string().url(),
    watchType: z.enum(["api", "mcp"]),
    webhookUrl: z.string().url().optional(),
  },
  async (input) => {
    const result = await hostedRequest("/api/watches", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
);

server.tool(
  "check_watch",
  "Run an immediate drift check on a registered watch (hosted)",
  { watchId: z.string().uuid() },
  async ({ watchId }) => {
    const result = await hostedRequest(`/api/watches/${watchId}/check`, { method: "POST" });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
);

server.tool(
  "list_watches",
  "List your hosted drift watches",
  {},
  async () => {
    const result = await hostedRequest("/api/watches");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
);

server.tool(
  "list_drift_events",
  "List recent drift events from hosted monitoring",
  {
    watchId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(50).default(10),
  },
  async ({ watchId, limit }) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (watchId) qs.set("watchId", watchId);
    const result = await hostedRequest(`/api/drift?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
