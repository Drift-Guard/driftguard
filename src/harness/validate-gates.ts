import { parse as parseYaml } from "yaml";
import { z } from "zod";

const gateToggleSchema = z.object({
  enabled: z.boolean(),
  advisory: z.boolean().optional(),
});

export const gatesManifestSchema = z.object({
  version: z.literal(1),
  gates: z.object({
    mockdrift: gateToggleSchema.optional(),
    fuseguard: gateToggleSchema
      .extend({ max_tool_calls: z.number().int().positive().optional() })
      .optional(),
    agents_lint: gateToggleSchema.optional(),
    toolchange: gateToggleSchema.optional(),
    schemasync: gateToggleSchema.optional(),
    evaluator: gateToggleSchema.optional(),
  }),
  defaults: z
    .object({
      failure_profile: z.enum(["halt_clean", "bubble_to_orchestrator", "fallback_state"]).optional(),
      runner: z.enum(["langgraph", "crewai", "autogen", "custom", "subprocess"]).optional(),
    })
    .optional(),
});

export type GatesManifest = z.infer<typeof gatesManifestSchema>;

export type ValidateGatesYamlResult =
  | { ok: true; manifest: GatesManifest }
  | { ok: false; errors: string[] };

export function validateGatesYamlText(yamlText: string): ValidateGatesYamlResult {
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlText);
  } catch (err) {
    return { ok: false, errors: [`YAML parse error: ${(err as Error).message}`] };
  }

  const result = gatesManifestSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`),
    };
  }

  const errors: string[] = [];
  const mockdrift = result.data.gates.mockdrift;
  if (mockdrift && !mockdrift.enabled) {
    errors.push("gates.mockdrift.enabled must be true when mockdrift gate is declared");
  }

  return errors.length ? { ok: false, errors } : { ok: true, manifest: result.data };
}
