import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { validateAgentsYamlText } from "../agents/validate.js";
import { validateGatesYamlText } from "./validate-gates.js";
import { validateHarnessLockText, type HarnessLock } from "./validate-lock.js";

export type LintHarnessResult = { ok: true } | { ok: false; errors: string[] };

function readOptional(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

function resolveFixturePath(bundleDir: string, repoRoot: string, rel: string): string {
  const fromBundle = resolve(bundleDir, rel);
  if (existsSync(fromBundle)) return fromBundle;
  return resolve(repoRoot, rel);
}

function lintLockPaths(bundleDir: string, repoRoot: string, lock: HarnessLock): string[] {
  const errors: string[] = [];
  for (const entry of lock.fixtures) {
    if (entry.ref && !entry.path) {
      if (!entry.ref.includes("@")) {
        errors.push(`fixture "${entry.id}": ref should include @version (hosted catalog lane)`);
      }
      continue;
    }
    if (!entry.path) continue;
    const abs = resolveFixturePath(bundleDir, repoRoot, entry.path);
    if (!existsSync(abs)) {
      errors.push(`fixture "${entry.id}": path not found (${entry.path})`);
    }
  }

  const toolchangePin = lock.manifests?.toolchange;
  if (toolchangePin) {
    for (const [label, rel] of [
      ["manifest", toolchangePin.manifest],
      ["baseline", toolchangePin.baseline],
    ] as const) {
      const abs = resolveFixturePath(bundleDir, repoRoot, rel);
      if (!existsSync(abs)) {
        errors.push(`manifests.toolchange.${label}: path not found (${rel})`);
      }
    }
  }

  const schemasyncPin = lock.manifests?.schemasync;
  if (schemasyncPin) {
    const promptsAbs = resolveFixturePath(bundleDir, repoRoot, schemasyncPin.prompts_dir);
    if (!existsSync(promptsAbs)) {
      errors.push(`manifests.schemasync.prompts_dir: path not found (${schemasyncPin.prompts_dir})`);
    }
    const removedAbs = resolveFixturePath(bundleDir, repoRoot, schemasyncPin.removed_fields);
    if (!existsSync(removedAbs)) {
      errors.push(`manifests.schemasync.removed_fields: path not found (${schemasyncPin.removed_fields})`);
    }
    if (schemasyncPin.synonyms) {
      const synonymsAbs = resolveFixturePath(bundleDir, repoRoot, schemasyncPin.synonyms);
      if (!existsSync(synonymsAbs)) {
        errors.push(`manifests.schemasync.synonyms: path not found (${schemasyncPin.synonyms})`);
      }
    }
  }

  return errors;
}

function lintDefaultsConsistency(
  gatesYaml: string | null,
  lockYaml: string | null,
): string[] {
  if (!gatesYaml || !lockYaml) return [];
  const gates = validateGatesYamlText(gatesYaml);
  const lock = validateHarnessLockText(lockYaml);
  if (!gates.ok || !lock.ok) return [];

  const profile = gates.manifest.defaults?.failure_profile;
  if (!profile) return [];

  const errors: string[] = [];
  for (const fixture of lock.lock.fixtures) {
    if (fixture.id.startsWith("stripe/") && profile === "fallback_state") {
      errors.push(
        `defaults.failure_profile fallback_state may not match stripe fixtures — verify expect criteria`,
      );
      break;
    }
  }
  return errors;
}

export function lintHarnessBundle(bundleDir: string, repoRoot = process.cwd()): LintHarnessResult {
  const errors: string[] = [];
  const agentsPath = join(bundleDir, "agents.yaml");
  const gatesPath = join(bundleDir, "gates.yaml");
  const lockPath = join(bundleDir, "harness.lock");

  const agentsYaml = readOptional(agentsPath);
  const gatesYaml = readOptional(gatesPath);
  const lockYaml = readOptional(lockPath);

  if (!gatesYaml) {
    errors.push("missing gates.yaml");
  } else {
    const gates = validateGatesYamlText(gatesYaml);
    if (!gates.ok) {
      for (const err of gates.errors) errors.push(`gates.yaml: ${err}`);
    }
  }

  if (!lockYaml) {
    errors.push("missing harness.lock");
  } else {
    const lock = validateHarnessLockText(lockYaml);
    if (!lock.ok) {
      for (const err of lock.errors) errors.push(`harness.lock: ${err}`);
    } else {
      errors.push(...lintLockPaths(bundleDir, repoRoot, lock.lock));
    }
  }

  if (agentsYaml) {
    const agents = validateAgentsYamlText(agentsYaml);
    if (!agents.ok) {
      for (const err of agents.errors) errors.push(`agents.yaml: ${err}`);
    }
  }

  errors.push(...lintDefaultsConsistency(gatesYaml, lockYaml));

  return errors.length ? { ok: false, errors } : { ok: true };
}
