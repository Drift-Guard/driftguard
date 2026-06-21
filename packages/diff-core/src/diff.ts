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

  const beforeEnum = before.enum as unknown[] | undefined;
  const afterEnum = after.enum as unknown[] | undefined;
  if (Array.isArray(beforeEnum) || Array.isArray(afterEnum)) {
    const prev = Array.isArray(beforeEnum) ? beforeEnum.map(String) : [];
    const next = Array.isArray(afterEnum) ? afterEnum.map(String) : [];
    const prevSet = new Set(prev);
    const nextSet = new Set(next);
    const removed = prev.filter((v) => !nextSet.has(v));
    const added = next.filter((v) => !prevSet.has(v));
    if (removed.length || added.length) {
      if (removed.length && added.length) {
        changes.push({
          path,
          severity: "suspicious",
          changeType: "type_changed",
          before: prev,
          after: next,
          message: "Enum values changed (possible semantic shift)",
        });
      } else if (removed.length) {
        changes.push({
          path,
          severity: "breaking",
          changeType: "type_changed",
          before: prev,
          after: next,
          message:
            removed.length === 1
              ? `Enum value '${removed[0]}' was removed`
              : `Enum value(s) removed: ${removed.join(", ")}`,
        });
      } else {
        changes.push({
          path,
          severity: "info",
          changeType: "added",
          before: prev,
          after: next,
          message:
            added.length === 1
              ? `Enum value '${added[0]}' was added`
              : `Enum value(s) added: ${added.join(", ")}`,
        });
      }
    }
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
  let suspiciousCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  for (const c of changes) {
    if (c.severity === "breaking") breakingCount++;
    else if (c.severity === "suspicious") suspiciousCount++;
    else if (c.severity === "warning") warningCount++;
    else infoCount++;
  }
  return {
    hasChanges: changes.length > 0,
    breakingCount,
    suspiciousCount,
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
