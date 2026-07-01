import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseLockfile, LockfileError } from "@drift-guard/diff-core";
import { validateAgentsYamlText } from "../agents/validate.js";
import { formatLintCode, DG_LOCK } from "../manifest/lint-codes.js";
import { isDeprecatedLockPath } from "../manifest/paths.js";
import { validateManifestYamlText } from "../manifest/validate.js";
import { lintAgentsAgainstLockfiles } from "./lint-agents-lock.js";
import { formatHarnessLintError } from "./mgfa-phrases.js";
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

  const mcpLockPins = lock.manifests?.mcp_lock;
  if (mcpLockPins) {
    for (const pin of mcpLockPins) {
      const abs = resolveFixturePath(bundleDir, repoRoot, pin.path);
      if (!existsSync(abs)) {
        errors.push(
          formatLintCode(
            DG_LOCK.MCP_LOCK_PATH,
            `manifests.mcp_lock path not found (${pin.path})`,
          ),
        );
        continue;
      }
      try {
        const raw = JSON.parse(readFileSync(abs, "utf8")) as unknown;
        const parsed = parseLockfile(raw);
        if (pin.servers?.length) {
          const names = new Set(parsed.servers.map((s) => s.name));
          for (const name of pin.servers) {
            if (!names.has(name)) {
              errors.push(
                formatLintCode(
                  DG_LOCK.SERVER_NAME,
                  `manifests.mcp_lock server "${name}" not in lockfile (${pin.path})`,
                ),
              );
            }
          }
        }
      } catch (err) {
        const detail = err instanceof LockfileError ? err.message : String(err);
        errors.push(
          formatLintCode(DG_LOCK.PARSE_FAILED, `manifests.mcp_lock invalid (${pin.path}): ${detail}`),
        );
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
  const manifestPath = join(bundleDir, "manifest.yaml");
  const agentsPath = join(bundleDir, "agents.yaml");
  const gatesPath = join(bundleDir, "gates.yaml");
  const lockPath = join(bundleDir, "harness.lock");

  const manifestYaml = readOptional(manifestPath);
  const agentsYaml = readOptional(agentsPath);
  const gatesYaml = readOptional(gatesPath);
  const lockYaml = readOptional(lockPath);

  if (manifestYaml) {
    const manifest = validateManifestYamlText(manifestYaml);
    if (!manifest.ok) {
      for (const err of manifest.errors) errors.push(err);
    }
  }

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
    } else if (lockYaml) {
      const lock = validateHarnessLockText(lockYaml);
      if (lock.ok) {
        errors.push(...lintAgentsAgainstLockfiles(repoRoot, bundleDir, lock.lock, agents.manifest));
      }
    }
  }

  const deprecatedLockAtRoot = resolve(repoRoot, "driftguard-lock.json");
  if (existsSync(deprecatedLockAtRoot)) {
    const bundleLock = resolve(repoRoot, ".driftguard/mcp/driftguard-lock.json");
    if (!existsSync(bundleLock)) {
      errors.push(
        formatLintCode(
          DG_LOCK.DEPRECATED_ROOT,
          `repo-root driftguard-lock.json is deprecated — use ${bundleLock}`,
          "warn",
        ),
      );
    }
  }

  errors.push(...lintDefaultsConsistency(gatesYaml, lockYaml));

  if (!errors.length) return { ok: true };
  return { ok: false, errors: errors.map(formatHarnessLintError) };
}
