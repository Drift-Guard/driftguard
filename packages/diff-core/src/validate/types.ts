import type { ChangeSeverity, DiffProfile, JsonSchema } from "../types.js";

export type RequiredPolicy = "allProperties" | "schemaOnly";

export interface ConsumerProfile {
  id: string;
  version: number;
  schema: JsonSchema;
  requiredPolicy?: RequiredPolicy;
  normalization?: {
    aliases?: Record<string, string>;
  };
  compatibility?: "backward" | "forward" | "bidirectional";
}

export type ValidateErrorCode =
  | "required_missing"
  | "type_mismatch"
  | "enum_invalid"
  | "extra_field"
  | "null_disallowed"
  | "profile_invalid"
  | "array_items_invalid"
  | "min_length"
  | "max_length"
  | "min_value"
  | "max_value";

export interface ValidateError {
  path: string;
  code: ValidateErrorCode;
  message: string;
}

export interface ValidateOptions {
  profileMode?: DiffProfile;
  mode?: "block" | "warn";
  maxErrors?: number;
  explainUrl?: string;
}

export interface ValidateResult {
  ok: boolean;
  severity: ChangeSeverity | "none";
  errors: ValidateError[];
  normalized: unknown | null;
  truncated?: boolean;
  explainUrl?: string;
}

export const VALIDATE_LIMITS = {
  maxSchemaDepth: 32,
  maxPropertiesPerObject: 256,
  maxErrorsDefault: 50,
  maxNormalizationAliases: 20,
  maxProfileBytes: 65_536,
} as const;
