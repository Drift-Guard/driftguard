import type { SchemaChange } from "./diff.js";

export type EnrichedSchemaChange = SchemaChange & { agentAction: string };

export function suggestAgentAction(change: SchemaChange): string {
  const { path, changeType, severity, message } = change;
  const lower = path.toLowerCase();

  if (lower.startsWith("tools.")) {
    if (changeType === "removed") {
      return `Remove or guard calls to MCP tool '${path.split(".")[1]}'; pin server version or update agent tool list.`;
    }
    if (changeType === "added") {
      return `Optionally register new MCP tool '${path.split(".")[1]}' in agent configuration.`;
    }
    if (lower.includes("inputschema") && severity === "breaking") {
      return `Update client arguments for MCP tool schema at ${path}; run integration tests before deploy.`;
    }
  }

  if (lower.startsWith("resources.") || lower.startsWith("prompts.")) {
    if (changeType === "removed") {
      return `Stop referencing MCP ${lower.split(".")[0]} '${path.split(".")[1]}' or migrate to replacement.`;
    }
  }

  if (path.includes(" ") || lower.includes("get ") || lower.includes("post ")) {
    if (changeType === "removed" && severity === "breaking") {
      return `Remove or replace API client calls for operation ${path}; check vendor changelog.`;
    }
    if (changeType === "added") {
      return `Review new OpenAPI operation ${path} — may enable new integration paths.`;
    }
  }

  if (changeType === "removed" && severity === "breaking") {
    return `Update code reading '${path}' — required field or contract removed; add null checks or migrate.`;
  }
  if (changeType === "required_added") {
    return `Pass required value for '${path}' in all API requests; update types and validation.`;
  }
  if (changeType === "type_changed") {
    return `Coerce or parse '${path}' with new type; update serializers and tests.`;
  }
  if (changeType === "added" && severity === "info") {
    return `Optional: handle new field '${path}' when present — backward compatible.`;
  }

  return `Review drift at ${path}: ${message}`;
}

export function enrichChangesWithAgentActions(changes: SchemaChange[]): EnrichedSchemaChange[] {
  return changes.map((c) => ({ ...c, agentAction: suggestAgentAction(c) }));
}

export function explainDriftChanges(changes: SchemaChange[]): {
  summary: string;
  changes: EnrichedSchemaChange[];
} {
  const enriched = enrichChangesWithAgentActions(changes);
  const breaking = enriched.filter((c) => c.severity === "breaking").length;
  const warnings = enriched.filter((c) => c.severity === "warning").length;
  const summary =
    breaking > 0
      ? `${breaking} breaking change(s) require code or agent updates before safe deploy.`
      : warnings > 0
        ? `${warnings} warning(s) — review before next release.`
        : "Informational schema changes only.";
  return { summary, changes: enriched };
}
