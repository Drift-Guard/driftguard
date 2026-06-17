import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateAgentsYamlText } from "../agents/validate.js";
import { assertA2aCoverage, formatA2aCoverageSummary } from "./a2a-coverage-api.js";
import { ciRepo, appendCiSummary } from "./ci-platform.js";

function resolveManifestPath(arg: string | undefined, cwd: string): string {
  const manifest =
    arg?.trim() || process.env.DRIFTGUARD_AGENTS_MANIFEST?.trim() || ".driftguard/agents.yaml";
  return manifest.endsWith(".yaml") ? join(cwd, manifest) : join(cwd, manifest, "agents.yaml");
}

export async function runAssertA2aCoverage(opts: {
  manifestPath?: string;
  apiKey: string;
  repo?: string;
  cwd?: string;
}): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const file = resolveManifestPath(opts.manifestPath, cwd);

  let yaml: string;
  try {
    yaml = readFileSync(file, "utf8");
  } catch {
    console.error(`assert-a2a-coverage: manifest not found at ${file}`);
    return 2;
  }

  const lint = validateAgentsYamlText(yaml);
  if (!lint.ok) {
    console.error(`assert-a2a-coverage: invalid manifest ${file}`);
    for (const err of lint.errors) console.error(`  - ${err}`);
    return 2;
  }

  const result = await assertA2aCoverage({
    apiKey: opts.apiKey,
    manifest: lint.manifest,
    repo: opts.repo ?? ciRepo(),
  });
  const body = result.body as Record<string, unknown>;
  console.log(JSON.stringify(body, null, 2));

  const summary = formatA2aCoverageSummary(body);
  await appendCiSummary(summary);

  if (!result.ok) {
    const upgrade = body.upgrade as { console?: string } | undefined;
    if (upgrade?.console) {
      console.error(`\n→ Register watches in console: ${upgrade.console}`);
    }
    return 1;
  }
  return 0;
}
