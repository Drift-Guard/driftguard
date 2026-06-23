import { parse as parseYaml } from "yaml";
import { z } from "zod";

const lockfilesSchema = z.object({
  dir: z.string().min(1).default(".driftguard/mcp"),
  primary: z.string().min(1).default("driftguard-lock.json"),
  failOn: z.enum(["breaking", "suspicious", "warning"]).default("breaking"),
  staleAfterDays: z.number().int().nonnegative().default(30),
});

const hostedSchema = z.object({
  required: z.boolean().default(false),
  minWatchCoverage: z.number().min(0).max(1).default(1),
});

const metaSchema = z.object({
  owner: z.string().min(1).optional(),
  service: z.string().min(1).optional(),
});

export const manifestSchema = z.object({
  version: z.literal(1),
  kind: z.enum(["agent-repo", "api-service", "mcp-server", "library", "monorepo"]),
  adoptionLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  scanRoots: z.array(z.string().min(1)).min(1),
  lockfiles: lockfilesSchema.optional(),
  hosted: hostedSchema.optional(),
  meta: metaSchema.optional(),
});

export type ContractManifest = z.infer<typeof manifestSchema>;

export type ValidateManifestYamlResult =
  | { ok: true; manifest: ContractManifest }
  | { ok: false; errors: string[] };

export function defaultLockfilePath(manifest: ContractManifest): string {
  const dir = manifest.lockfiles?.dir ?? ".driftguard/mcp";
  const primary = manifest.lockfiles?.primary ?? "driftguard-lock.json";
  return `${dir}/${primary}`;
}

export function validateManifestYamlText(yamlText: string): ValidateManifestYamlResult {
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlText);
  } catch (err) {
    return { ok: false, errors: [`YAML parse error: ${(err as Error).message}`] };
  }

  const result = manifestSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "(root)";
        return `manifest.yaml: ${path}: ${issue.message}`;
      }),
    };
  }

  return { ok: true, manifest: result.data };
}
