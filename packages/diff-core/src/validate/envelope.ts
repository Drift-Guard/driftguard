import type { ConsumerProfile, ValidateError } from "./types.js";

const MCP_EXTRACT_PATHS = ["arguments", "input"] as const;
const OPENAI_FUNCTIONS_PATH = "function.arguments";

function getByDotPath(obj: unknown, path: string): unknown {
  let current = obj;
  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function tryExtractPaths(obj: unknown, paths: readonly string[]): unknown {
  for (const path of paths) {
    const value = getByDotPath(obj, path);
    if (value !== undefined && value !== null && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }
  return undefined;
}

export function resolveEnvelopePayload(
  payload: unknown,
  profile: ConsumerProfile,
): { value: unknown; errors: ValidateError[] } {
  const kind = profile.profileKind ?? "ingress";

  if (kind === "ingress" || kind === "llm_structured_output") {
    return { value: payload, errors: [] };
  }

  if (kind !== "tool_call_envelope") {
    return {
      value: payload,
      errors: [
        {
          path: "/profileKind",
          code: "profile_invalid",
          message: `Unknown profileKind: ${String(kind)}`,
        },
      ],
    };
  }

  const envelope = profile.envelope ?? {};
  const preset = envelope.preset ?? "mcp";
  let extracted: unknown;

  switch (preset) {
    case "mcp":
      extracted = tryExtractPaths(payload, MCP_EXTRACT_PATHS);
      break;
    case "openai_functions":
      extracted = getByDotPath(payload, OPENAI_FUNCTIONS_PATH);
      if (
        extracted !== undefined &&
        extracted !== null &&
        (typeof extracted !== "object" || Array.isArray(extracted))
      ) {
        extracted = undefined;
      }
      break;
    case "raw":
      if (!envelope.extractPath?.trim()) {
        return {
          value: payload,
          errors: [
            {
              path: "/envelope/extractPath",
              code: "profile_invalid",
              message: "envelope.extractPath is required when preset is raw",
            },
          ],
        };
      }
      extracted = getByDotPath(payload, envelope.extractPath);
      break;
    default:
      return {
        value: payload,
        errors: [
          {
            path: "/envelope/preset",
            code: "profile_invalid",
            message: `Unknown envelope preset: ${String(preset)}`,
          },
        ],
      };
  }

  if (extracted === undefined || extracted === null) {
    return {
      value: payload,
      errors: [
        {
          path: "$",
          code: "envelope_extract_failed",
          message: `Could not extract validation target from tool-call envelope (preset: ${preset})`,
        },
      ],
    };
  }

  if (typeof extracted !== "object" || Array.isArray(extracted)) {
    return {
      value: payload,
      errors: [
        {
          path: "$",
          code: "envelope_extract_failed",
          message: "Extracted envelope payload must be a JSON object",
        },
      ],
    };
  }

  return { value: extracted, errors: [] };
}
