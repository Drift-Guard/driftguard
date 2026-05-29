import { diffMcpTools, diffSchemas, inferSchema, type DiffResult, type McpToolSnapshot } from "./diff.js";

export type WatchType = "api" | "mcp";

export interface SnapshotResult {
  watchType: WatchType;
  schema: Record<string, unknown>;
  raw: unknown;
  capturedAt: string;
}

export async function captureSnapshot(
  url: string,
  watchType: WatchType,
  headers: Record<string, string> = {},
): Promise<SnapshotResult> {
  const capturedAt = new Date().toISOString();

  if (watchType === "mcp") {
    const tools = await fetchMcpTools(url, headers);
    return {
      watchType,
      schema: { tools },
      raw: tools,
      capturedAt,
    };
  }

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  const raw = contentType.includes("application/json")
    ? await response.json()
    : { body: await response.text() };

  return {
    watchType,
    schema: inferSchema(raw) as Record<string, unknown>,
    raw,
    capturedAt,
  };
}

async function fetchMcpTools(url: string, headers: Record<string, string>): Promise<McpToolSnapshot[]> {
  const initResponse = await mcpRequest(url, headers, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "driftguard", version: "0.1.0" },
    },
  });

  if (initResponse.error) {
    throw new Error(`MCP initialize failed: ${JSON.stringify(initResponse.error)}`);
  }

  await mcpRequest(url, headers, {
    jsonrpc: "2.0",
    method: "notifications/initialized",
  });

  const toolsResponse = await mcpRequest(url, headers, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });

  if (toolsResponse.error) {
    throw new Error(`MCP tools/list failed: ${JSON.stringify(toolsResponse.error)}`);
  }

  const tools = (toolsResponse.result as { tools?: McpToolSnapshot[] })?.tools ?? [];
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema as Record<string, unknown> | undefined,
  }));
}

async function mcpRequest(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
): Promise<{ result?: unknown; error?: unknown }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`MCP HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  const dataLine = text
    .split("\n")
    .find((line) => line.startsWith("data: "))
    ?.slice(6);

  if (dataLine) {
    return JSON.parse(dataLine) as { result?: unknown; error?: unknown };
  }

  return JSON.parse(text) as { result?: unknown; error?: unknown };
}

export function compareSnapshots(
  before: SnapshotResult,
  after: SnapshotResult,
): DiffResult {
  if (before.watchType === "mcp" && after.watchType === "mcp") {
    return diffMcpTools(
      (before.raw as McpToolSnapshot[]) ?? [],
      (after.raw as McpToolSnapshot[]) ?? [],
    );
  }
  return diffSchemas(
    before.schema as Record<string, unknown>,
    after.schema as Record<string, unknown>,
  );
}
