import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";

export type LockfilePatchInput = {
  suggestedLockfilePatch?: {
    targetPath: string;
    afterLockfile: unknown;
  };
};

export function extractLockfilePatch(raw: unknown): LockfilePatchInput["suggestedLockfilePatch"] {
  if (!raw || typeof raw !== "object") return undefined;
  const root = raw as Record<string, unknown>;
  const patch = root.suggestedLockfilePatch;
  if (!patch || typeof patch !== "object") return undefined;
  const p = patch as Record<string, unknown>;
  if (typeof p.targetPath !== "string" || !p.afterLockfile) return undefined;
  return { targetPath: p.targetPath, afterLockfile: p.afterLockfile };
}

export function runManifestExport(argv: string[]): number {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`Usage: driftguard manifest export --format lockfile-patch [--input webhook.json]

Apply suggestedLockfilePatch from a drift.detected webhook payload (CM6).`);
    return 0;
  }

  const formatIdx = argv.indexOf("--format");
  const format = formatIdx >= 0 ? argv[formatIdx + 1] : "";
  if (format !== "lockfile-patch") {
    console.error("Only --format lockfile-patch is supported");
    return 2;
  }

  const inputIdx = argv.indexOf("--input");
  const inputPath = inputIdx >= 0 ? argv[inputIdx + 1] : undefined;
  const rawText = inputPath ? readFileSync(inputPath, "utf8") : readFileSync(0, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    console.error(`Invalid JSON: ${(err as Error).message}`);
    return 2;
  }

  const patch = extractLockfilePatch(parsed);
  if (!patch) {
    console.error("No suggestedLockfilePatch in input");
    return 2;
  }

  mkdirSync(dirname(patch.targetPath), { recursive: true });
  writeFileSync(patch.targetPath, `${JSON.stringify(patch.afterLockfile, null, 2)}\n`, "utf8");
  console.log(`Wrote ${patch.targetPath}`);
  return 0;
}
