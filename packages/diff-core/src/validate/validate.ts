import { resolveMarkAllFieldsRequired } from "../profiles.js";
import type { ChangeSeverity, JsonSchema } from "../types.js";
import {
  VALIDATE_LIMITS,
  type ConsumerProfile,
  type ValidateError,
  type ValidateOptions,
  type ValidateResult,
} from "./types.js";

function severityFromErrors(errors: ValidateError[]): ChangeSeverity | "none" {
  if (errors.length === 0) return "none";
  if (errors.some((e) => e.code === "required_missing" || e.code === "type_mismatch" || e.code === "enum_invalid" || e.code === "null_disallowed")) {
    return "breaking";
  }
  if (errors.some((e) => e.code === "extra_field")) return "warning";
  return "info";
}

function schemaType(schema: JsonSchema): string {
  if (schema.type === "array" && schema.items) {
    return `array<${schemaType(schema.items as JsonSchema)}>`;
  }
  return String(schema.type ?? "unknown");
}

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number" && Number.isInteger(value)) return "integer";
  return typeof value;
}

function typesCompatible(expected: string, actual: string): boolean {
  if (expected === actual) return true;
  if (expected === "number" && actual === "integer") return true;
  if (expected === "integer" && actual === "integer") return true;
  if (expected.startsWith("array") && actual === "array") return true;
  if (expected === "unknown" || expected === "object") return actual === "object";
  return false;
}

function resolveRequiredKeys(schema: JsonSchema, markAll: boolean): Set<string> {
  const props = (schema.properties ?? {}) as Record<string, JsonSchema>;
  const fromSchema = new Set((schema.required as string[] | undefined) ?? []);
  if (markAll) {
    return new Set([...Object.keys(props), ...fromSchema]);
  }
  return fromSchema;
}

function countDepth(schema: JsonSchema, depth = 0): number {
  if (depth > VALIDATE_LIMITS.maxSchemaDepth + 1) return depth;
  const props = (schema.properties ?? {}) as Record<string, JsonSchema>;
  let max = depth;
  for (const child of Object.values(props)) {
    max = Math.max(max, countDepth(child, depth + 1));
  }
  if (schema.items) {
    max = Math.max(max, countDepth(schema.items as JsonSchema, depth + 1));
  }
  return max;
}

export function validateProfileStructure(profile: ConsumerProfile): ValidateError[] {
  const errors: ValidateError[] = [];
  if (!profile.id?.trim()) {
    errors.push({ path: "/id", code: "profile_invalid", message: "Profile id is required" });
  }
  if (typeof profile.version !== "number" || profile.version < 1) {
    errors.push({ path: "/version", code: "profile_invalid", message: "Profile version must be a positive number" });
  }
  if (!profile.schema || typeof profile.schema !== "object") {
    errors.push({ path: "/schema", code: "profile_invalid", message: "Profile schema must be an object" });
    return errors;
  }
  const depth = countDepth(profile.schema);
  if (depth > VALIDATE_LIMITS.maxSchemaDepth) {
    errors.push({
      path: "/schema",
      code: "profile_invalid",
      message: `Schema depth ${depth} exceeds limit ${VALIDATE_LIMITS.maxSchemaDepth}`,
    });
  }
  const props = (profile.schema.properties ?? {}) as Record<string, JsonSchema>;
  if (Object.keys(props).length > VALIDATE_LIMITS.maxPropertiesPerObject) {
    errors.push({
      path: "/schema/properties",
      code: "profile_invalid",
      message: `Property count exceeds limit ${VALIDATE_LIMITS.maxPropertiesPerObject}`,
    });
  }
  const aliases = profile.normalization?.aliases;
  if (aliases && Object.keys(aliases).length > VALIDATE_LIMITS.maxNormalizationAliases) {
    errors.push({
      path: "/normalization/aliases",
      code: "profile_invalid",
      message: `Alias count exceeds limit ${VALIDATE_LIMITS.maxNormalizationAliases}`,
    });
  }
  return errors;
}

function applyNormalization(payload: unknown, profile: ConsumerProfile): unknown {
  const aliases = profile.normalization?.aliases;
  if (!aliases || typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return payload;
  }
  const out: Record<string, unknown> = { ...(payload as Record<string, unknown>) };
  for (const [from, to] of Object.entries(aliases)) {
    if (from in out && !(to in out)) {
      out[to] = out[from];
      delete out[from];
    }
  }
  return out;
}

function pushError(
  errors: ValidateError[],
  maxErrors: number,
  error: ValidateError,
): boolean {
  if (errors.length >= maxErrors) return false;
  errors.push(error);
  return errors.length < maxErrors;
}

function validateValue(
  value: unknown,
  schema: JsonSchema,
  path: string,
  markAllRequired: boolean,
  errors: ValidateError[],
  maxErrors: number,
  depth: number,
): void {
  if (errors.length >= maxErrors || depth > VALIDATE_LIMITS.maxSchemaDepth) return;

  const expected = schemaType(schema);
  const actual = valueType(value);

  if (value === undefined) {
    return;
  }

  if (schema.enum && Array.isArray(schema.enum)) {
    if (!schema.enum.includes(value)) {
      pushError(errors, maxErrors, {
        path,
        code: "enum_invalid",
        message: `Value not in allowed enum`,
      });
    }
    return;
  }

  if (!typesCompatible(expected, actual)) {
    pushError(errors, maxErrors, {
      path,
      code: "type_mismatch",
      message: `Expected ${expected}, got ${actual}`,
    });
    return;
  }

  if (actual === "string" && typeof value === "string") {
    const minLen = schema.minLength as number | undefined;
    const maxLen = schema.maxLength as number | undefined;
    if (minLen !== undefined && value.length < minLen) {
      pushError(errors, maxErrors, { path, code: "min_length", message: `String shorter than minLength ${minLen}` });
    }
    if (maxLen !== undefined && value.length > maxLen) {
      pushError(errors, maxErrors, { path, code: "max_length", message: `String longer than maxLength ${maxLen}` });
    }
  }

  if (actual === "number" && typeof value === "number") {
    const min = schema.minimum as number | undefined;
    const max = schema.maximum as number | undefined;
    if (min !== undefined && value < min) {
      pushError(errors, maxErrors, { path, code: "min_value", message: `Number below minimum ${min}` });
    }
    if (max !== undefined && value > max) {
      pushError(errors, maxErrors, { path, code: "max_value", message: `Number above maximum ${max}` });
    }
  }

  if (actual === "null" && expected !== "null") {
    pushError(errors, maxErrors, { path, code: "null_disallowed", message: "Null not allowed for this field" });
    return;
  }

  if (actual === "array" && Array.isArray(value)) {
    const items = schema.items as JsonSchema | undefined;
    if (items) {
      value.forEach((item, i) => {
        validateValue(item, items, `${path}[${i}]`, markAllRequired, errors, maxErrors, depth + 1);
      });
    }
    return;
  }

  if (actual === "object" && typeof value === "object" && value !== null && !Array.isArray(value)) {
    const props = (schema.properties ?? {}) as Record<string, JsonSchema>;
    const required = resolveRequiredKeys(schema, markAllRequired);
    const obj = value as Record<string, unknown>;

    for (const key of required) {
      if (!(key in obj) || obj[key] === undefined) {
        pushError(errors, maxErrors, {
          path: `${path}/${key}`,
          code: "required_missing",
          message: `Required field '${key}' is missing`,
        });
      }
    }

    for (const [key, childValue] of Object.entries(obj)) {
      const childSchema = props[key];
      const childPath = path === "$" ? `/${key}` : `${path}/${key}`;
      if (!childSchema) {
        const code = markAllRequired ? "extra_field" : "extra_field";
        pushError(errors, maxErrors, {
          path: childPath,
          code,
          message: `Unexpected field '${key}'`,
        });
        continue;
      }
      validateValue(childValue, childSchema, childPath, markAllRequired, errors, maxErrors, depth + 1);
    }
  }
}

export function validateAgainstProfile(
  payload: unknown,
  profile: ConsumerProfile,
  options: ValidateOptions = {},
): ValidateResult {
  const maxErrors = options.maxErrors ?? VALIDATE_LIMITS.maxErrorsDefault;
  const profileErrors = validateProfileStructure(profile);
  if (profileErrors.length > 0) {
    return {
      ok: false,
      severity: "breaking",
      errors: profileErrors.slice(0, maxErrors),
      normalized: null,
      truncated: profileErrors.length > maxErrors,
      explainUrl: options.explainUrl,
    };
  }

  const markAll =
    profile.requiredPolicy === "allProperties" ||
    (profile.requiredPolicy !== "schemaOnly" &&
      resolveMarkAllFieldsRequired({ profile: options.profileMode ?? "hosted" }));

  const normalized = applyNormalization(payload, profile);
  const errors: ValidateError[] = [];
  const rootSchema = { ...profile.schema, type: profile.schema.type ?? "object" };

  validateValue(normalized, rootSchema, "$", markAll, errors, maxErrors, 0);

  const severity = severityFromErrors(errors);
  const ok = severity === "none";

  return {
    ok,
    severity,
    errors,
    normalized: errors.length === 0 ? normalized : null,
    truncated: errors.length >= maxErrors,
    explainUrl: options.explainUrl,
  };
}
