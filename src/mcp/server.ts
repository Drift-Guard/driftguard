#!/usr/bin/env node
/**
 * DriftGuard MCP client — local schema diff + hosted monitoring proxy.
 * Continuous watches, MCP polling, alerts, and history require hosted Pro/Team.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { compactDiffResult, diffSchemas, inferSchema } from "../core/diff.js";
import {
  HOSTED_API,
  HOSTED_CONSOLE,
  HOSTED_PRICING,
  HOSTED_TRIAL,
  hostedFetchSignal,
  SERVER_INSTRUCTIONS,
  VERSION,
} from "./constants.js";
import { parseLocalWatchPreviews } from "./parse-mcp-json.js";
import { readHostedApiKey } from "./env-secrets.js";
import { hostedApiErrorMessage, missingApiKeyMessage, parseJsonString } from "./tool-input.js";

function hostedApiKey(): string | undefined {
  return readHostedApiKey();
}

const server = new McpServer(
  {
    name: "driftguard",
    version: VERSION,
  },
  {
    instructions: SERVER_INSTRUCTIONS,
  },
);

async function hostedRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  const apiKey = hostedApiKey();
  if (!apiKey) {
    throw new Error(missingApiKeyMessage());
  }
  const response = await fetch(`${HOSTED_API}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      ...(init.headers as Record<string, string>),
    },
    signal: hostedFetchSignal(),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(hostedApiErrorMessage(body, response.status));
  }
  return body;
}

function jsonResult(value: unknown, isError = false, compact = false) {
  return {
    content: [
      {
        type: "text" as const,
        text: compact ? JSON.stringify(value) : JSON.stringify(value, null, 2),
      },
    ],
    ...(isError ? { isError: true } : {}),
  };
}

server.tool(
  "compare_json",
  "Local: diff two JSON payloads for breaking schema changes. Use for one-off before/after snapshots (CI fixtures, API responses, MCP tool output). Do NOT use for continuous monitoring — use register_watch (hosted) instead. No API key required. Prefer this over hosted /api/diff for offline or pre-commit checks.",
  {
    before: z.string().describe("JSON string of the previous payload"),
    after: z.string().describe("JSON string of the new payload"),
  },
  async ({ before, after }) => {
    const parsedBeforeResult = parseJsonString(before, "before payload");
    if (!parsedBeforeResult.ok) {
      return jsonResult({ error: parsedBeforeResult.error }, true);
    }
    const parsedAfterResult = parseJsonString(after, "after payload");
    if (!parsedAfterResult.ok) {
      return jsonResult({ error: parsedAfterResult.error }, true);
    }
    const parsedBefore = parsedBeforeResult.value;
    const parsedAfter = parsedAfterResult.value;
    const result = diffSchemas(
      inferSchema(parsedBefore, "$", { markAllFieldsRequired: true }),
      inferSchema(parsedAfter, "$", { markAllFieldsRequired: true }),
    );
    return jsonResult(compactDiffResult(result), false, true);
  },
);

server.tool(
  "parse_mcp_config",
  "Local: preview watch candidates from HTTPS URLs or mcp.json (stdio servers without URLs are skipped). Use before registering watches — no API key. Does NOT create watches or run checks; use suggest_watches (hosted) to import with catalog matching, or register_watch after preview. Pair with compare_json for schema diff only.",
  {
    text: z.string().optional().describe("Free text containing https:// URLs"),
    urls: z.array(z.string()).optional(),
    mcpJson: z.string().optional().describe("JSON string of Cursor/Claude mcp.json"),
  },
  async ({ text, urls, mcpJson }) => {
    let parsed: unknown;
    if (mcpJson) {
      const mcpParsed = parseJsonString(mcpJson, "mcpJson");
      if (!mcpParsed.ok) {
        return jsonResult({ error: mcpParsed.error }, true);
      }
      parsed = mcpParsed.value;
    }
    const previews = parseLocalWatchPreviews({ text, urls, mcpJson: parsed });
    return jsonResult({
      previews,
      count: previews.length,
      note: previews.length
        ? "These are local previews only. Continuous monitoring requires hosted Pro/Team."
        : "No remote URLs found. stdio MCP servers need hosted MCP polling — not available in this repo.",
      nextSteps: {
        trial: HOSTED_TRIAL,
        pricing: HOSTED_PRICING,
        hostedTool: hostedApiKey() ? "suggest_watches with create:true" : "Set DRIFTGUARD_API_KEY then call suggest_watches",
      },
    });
  },
);

server.tool(
  "hosted_info",
  "Local: explain which DriftGuard tools work offline vs hosted, pricing, and upgrade paths. Use when the user asks about self-hosting, API keys, trials, or why a hosted tool failed. Works offline — no API key. Prefer this before retrying hosted tools without a key.",
  {},
  async () =>
    jsonResult({
      repo: "https://github.com/kioie/driftguard",
      model: "open-core",
      primaryActivationEnv: "DRIFTGUARD_API_KEY",
      offlineTools: ["compare_json", "parse_mcp_config", "hosted_info", "explain_drift"],
      hostedTools: [
        "register_watch",
        "check_watch",
        "get_watch_status",
        "get_agent_status",
        "list_affected_agents",
        "acknowledge_drift",
        "trigger_remediation",
        "list_watches",
        "list_drift_events",
        "suggest_watches",
        "assert_coverage",
        "assert_a2a_coverage",
      ],
      apiKeyConfigured: Boolean(hostedApiKey()),
      hostedApi: HOSTED_API,
      console: HOSTED_CONSOLE,
      trial: HOSTED_TRIAL,
      pricing: HOSTED_PRICING,
      selfHostNote:
        "Works offline for diff and mcp.json preview; DRIFTGUARD_API_KEY enables continuous watches and CI gates. Full monitoring stack is hosted SaaS — not self-hostable from the public repo.",
    }),
);

server.tool(
  "register_watch",
  "Hosted Pro/Team: register a URL for continuous drift monitoring (API JSON/OpenAPI or remote MCP). Use after parse_mcp_config preview. Requires DRIFTGUARD_API_KEY. Do NOT use compare_json for ongoing monitoring.",
  {
    name: z.string(),
    url: z.string().url(),
    watchType: z.enum(["api", "mcp"]),
    webhookUrl: z.string().url().optional(),
  },
  async (input) => jsonResult(await hostedRequest("/api/watches", { method: "POST", body: JSON.stringify(input) })),
);

server.tool(
  "check_watch",
  "Hosted: run an immediate drift check on a registered watch. Requires API key. Use after register_watch or list_watches — not for one-off JSON diff (use compare_json).",
  { watchId: z.string().uuid() },
  async ({ watchId }) =>
    jsonResult(await hostedRequest(`/api/watches/${watchId}/check`, { method: "POST" })),
);

server.tool(
  "list_watches",
  "Hosted: list your drift watches and health status. Requires API key. Use before check_watch or list_drift_events.",
  {},
  async () => jsonResult(await hostedRequest("/api/watches")),
);

server.tool(
  "get_watch_status",
  "Hosted: query canonical drift_status, incident state, latest drift event, and agentActions for one watch. Requires API key. Use before orchestrator runs or to gate agent deploys — pair with compare_json for local diff only.",
  { watchId: z.string().uuid() },
  async ({ watchId }) => jsonResult(await hostedRequest(`/api/watches/${watchId}/status`)),
);

server.tool(
  "get_agent_status",
  "Hosted: query agent binding contract status (ok/blocked/degraded), bound watches, and policy action. Requires API key. Use agent id or slug from agents.yaml — pair with preflight before orchestrator runs.",
  { agentId: z.string().min(1) },
  async ({ agentId }) => jsonResult(await hostedRequest(`/api/agents/${encodeURIComponent(agentId)}/status`)),
);

server.tool(
  "list_affected_agents",
  "Hosted: list agent bindings that depend on a watch (policies + ids). Requires API key. Use after drift.detected on a watch to see which agents are impacted.",
  { watchId: z.string().uuid() },
  async ({ watchId }) =>
    jsonResult(await hostedRequest(`/api/watches/${watchId}/affected-agents`)),
);

server.tool(
  "acknowledge_drift",
  "Hosted: acknowledge the open drift incident on a watch (unblocks ack-gated agents per policy). Requires API key. Use after human review before resuming agent runs.",
  { watchId: z.string().uuid() },
  async ({ watchId }) =>
    jsonResult(
      await hostedRequest(`/api/watches/${watchId}/incident/ack`, { method: "POST" }),
    ),
);

server.tool(
  "trigger_remediation",
  "Hosted: open a SchemaSync remediation draft PR for a watch (draft_pr policy + GitHub App install). Requires API key. Use after breaking drift when auto-remediation did not run or you need to retry.",
  {
    watchId: z.string().uuid(),
    driftEventId: z.string().uuid().optional(),
  },
  async ({ watchId, driftEventId }) =>
    jsonResult(
      await hostedRequest(`/api/watches/${watchId}/trigger_remediation`, {
        method: "POST",
        body: JSON.stringify(driftEventId ? { driftEventId } : {}),
      }),
    ),
);

server.tool(
  "list_drift_events",
  "Hosted: list recent drift events from continuous monitoring. Requires API key. For one-off JSON comparison use compare_json instead.",
  {
    watchId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(50).default(10),
  },
  async ({ watchId, limit }) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (watchId) qs.set("watchId", watchId);
    return jsonResult(await hostedRequest(`/api/drift?${qs}`));
  },
);

server.tool(
  "suggest_watches",
  "Hosted Pro/Team: parse URLs/mcp.json with catalog matching and optionally create watches. Use instead of parse_mcp_config when you have an API key and want auto-import. Requires DRIFTGUARD_API_KEY.",
  {
    text: z.string().optional(),
    urls: z.array(z.string()).optional(),
    mcpJson: z.string().optional().describe("JSON string of mcp.json"),
    create: z.boolean().optional(),
  },
  async ({ text, urls, mcpJson, create }) => {
    const body: Record<string, unknown> = { text, urls, create };
    if (mcpJson) {
      const parsed = parseJsonString(mcpJson, "mcpJson");
      if (!parsed.ok) return jsonResult({ error: parsed.error }, true);
      body.mcpJson = parsed.value;
    }
    return jsonResult(
      await hostedRequest("/api/watches/suggest", { method: "POST", body: JSON.stringify(body) }),
    );
  },
);

server.tool(
  "explain_drift",
  "Explain SchemaChange objects with remediation hints (agentAction). Works without API key. Use after compare_json when breakingCount > 0. Does not register watches.",
  { changesJson: z.string().describe("JSON array of SchemaChange objects from compare_json") },
  async ({ changesJson }) => {
    const parsed = parseJsonString(changesJson, "changesJson");
    if (!parsed.ok) return jsonResult({ error: parsed.error }, true);
    const result = await fetch(`${HOSTED_API}/api/drift/explain`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ changes: parsed.value }),
      signal: hostedFetchSignal(),
    }).then((r) => r.json());
    return jsonResult(result);
  },
);

server.tool(
  "assert_a2a_coverage",
  "Hosted Pro/Team CI gate: fail when agents.yaml watch URLs are not registered on your account. Requires API key. Use after lint-agents (offline) — not for local manifest validation.",
  {
    manifestYaml: z.string().describe("agents.yaml file contents"),
  },
  async ({ manifestYaml }) => {
    const apiKey = hostedApiKey();
    if (!apiKey) {
      return jsonResult({ error: missingApiKeyMessage() }, true);
    }
    const { validateAgentsYamlText } = await import("../agents/validate.js");
    const lint = validateAgentsYamlText(manifestYaml);
    if (!lint.ok) {
      return jsonResult({ error: "Invalid agents manifest", errors: lint.errors }, true);
    }
    const response = await fetch(`${HOSTED_API}/api/a2a/coverage/assert`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ manifest: lint.manifest }),
      signal: hostedFetchSignal(),
    });
    const result = await response.json();
    return jsonResult(result, !response.ok);
  },
);

server.tool(
  "assert_coverage",
  "Hosted Pro/Team CI gate: fail if suggested dependencies are not yet watched. Requires API key. Use in CI after mcp.json changes — not for local diff (use compare_json).",
  {
    text: z.string().optional(),
    mcpJson: z.string().optional(),
  },
  async ({ text, mcpJson }) => {
    const apiKey = hostedApiKey();
    if (!apiKey) {
      return jsonResult({ error: missingApiKeyMessage() }, true);
    }
    const body: Record<string, unknown> = { text };
    if (mcpJson) {
      const parsed = parseJsonString(mcpJson, "mcpJson");
      if (!parsed.ok) return jsonResult({ error: parsed.error }, true);
      body.mcpJson = parsed.value;
    }
    const response = await fetch(`${HOSTED_API}/api/coverage/assert`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: hostedFetchSignal(),
    });
    const result = await response.json();
    return jsonResult(result, !response.ok);
  },
);

export async function startMcpServer(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

const isMain = process.argv[1]?.endsWith("server.js") || process.argv[1]?.includes("server.ts");
if (isMain) {
  startMcpServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
