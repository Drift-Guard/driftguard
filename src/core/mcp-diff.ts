import { diffSchemas, type DiffResult, type SchemaChange } from "./diff.js";

function summarize(changes: SchemaChange[]): DiffResult {
  let breakingCount = 0;
  let suspiciousCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  for (const c of changes) {
    if (c.severity === "breaking") breakingCount++;
    else if (c.severity === "suspicious") suspiciousCount++;
    else if (c.severity === "warning") warningCount++;
    else infoCount++;
  }
  return { hasChanges: changes.length > 0, breakingCount, suspiciousCount, warningCount, infoCount, changes };
}

function toolsListToRequiredSchema(tools: unknown): Record<string, unknown> {
  const inner = toolsListToSchema(tools);
  const properties = (inner.properties ?? {}) as Record<string, unknown>;
  const keys = Object.keys(properties);
  return {
    type: "object",
    properties: {
      tools: {
        type: "object",
        properties,
        required: keys,
      },
    },
    required: ["tools"],
  };
}

function toolsListToSchema(tools: unknown): Record<string, unknown> {
  if (!Array.isArray(tools)) return {};
  const properties: Record<string, unknown> = {};
  for (const tool of tools) {
    if (!tool || typeof tool !== "object") continue;
    const t = tool as Record<string, unknown>;
    const name = typeof t.name === "string" ? t.name : null;
    if (!name) continue;
    properties[name] = {
      description: t.description,
      inputSchema: t.inputSchema ?? t.input_schema,
    };
  }
  return { type: "object", properties };
}

function extractToolsList(manifest: unknown): unknown[] | null {
  if (!manifest || typeof manifest !== "object") return null;
  const obj = manifest as Record<string, unknown>;
  if (Array.isArray(obj.tools)) return obj.tools;
  if (obj.result && typeof obj.result === "object") {
    const result = obj.result as Record<string, unknown>;
    if (Array.isArray(result.tools)) return result.tools;
  }
  if (Array.isArray(obj.mcpServers)) {
    const servers = obj.mcpServers as Record<string, unknown>[];
    const first = servers[0];
    if (first && typeof first === "object" && Array.isArray((first as { tools?: unknown[] }).tools)) {
      return (first as { tools: unknown[] }).tools;
    }
  }
  return null;
}

export function diffMcpManifests(beforeRaw: unknown, afterRaw: unknown): DiffResult {
  const beforeTools = extractToolsList(beforeRaw);
  const afterTools = extractToolsList(afterRaw);
  if (!beforeTools || !afterTools) {
    throw new Error("Expected MCP tools/list snapshots or mcp.json with tools arrays");
  }

  const beforeSchema = toolsListToRequiredSchema(beforeTools);
  const afterSchema = toolsListToRequiredSchema(afterTools);
  const changes = diffSchemas(beforeSchema, afterSchema).changes.map((c) => ({
    ...c,
    path: c.path.replace(/^\$\.tools\./, "tools.").replace(/^\$\./, "tools."),
  }));
  return summarize(changes);
}
