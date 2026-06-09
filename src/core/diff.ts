export type ChangeSeverity = "breaking" | "warning" | "info";

export interface SchemaChange {
  path: string;
  severity: ChangeSeverity;
  changeType: "added" | "removed" | "type_changed" | "required_added" | "required_removed";
  before?: unknown;
  after?: unknown;
  message: string;
}

export interface DiffResult {
  hasChanges: boolean;
  breakingCount: number;
  warningCount: number;
  infoCount: number;
  changes: SchemaChange[];
}

export type JsonSchema = Record<string, unknown>;

export function inferSchema(
  value: unknown,
  path = "$",
  options: { markAllFieldsRequired?: boolean } = {},
): JsonSchema {
  const markAllFieldsRequired = options.markAllFieldsRequired ?? true;
  if (value === null) return { type: "null", path };
  if (Array.isArray(value)) {
    const items =
      value.length > 0
        ? inferSchema(value[0], `${path}[]`, options)
        : { type: "unknown", path: `${path}[]` };
    return { type: "array", items, path };
  }
  if (typeof value === "object") {
    const properties: Record<string, JsonSchema> = {};
    const keys = Object.keys(value as Record<string, unknown>);
    for (const key of keys) {
      properties[key] = inferSchema((value as Record<string, unknown>)[key], `${path}.${key}`, options);
    }
    const schema: JsonSchema = { type: "object", properties, path };
    if (markAllFieldsRequired && keys.length > 0) {
      schema.required = keys;
    }
    return schema;
  }
  return { type: typeof value, path };
}

function schemaType(schema: JsonSchema): string {
  if (schema.type === "array" && schema.items) {
    return `array<${schemaType(schema.items as JsonSchema)}>`;
  }
  return String(schema.type ?? "unknown");
}

export function collectSchemaChanges(before: JsonSchema, after: JsonSchema): SchemaChange[] {
  const changes: SchemaChange[] = [];
  diffRecursive(before, after, changes);
  return changes;
}

export function diffSchemas(before: JsonSchema, after: JsonSchema): DiffResult {
  return summarize(collectSchemaChanges(before, after));
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
