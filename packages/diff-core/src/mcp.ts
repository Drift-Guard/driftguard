import { diffSchemas, summarize } from "./diff.js";
import type { DiffResult, JsonSchema, SchemaChange } from "./types.js";

export interface McpToolSnapshot {
  name: string;
  description?: string;
  inputSchema?: JsonSchema;
}

export interface McpNamedSnapshot {
  name: string;
  description?: string;
  uri?: string;
}

export function diffMcpNamedItems(
  label: "resources" | "prompts",
  before: McpNamedSnapshot[],
  after: McpNamedSnapshot[],
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  const beforeMap = new Map(before.map((item) => [item.name, item]));
  const afterMap = new Map(after.map((item) => [item.name, item]));

  for (const [name, item] of beforeMap) {
    if (!afterMap.has(name)) {
      changes.push({
        path: `${label}.${name}`,
        severity: "breaking",
        changeType: "removed",
        before: item,
        message: `MCP ${label.slice(0, -1)} '${name}' was removed`,
      });
    }
  }

  for (const [name, item] of afterMap) {
    if (!beforeMap.has(name)) {
      changes.push({
        path: `${label}.${name}`,
        severity: "warning",
        changeType: "added",
        after: item,
        message: `MCP ${label.slice(0, -1)} '${name}' was added`,
      });
    }
  }

  return changes;
}

export function mergeDiffResults(parts: DiffResult[]): DiffResult {
  const changes = parts.flatMap((p) => p.changes);
  return summarize(changes);
}

export function diffMcpTools(before: McpToolSnapshot[], after: McpToolSnapshot[]): DiffResult {
  const changes: SchemaChange[] = [];
  const beforeMap = new Map(before.map((t) => [t.name, t]));
  const afterMap = new Map(after.map((t) => [t.name, t]));

  for (const [name, tool] of beforeMap) {
    if (!afterMap.has(name)) {
      changes.push({
        path: `tools.${name}`,
        severity: "breaking",
        changeType: "removed",
        before: tool,
        message: `MCP tool '${name}' was removed`,
      });
    }
  }

  for (const [name, tool] of afterMap) {
    if (!beforeMap.has(name)) {
      changes.push({
        path: `tools.${name}`,
        severity: "warning",
        changeType: "added",
        after: tool,
        message: `MCP tool '${name}' was added`,
      });
      continue;
    }
    const prev = beforeMap.get(name)!;
    if (prev.inputSchema && tool.inputSchema) {
      const schemaDiff = diffSchemas(prev.inputSchema, tool.inputSchema);
      for (const c of schemaDiff.changes) {
        changes.push({ ...c, path: `tools.${name}.inputSchema${c.path.slice(1)}` });
      }
    } else if (!prev.inputSchema && tool.inputSchema) {
      changes.push({
        path: `tools.${name}.inputSchema`,
        severity: "info",
        changeType: "added",
        after: tool.inputSchema,
        message: `Input schema added to tool '${name}'`,
      });
    } else if (prev.inputSchema && !tool.inputSchema) {
      changes.push({
        path: `tools.${name}.inputSchema`,
        severity: "warning",
        changeType: "removed",
        before: prev.inputSchema,
        message: `Input schema removed from tool '${name}'`,
      });
    }
  }

  return summarize(changes);
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val as Record<string, unknown>)
        .sort((a, b) => a.localeCompare(b))
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = (val as Record<string, unknown>)[k];
          return acc;
        }, {});
    }
    return val;
  });
}
