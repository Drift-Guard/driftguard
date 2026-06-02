import { diffSchemas, type DiffResult, type SchemaChange } from "./diff.js";
import type { OpenApiOperationSnapshot } from "./openapi-normalize.js";

function summarize(changes: SchemaChange[]): DiffResult {
  let breakingCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  for (const c of changes) {
    if (c.severity === "breaking") breakingCount++;
    else if (c.severity === "warning") warningCount++;
    else infoCount++;
  }
  return {
    hasChanges: changes.length > 0,
    breakingCount,
    warningCount,
    infoCount,
    changes,
  };
}

function diffSchemaMaps(
  before: Record<string, import("./diff.js").JsonSchema>,
  after: Record<string, import("./diff.js").JsonSchema>,
  prefix: string,
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  for (const key of Object.keys(before)) {
    if (!after[key]) {
      changes.push({
        path: `${prefix}.${key}`,
        severity: "breaking",
        changeType: "removed",
        before: before[key],
        message: `${prefix} '${key}' was removed`,
      });
    }
  }
  for (const key of Object.keys(after)) {
    if (!before[key]) {
      changes.push({
        path: `${prefix}.${key}`,
        severity: "warning",
        changeType: "added",
        after: after[key],
        message: `${prefix} '${key}' was added`,
      });
      continue;
    }
    for (const c of diffSchemas(before[key], after[key]).changes) {
      changes.push({ ...c, path: `${prefix}.${key}${c.path.slice(1)}` });
    }
  }
  return changes;
}

export function diffOpenApiSpecs(
  before: Record<string, OpenApiOperationSnapshot>,
  after: Record<string, OpenApiOperationSnapshot>,
): DiffResult {
  const changes: SchemaChange[] = [];

  for (const key of Object.keys(before)) {
    if (!after[key]) {
      changes.push({
        path: `operations.${key}`,
        severity: "breaking",
        changeType: "removed",
        before: before[key],
        message: `Operation '${key}' was removed`,
      });
    }
  }

  for (const key of Object.keys(after)) {
    if (!before[key]) {
      changes.push({
        path: `operations.${key}`,
        severity: "warning",
        changeType: "added",
        after: after[key],
        message: `Operation '${key}' was added`,
      });
      continue;
    }
    const prev = before[key];
    const next = after[key];

    for (const c of diffSchemas(prev.parameters, next.parameters).changes) {
      changes.push({ ...c, path: `operations.${key}.parameters${c.path.slice(1)}` });
    }
    for (const c of diffSchemas(prev.responseSchema, next.responseSchema).changes) {
      changes.push({ ...c, path: `operations.${key}.response${c.path.slice(1)}` });
    }
    changes.push(...diffSchemaMaps(prev.responses, next.responses, `operations.${key}.responses`));
    changes.push(
      ...diffSchemaMaps(prev.responseHeaders, next.responseHeaders, `operations.${key}.responseHeaders`),
    );
    for (const c of diffSchemas(prev.security, next.security).changes) {
      changes.push({ ...c, path: `operations.${key}.security${c.path.slice(1)}` });
    }
  }

  return summarize(changes);
}
