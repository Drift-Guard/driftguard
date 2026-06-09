import type { DiffResult, JsonSchema, SchemaChange } from "./types.js";

function schemaType(schema: JsonSchema): string {
  if (schema.type === "array" && schema.items) {
    return `array<${schemaType(schema.items as JsonSchema)}>`;
  }
  return String(schema.type ?? "unknown");
}

function diffRecursive(before: JsonSchema, after: JsonSchema, changes: SchemaChange[]): void {
  const path = String(after.path ?? before.path ?? "$");
  const beforeType = schemaType(before);
  const afterType = schemaType(after);

  if (beforeType !== afterType) {
    changes.push({
      path,
      severity: "breaking",
      changeType: "type_changed",
      before: beforeType,
      after: afterType,
      message: `Type changed from ${beforeType} to ${afterType}`,
    });
    return;
  }

  if (beforeType.startsWith("array") && afterType.startsWith("array")) {
    const beforeItems = before.items as JsonSchema | undefined;
    const afterItems = after.items as JsonSchema | undefined;
    if (beforeItems && afterItems) {
      diffRecursive(beforeItems, afterItems, changes);
    }
    return;
  }

  if (beforeType === "object") {
    const beforeProps = (before.properties ?? {}) as Record<string, JsonSchema>;
    const afterProps = (after.properties ?? {}) as Record<string, JsonSchema>;
    const beforeRequired = new Set((before.required as string[] | undefined) ?? []);
    const afterRequired = new Set((after.required as string[] | undefined) ?? []);

    for (const key of Object.keys(beforeProps)) {
      const childPath = `${path}.${key}`;
      if (!(key in afterProps)) {
        changes.push({
          path: childPath,
          severity: beforeRequired.has(key) ? "breaking" : "warning",
          changeType: "removed",
          before: beforeProps[key],
          message: `Field '${key}' was removed`,
        });
        continue;
      }
      diffRecursive(beforeProps[key], afterProps[key], changes);
    }

    for (const key of Object.keys(afterProps)) {
      const childPath = `${path}.${key}`;
      if (!(key in beforeProps)) {
        changes.push({
          path: childPath,
          severity: afterRequired.has(key) ? "breaking" : "info",
          changeType: "added",
          after: afterProps[key],
          message: afterRequired.has(key)
            ? `Required field '${key}' was added`
            : `Optional field '${key}' was added`,
        });
      }
    }

    for (const key of afterRequired) {
      if (!beforeRequired.has(key) && key in beforeProps) {
        changes.push({
          path: `${path}.${key}`,
          severity: "breaking",
          changeType: "required_added",
          message: `Field '${key}' is now required`,
        });
      }
    }

    for (const key of beforeRequired) {
      if (!afterRequired.has(key) && key in afterProps) {
        changes.push({
          path: `${path}.${key}`,
          severity: "info",
          changeType: "required_removed",
          message: `Field '${key}' is no longer required`,
        });
      }
    }
  }
}

export function summarize(changes: SchemaChange[]): DiffResult {
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

export function collectSchemaChanges(before: JsonSchema, after: JsonSchema): SchemaChange[] {
  const changes: SchemaChange[] = [];
  diffRecursive(before, after, changes);
  return changes;
}

export function diffSchemas(before: JsonSchema, after: JsonSchema): DiffResult {
  return summarize(collectSchemaChanges(before, after));
}
