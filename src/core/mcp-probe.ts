import type { McpToolSnapshot } from "@driftguard/diff-core";

export class McpProbeError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "McpProbeError";
    this.status = status;
  }
}

export type McpProbeOptions = {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  clientName?: string;
  clientVersion?: string;
};

const DEFAULT_TIMEOUT_MS = 30_000;
const PROTOCOL_VERSION = "2024-11-05";

type JsonRpcMessage = {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { message?: string; code?: number };
};

function parseSseJson(text: string): unknown {
  for (const line of text.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    return JSON.parse(data) as unknown;
  }
  throw new McpProbeError("No JSON payload in MCP SSE stream");
}

async function readMcpBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  if (contentType.includes("text/event-stream")) {
    return parseSseJson(await res.text());
  }
  const text = await res.text();
  if (!text.trim()) {
    throw new McpProbeError(`Empty MCP response (HTTP ${res.status})`, res.status);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new McpProbeError(`Unsupported MCP response type: ${contentType || "unknown"}`, res.status);
  }
}

function rpcErrorMessage(body: JsonRpcMessage, status: number): string {
  const rpc = body.error?.message?.trim();
  if (rpc) return rpc;
  return `MCP request failed (HTTP ${status})`;
}

function extractTools(payload: unknown): McpToolSnapshot[] {
  if (!payload || typeof payload !== "object") {
    throw new McpProbeError("tools/list response missing result");
  }
  const root = payload as Record<string, unknown>;
  const result = (root.result ?? root) as Record<string, unknown>;
  const tools = result.tools;
  if (!Array.isArray(tools)) {
    throw new McpProbeError("tools/list response missing tools array");
  }
  const out: McpToolSnapshot[] = [];
  for (const tool of tools) {
    if (!tool || typeof tool !== "object") continue;
    const entry = tool as Record<string, unknown>;
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!name) continue;
    const description = typeof entry.description === "string" ? entry.description : undefined;
    const inputSchema = (entry.inputSchema ?? entry.input_schema) as McpToolSnapshot["inputSchema"];
    out.push({
      name,
      ...(description !== undefined ? { description } : {}),
      ...(inputSchema ? { inputSchema } : {}),
    });
  }
  return out;
}

async function postMcp(
  url: string,
  message: JsonRpcMessage,
  opts: {
    fetchImpl: typeof fetch;
    signal: AbortSignal;
    sessionId?: string;
  },
): Promise<{ body: JsonRpcMessage; sessionId?: string }> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": PROTOCOL_VERSION,
  };
  if (message.method) {
    headers["mcp-method"] = message.method;
  }
  if (opts.sessionId) {
    headers["mcp-session-id"] = opts.sessionId;
  }

  const res = await opts.fetchImpl(url, {
    method: "POST",
    headers,
    body: JSON.stringify(message),
    signal: opts.signal,
  });

  if (res.status >= 400) {
    let detail = `MCP HTTP ${res.status}`;
    try {
      const errBody = (await readMcpBody(res)) as JsonRpcMessage;
      detail = rpcErrorMessage(errBody, res.status);
    } catch {
      // keep status-only message
    }
    throw new McpProbeError(detail, res.status);
  }

  if (res.status === 202) {
    return { body: {}, sessionId: opts.sessionId };
  }

  const body = (await readMcpBody(res)) as JsonRpcMessage;
  if (body.error) {
    throw new McpProbeError(rpcErrorMessage(body, res.status), res.status);
  }
  const sessionId = res.headers.get("mcp-session-id") ?? opts.sessionId;
  return { body, sessionId: sessionId ?? undefined };
}

async function initializeSession(
  url: string,
  opts: { fetchImpl: typeof fetch; signal: AbortSignal; clientName: string; clientVersion: string },
): Promise<string | undefined> {
  const init = await postMcp(
    url,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: opts.clientName, version: opts.clientVersion },
      },
    },
    { fetchImpl: opts.fetchImpl, signal: opts.signal },
  );

  await postMcp(
    url,
    { jsonrpc: "2.0", method: "notifications/initialized" },
    { fetchImpl: opts.fetchImpl, signal: opts.signal, sessionId: init.sessionId },
  );

  return init.sessionId;
}

export async function fetchMcpToolsList(url: string, options: McpProbeOptions = {}): Promise<McpToolSnapshot[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? Number(process.env.DRIFTGUARD_MCP_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const clientName = options.clientName ?? "driftguard-lock";
  const clientVersion = options.clientVersion ?? "0.0.0";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const sessionId = await initializeSession(url, {
      fetchImpl,
      signal: controller.signal,
      clientName,
      clientVersion,
    });

    const tools: McpToolSnapshot[] = [];
    let cursor: string | undefined;
    let page = 0;
    do {
      const list = await postMcp(
        url,
        {
          jsonrpc: "2.0",
          id: 2 + page,
          method: "tools/list",
          params: cursor ? { cursor } : {},
        },
        { fetchImpl, signal: controller.signal, sessionId },
      );
      tools.push(...extractTools(list.body));
      const result = (list.body.result ?? {}) as { nextCursor?: string };
      cursor = typeof result.nextCursor === "string" && result.nextCursor ? result.nextCursor : undefined;
      page += 1;
    } while (cursor);

    return tools;
  } catch (err) {
    if (err instanceof McpProbeError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new McpProbeError(`MCP probe timed out after ${timeoutMs}ms`);
    }
    throw new McpProbeError(err instanceof Error ? err.message : "MCP probe failed");
  } finally {
    clearTimeout(timer);
  }
}

export function parseToolsListResponse(payload: unknown): McpToolSnapshot[] {
  return extractTools({ result: payload });
}
