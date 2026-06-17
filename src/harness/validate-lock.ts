import { parse as parseYaml } from "yaml";
import { z } from "zod";

const fixtureIdPattern = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/;

const fixtureEntrySchema = z
  .object({
    id: z.string().regex(fixtureIdPattern, "id must be vendor/scenario"),
    version: z.string().min(1),
    path: z.string().min(1).optional(),
    ref: z.string().min(1).optional(),
    mockdrift_key: z.string().min(1).optional(),
  })
  .refine((f) => f.path || f.ref, { message: "fixture entry requires path or ref" });

const toolchangeManifestPinSchema = z.object({
  manifest: z.string().min(1),
  baseline: z.string().min(1),
});

export const harnessLockSchema = z.object({
  version: z.literal(1),
  fixtures: z.array(fixtureEntrySchema).min(1),
  packages: z.record(z.string().min(1)).optional(),
  manifests: z
    .object({
      toolchange: toolchangeManifestPinSchema.optional(),
    })
    .optional(),
});

export type HarnessLock = z.infer<typeof harnessLockSchema>;

export type ValidateHarnessLockResult =
  | { ok: true; lock: HarnessLock }
  | { ok: false; errors: string[] };

export function validateHarnessLockText(yamlText: string): ValidateHarnessLockResult {
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlText);
  } catch (err) {
    return { ok: false, errors: [`YAML parse error: ${(err as Error).message}`] };
  }

  const result = harnessLockSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`),
    };
  }

  const ids = new Set<string>();
  const errors: string[] = [];
  for (const fixture of result.data.fixtures) {
    if (ids.has(fixture.id)) {
      errors.push(`duplicate fixture id "${fixture.id}"`);
    }
    ids.add(fixture.id);
  }

  return errors.length ? { ok: false, errors } : { ok: true, lock: result.data };
}
