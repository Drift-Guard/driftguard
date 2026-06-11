import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { validateAgentsYamlText } from "../agents/validate.js";

function collectYamlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectYamlFiles(full));
      continue;
    }
    if (entry === "agents.yaml" || entry.endsWith(".agents.yaml")) {
      files.push(full);
    }
  }
  return files;
}

function resolveTargets(manifestArg: string | undefined, cwd: string): string[] {
  const manifest = manifestArg?.trim() || process.env.DRIFTGUARD_AGENTS_MANIFEST?.trim() || ".driftguard/agents.yaml";
  if (manifest.endsWith(".yaml")) return [join(cwd, manifest)];
  return collectYamlFiles(join(cwd, manifest));
}

export function runAgentsLint(args: string[], cwd = process.cwd()): number {
  let targets: string[];
  try {
    targets = resolveTargets(args[0], cwd);
  } catch (err) {
    console.error(`agents.yaml lint failed: ${(err as Error).message}`);
    return 1;
  }

  if (!targets.length) {
    console.error("No agents.yaml files found — set manifest input or commit .driftguard/agents.yaml");
    return 1;
  }

  let failed = false;
  for (const file of targets) {
    let yaml: string;
    try {
      yaml = readFileSync(file, "utf8");
    } catch {
      console.error(`FAIL ${relative(cwd, file)} — file not found`);
      failed = true;
      continue;
    }
    const result = validateAgentsYamlText(yaml);
    const label = relative(cwd, file);
    if (result.ok) {
      console.log(`OK  ${label}`);
    } else {
      failed = true;
      console.error(`FAIL ${label}`);
      for (const err of result.errors) console.error(`  - ${err}`);
    }
  }

  return failed ? 1 : 0;
}
