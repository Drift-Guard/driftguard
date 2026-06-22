import type { JsonSchema } from "./types.js";
import { stableStringify, type McpToolSnapshot } from "./mcp.js";

export class LockfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LockfileError";
  }
}

export const LOCKFILE_VERSION = 1 as const;
export const DEFAULT_LOCKFILE_PATH = "driftguard-lock.json";
export const LOCKFILE_GENERATOR = "@driftguard/driftguard";

export interface McpLockTool {
  name: string;
  description?: string;
  inputSchema?: JsonSchema;
}

export interface McpLockServer {
  name: string;
  transport: "streamable-http";
  url: string;
  tools: McpLockTool[];
}

export interface McpLockfileV1 {
  lockfileVersion: typeof LOCKFILE_VERSION;
  generator: string;
  generatedAt: string;
  servers: McpLockServer[];
}

function slugServerName(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeSchema(schema: unknown): JsonSchema | undefined {
  if (schema === undefined || schema === null) return undefined;
  if (typeof schema !== "object") {
    throw new LockfileError("tool inputSchema must be an object");
  }
  return JSON.parse(stableStringify(schema)) as JsonSchema;
}

export function normalizeLockTool(raw: unknown): McpLockTool {
  if (!raw || typeof raw !== "object") {
    throw new LockfileError("malformed tool entry");
  }
  const tool = raw as Record<string, unknown>;
  const name = typeof tool.name === "string" ? tool.name.trim() : "";
  if (!name) {
    throw new LockfileError("tool missing name");
  }
  const description = typeof tool.description === "string" ? tool.description : undefined;
  const schemaRaw = tool.inputSchema ?? tool.input_schema;
  const inputSchema = schemaRaw === undefined ? undefined : normalizeSchema(schemaRaw);
  return { name, ...(description !== undefined ? { description } : {}), ...(inputSchema ? { inputSchema } : {}) };
}

export function normalizeLockTools(tools: unknown[]): McpLockTool[] {
  if (!Array.isArray(tools)) {
    throw new LockfileError("tools must be an array");
  }
  return tools.map(normalizeLockTool).sort((a, b) => a.name.localeCompare(b.name));
}

export function toolsFromProbe(tools: McpToolSnapshot[]): McpLockTool[] {
  return normalizeLockTools(
    tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  );
}

export function listMcpJsonHttpServers(mcpJson: unknown): Array<{ name: string; url: string }> {
  if (!mcpJson || typeof mcpJson !== "object") {
    throw new LockfileError("mcp.json must be an object");
  }
  const root = mcpJson as Record<string, unknown>;
  const servers =
    (root.mcpServers as Record<string, { url?: string }> | undefined) ??
    (root.servers as Record<string, { url?: string }> | undefined);
  if (!servers || typeof servers !== "object") {
    throw new LockfileError("mcp.json missing mcpServers");
  }

  const out: Array<{ name: string; url: string }> = [];
  for (const [key, cfg] of Object.entries(servers)) {
    if (!cfg || typeof cfg !== "object") continue;
    const url = typeof cfg.url === "string" ? cfg.url.trim() : "";
    if (!url.startsWith("http")) continue;
    out.push({ name: slugServerName(key) || "mcp-server", url });
  }
  if (!out.length) {
    throw new LockfileError("mcp.json has no HTTP MCP servers with url");
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildLockServer(input: {
  name: string;
  url: string;
  tools: unknown[];
}): McpLockServer {
  const url = input.url.trim();
  if (!url.startsWith("http")) {
    throw new LockfileError(`server '${input.name}' url must be http(s)`);
  }
  return {
    name: input.name,
    transport: "streamable-http",
    url,
    tools: normalizeLockTools(input.tools),
  };
}

export function buildLockfile(
  servers: McpLockServer[],
  opts?: { generator?: string; generatedAt?: string },
): McpLockfileV1 {
  if (!servers.length) {
    throw new LockfileError("lockfile requires at least one server");
  }
  return {
    lockfileVersion: LOCKFILE_VERSION,
    generator: opts?.generator ?? LOCKFILE_GENERATOR,
    generatedAt: opts?.generatedAt ?? new Date().toISOString(),
    servers: servers
      .map((server) => ({
        ...server,
        url: server.url.trim(),
        tools: normalizeLockTools(server.tools),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function parseLockfile(raw: unknown): McpLockfileV1 {
  if (!raw || typeof raw !== "object") {
    throw new LockfileError("lockfile must be a JSON object");
  }
  const doc = raw as Record<string, unknown>;
  if (doc.lockfileVersion !== LOCKFILE_VERSION) {
    throw new LockfileError(`unsupported lockfileVersion (expected ${LOCKFILE_VERSION})`);
  }
  if (!Array.isArray(doc.servers) || !doc.servers.length) {
    throw new LockfileError("lockfile missing servers");
  }
  const servers = doc.servers.map((server, index) => {
    if (!server || typeof server !== "object") {
      throw new LockfileError(`server[${index}] is malformed`);
    }
    const entry = server as Record<string, unknown>;
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    const url = typeof entry.url === "string" ? entry.url.trim() : "";
    if (!name || !url) {
      throw new LockfileError(`server[${index}] missing name or url`);
    }
    if (entry.transport !== "streamable-http") {
      throw new LockfileError(`server '${name}' must use streamable-http transport`);
    }
    return buildLockServer({
      name,
      url,
      tools: Array.isArray(entry.tools) ? entry.tools : [],
    });
  });
  return buildLockfile(servers, {
    generator: typeof doc.generator === "string" ? doc.generator : LOCKFILE_GENERATOR,
    generatedAt: typeof doc.generatedAt === "string" ? doc.generatedAt : new Date(0).toISOString(),
  });
}

export function serializeLockfile(lockfile: McpLockfileV1): string {
  const normalized = buildLockfile(lockfile.servers, {
    generator: lockfile.generator,
    generatedAt: lockfile.generatedAt,
  });
  return `${JSON.stringify(normalized, null, 2)}\n`;
}
