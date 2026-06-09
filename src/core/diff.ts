/**
 * OSS adapter — defaults inferSchema to CLI profile (ARCH-U01).
 * Canonical logic lives in @driftguard/diff-core.
 */
import {
  collectSchemaChanges as coreCollectSchemaChanges,
  diffSchemas as coreDiffSchemas,
  inferSchema as coreInferSchema,
  summarize as coreSummarize,
  type DiffResult,
  type InferSchemaOptions,
  type JsonSchema,
  type SchemaChange,
} from "@driftguard/diff-core";

export type { ChangeSeverity, DiffResult, JsonSchema, SchemaChange } from "@driftguard/diff-core";

export function inferSchema(
  value: unknown,
  path = "$",
  options: InferSchemaOptions = {},
): JsonSchema {
  return coreInferSchema(value, path, { profile: "cli", ...options });
}

function isInferredSchema(value: unknown): value is JsonSchema {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as JsonSchema).type === "string" &&
    "path" in value
  );
}

function trimEmbeddedSchema(value: unknown): unknown {
  if (typeof value === "string") return value;
  if (isInferredSchema(value)) return value.type;
  return value;
}

/** Trim nested inferred schemas in change before/after for compact MCP/CLI output. */
export function compactDiffResult(result: DiffResult): DiffResult {
  return {
    ...result,
    changes: result.changes.map((change) => {
      const compact: SchemaChange = { ...change };
      if (change.before !== undefined) compact.before = trimEmbeddedSchema(change.before);
      if (change.after !== undefined) compact.after = trimEmbeddedSchema(change.after);
      return compact;
    }),
  };
}

export function diffSchemas(before: JsonSchema, after: JsonSchema): DiffResult {
  return coreDiffSchemas(before, after);
}

export { coreCollectSchemaChanges as collectSchemaChanges, coreSummarize as summarize };
