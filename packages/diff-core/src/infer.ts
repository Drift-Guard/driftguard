import { resolveMarkAllFieldsRequired } from "./profiles.js";
import type { InferSchemaOptions, JsonSchema } from "./types.js";

export function inferSchema(value: unknown, path = "$", options: InferSchemaOptions = {}): JsonSchema {
  const markAllFieldsRequired = resolveMarkAllFieldsRequired(options);
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
