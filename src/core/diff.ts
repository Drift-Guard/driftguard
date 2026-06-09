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

export function diffSchemas(before: JsonSchema, after: JsonSchema): DiffResult {
  return coreDiffSchemas(before, after);
}

export { coreCollectSchemaChanges as collectSchemaChanges, coreSummarize as summarize };
