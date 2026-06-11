import { parse as parseYaml } from "yaml";
import { z } from "zod";

const POLICY_PRESETS = [
  "notify-only",
  "dev-flexible",
  "staging-strict",
  "production-guard",
] as const;

const watchSchema = z.object({
  type: z.enum(["a2a_card", "mcp", "api", "openapi"]),
  url: z.string().url(),
  name: z.string().min(1).optional(),
});

const agentSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*$/i, "id must be slug-safe"),
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  environment: z.string().min(1),
  policy: z.string().min(1),
  runtime_webhook: z.string().url().optional(),
  a2a: z
    .object({
      cardUrl: z.string().url(),
    })
    .optional(),
  mcp: z
    .object({
      configPath: z.string().min(1),
      skillToolMap: z.record(z.array(z.string().min(1))).optional(),
    })
    .optional(),
  watches: z.array(watchSchema).min(1),
});

const policySchema = z.object({
  on_breaking: z.enum(["notify", "draft_pr", "block_new_runs", "kill_in_flight"]),
  on_warning: z.enum(["notify"]).optional(),
  require_ack_to_unblock: z.boolean().optional(),
  auto_resolve_incident: z.boolean().optional(),
});

export const agentsManifestSchema = z.object({
  version: z.literal(1),
  org: z.string().min(1).optional(),
  agents: z.array(agentSchema).min(1),
  policies: z.record(policySchema).optional(),
});

export type AgentsManifest = z.infer<typeof agentsManifestSchema>;

export type ValidateAgentsYamlResult =
  | { ok: true; manifest: AgentsManifest }
  | { ok: false; errors: string[] };

function validatePolicyReferences(manifest: AgentsManifest): string[] {
  const errors: string[] = [];
  const policyKeys = new Set([
    ...POLICY_PRESETS,
    ...Object.keys(manifest.policies ?? {}),
  ]);

  for (const agent of manifest.agents) {
    if (!policyKeys.has(agent.policy)) {
      errors.push(`agent "${agent.id}": unknown policy "${agent.policy}"`);
    }
    if (agent.runtime_webhook && !agent.runtime_webhook.startsWith("https://")) {
      errors.push(`agent "${agent.id}": runtime_webhook must use HTTPS`);
    }
  }
  return errors;
}

export function validateAgentsYamlText(yamlText: string): ValidateAgentsYamlResult {
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlText);
  } catch (err) {
    return { ok: false, errors: [`YAML parse error: ${(err as Error).message}`] };
  }

  const result = agentsManifestSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "(root)";
        return `${path}: ${issue.message}`;
      }),
    };
  }

  const refErrors = validatePolicyReferences(result.data);
  if (refErrors.length) return { ok: false, errors: refErrors };

  return { ok: true, manifest: result.data };
}
