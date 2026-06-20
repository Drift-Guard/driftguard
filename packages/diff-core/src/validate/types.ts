import type { ChangeSeverity, DiffProfile, JsonSchema } from "../types.js";

export type RequiredPolicy = "allProperties" | "schemaOnly";

export type ProfileKind = "ingress" | "llm_structured_output" | "tool_call_envelope";

export type EnvelopePreset = "mcp" | "openai_functions" | "raw";

export interface ConsumerProfile {
  id: string;
  version: number;
  schema: JsonSchema;
  profileKind?: ProfileKind;
  envelope?: {
    /** Dot path into payload when preset is raw (e.g. arguments, input, function.arguments). */
    extractPath?: string;
    /** mcp: { name, arguments } or { tool, input }; openai_functions: { function: { name, arguments } }; raw: extractPath */
    preset?: EnvelopePreset;
  };
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
  | "envelope_extract_failed"
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
