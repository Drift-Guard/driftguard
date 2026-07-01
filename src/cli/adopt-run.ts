import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { listMcpJsonHttpServers } from "@drift-guard/diff-core";
import {
  discoverRepoKind,
  discoverScanRoots,
  findMcpConfigForLock,
} from "../adopt/discover.js";
import {
  agentsYamlLevel3,
  gatesYamlLevel2,
  harnessLockLevel2,
  manifestYaml,
  workflowManifestYaml,
  type AdoptionLevel,
} from "../adopt/templates.js";
import { lintHarnessBundle } from "../harness/lint.js";
import { BUNDLE_LOCKFILE_DEFAULT } from "../manifest/paths.js";
import { readHostedApiKey } from "../mcp/env-secrets.js";
import { suggestWatchesCreate } from "./suggest-watches-api.js";
import { runLock, type LockRunDeps } from "./lock-run.js";

export type PlannedFile = {
  path: string;
  content?: string;
  action: "write" | "lock" | "skip";
  reason?: string;
};

export type AdoptOptions = {
  level: AdoptionLevel;
  force: boolean;
  dryRun: boolean;
  fixtureId: string;
  cwd?: string;
  lockDeps?: LockRunDeps;
};

export function parseAdoptArgs(argv: string[]): AdoptOptions {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const valueAfter = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    if (index === -1) return undefined;
    return argv[index + 1];
  };

  const levelRaw = valueAfter("--level") ?? "1";
  if (levelRaw !== "1" && levelRaw !== "2" && levelRaw !== "3") {
    throw new Error("--level must be 1, 2, or 3");
  }

  return {
    level: Number(levelRaw) as AdoptionLevel,
    force: flags.has("--force"),
    dryRun: flags.has("--dry-run"),
    fixtureId: valueAfter("--fixture") ?? "mcp/tool-removed",
  };
}

export function adoptUsage(): string {
  return `Usage: driftguard adopt [--level 1|2|3] [--fixture vendor/scenario] [--force] [--dry-run]

Bootstrap Contract Manifest (.driftguard/) from mcp.json in the current repo.
Level 1: manifest + MCP lockfile + CI. Level 2: + harness gates. Level 3: + agents.yaml + hosted watches (requires DRIFTGUARD_API_KEY).`;
}

function shouldWrite(path: string, force: boolean): { ok: boolean; reason?: string } {
  if (!existsSync(path)) return { ok: true };
  if (force) return { ok: true };
  return { ok: false, reason: "already exists (use --force)" };
}

export function planAdopt(repoRoot: string, opts: AdoptOptions): PlannedFile[] {
  const scanRoots = discoverScanRoots(repoRoot);
  const kind = discoverRepoKind(repoRoot, scanRoots);
  const mcpConfig = findMcpConfigForLock(repoRoot);
  const bundleDir = join(repoRoot, ".driftguard");
  const planned: PlannedFile[] = [];

  const manifestPath = join(bundleDir, "manifest.yaml");
  const manifestCheck = shouldWrite(manifestPath, opts.force);
  planned.push({
    path: manifestPath,
    content: manifestYaml({
      kind,
      adoptionLevel: opts.level,
      scanRoots,
      hostedRequired: opts.level >= 3,
    }),
    action: manifestCheck.ok ? "write" : "skip",
    reason: manifestCheck.reason,
  });

  const lockRel = BUNDLE_LOCKFILE_DEFAULT;
  const lockPath = join(repoRoot, lockRel);
  const lockCheck = shouldWrite(lockPath, opts.force);
  if (mcpConfig) {
    planned.push({
      path: lockPath,
      action: lockCheck.ok ? "lock" : "skip",
      reason: lockCheck.reason ?? `from ${mcpConfig}`,
    });
  } else {
    planned.push({
      path: lockPath,
      action: "skip",
      reason: "no mcp.json with HTTP MCP servers found",
    });
  }

  if (opts.level >= 2) {
    for (const [rel, content] of [
      ["gates.yaml", gatesYamlLevel2()],
      ["harness.lock", harnessLockLevel2(opts.fixtureId)],
    ] as const) {
      const abs = join(bundleDir, rel);
      const check = shouldWrite(abs, opts.force);
      planned.push({
        path: abs,
        content,
        action: check.ok ? "write" : "skip",
        reason: check.reason,
      });
    }
  }

  if (opts.level >= 3 && mcpConfig) {
    try {
      const servers = listMcpJsonHttpServers(
        JSON.parse(readFileSync(join(repoRoot, mcpConfig), "utf8")) as unknown,
      );
      const agentsPath = join(bundleDir, "agents.yaml");
      const agentsCheck = shouldWrite(agentsPath, opts.force);
      planned.push({
        path: agentsPath,
        content: agentsYamlLevel3({ mcpConfigPath: mcpConfig, servers }),
        action: agentsCheck.ok ? "write" : "skip",
        reason: agentsCheck.reason,
      });
    } catch {
      planned.push({
        path: join(bundleDir, "agents.yaml"),
        action: "skip",
        reason: "could not parse MCP config for agents.yaml",
      });
    }
  }

  const workflowPath = join(repoRoot, ".github/workflows/driftguard-manifest.yml");
  const workflowCheck = shouldWrite(workflowPath, opts.force);
  planned.push({
    path: workflowPath,
    content: workflowManifestYaml(scanRoots, opts.level),
    action: workflowCheck.ok ? "write" : "skip",
    reason: workflowCheck.reason,
  });

  return planned;
}

export function printAdoptPlan(planned: PlannedFile[]): void {
  console.log("DriftGuard adopt — planned changes:");
  for (const file of planned) {
    const tag = file.action === "skip" ? "skip" : file.action === "lock" ? "lock" : "write";
    const suffix = file.reason ? ` (${file.reason})` : "";
    console.log(`  [${tag}] ${file.path}${suffix}`);
  }
}

async function applyLock(
  repoRoot: string,
  lockPath: string,
  mcpConfig: string,
  lockDeps?: LockRunDeps,
): Promise<number> {
  mkdirSync(dirname(lockPath), { recursive: true });
  return runLock(
    ["--config", join(repoRoot, mcpConfig), "-o", lockPath],
    lockDeps,
  );
}

export async function runAdopt(
  argv: string[],
  cwd = process.cwd(),
  overrides: Partial<AdoptOptions> = {},
): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(adoptUsage());
    return 0;
  }

  let opts: AdoptOptions;
  try {
    opts = { ...parseAdoptArgs(argv), cwd, ...overrides };
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    console.error(adoptUsage());
    return 2;
  }

  const repoRoot = cwd;
  const scanRoots = discoverScanRoots(repoRoot);
  if (!scanRoots.length) {
    console.error("No mcp.json, .cursor/mcp.json, or package.json found — nothing to adopt.");
    return 2;
  }

  const planned = planAdopt(repoRoot, opts);
  if (opts.dryRun) {
    printAdoptPlan(planned);
    return 0;
  }

  const mcpConfig = findMcpConfigForLock(repoRoot);
  let wrote = 0;

  for (const file of planned) {
    if (file.action === "skip") {
      console.log(`skip ${file.path}${file.reason ? `: ${file.reason}` : ""}`);
      continue;
    }
    if (file.action === "write" && file.content !== undefined) {
      mkdirSync(dirname(file.path), { recursive: true });
      writeFileSync(file.path, file.content, "utf8");
      console.log(`wrote ${file.path}`);
      wrote++;
      continue;
    }
    if (file.action === "lock" && mcpConfig) {
      const code = await applyLock(repoRoot, file.path, mcpConfig, opts.lockDeps);
      if (code !== 0) return code;
      console.log(`wrote ${file.path} (from ${mcpConfig})`);
      wrote++;
    }
  }

  if (!wrote) {
    console.error("No files written — use --force to overwrite existing manifest.");
    return 2;
  }

  if (opts.level >= 2) {
    const lint = lintHarnessBundle(join(repoRoot, ".driftguard"), repoRoot);
    if (!lint.ok) {
      console.error("Harness lint failed after adopt:");
      for (const err of lint.errors) console.error(`  - ${err}`);
      return 1;
    }
    console.log("OK  .driftguard (post-adopt lint)");
  }

  if (opts.level >= 3 && mcpConfig) {
    const apiKey = readHostedApiKey();
    if (!apiKey) {
      console.warn("Level 3: set DRIFTGUARD_API_KEY to register hosted watches via suggest_watches");
    } else {
      const mcpJson = JSON.parse(readFileSync(join(repoRoot, mcpConfig), "utf8")) as unknown;
      const suggest = await suggestWatchesCreate({ apiKey, mcpJson });
      if (suggest.ok) {
        console.log("Hosted watches reconciled (suggest_watches create:true)");
      } else {
        console.warn(`suggest_watches failed (${suggest.status}) — register watches in console`);
      }
    }
  }

  console.log(`Next: git add .driftguard .github/workflows/driftguard-manifest.yml && git commit`);
  if (opts.level === 1) {
    console.log(`Optional: driftguard adopt --level 2 for harness gates`);
  } else if (opts.level === 2) {
    console.log(`Optional: driftguard adopt --level 3 for agents + hosted watches`);
  } else {
    console.log(`Run: driftguard doctor --check-hosted`);
  }
  return 0;
}
