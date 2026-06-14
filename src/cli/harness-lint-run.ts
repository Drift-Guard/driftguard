import { existsSync } from "node:fs";
import { join } from "node:path";
import { lintHarnessBundle } from "../harness/lint.js";

export function runHarnessLint(args: string[], cwd = process.cwd()): number {
  const bundleArg = args[0]?.trim() || process.env.DRIFTGUARD_HARNESS_DIR?.trim() || ".driftguard";
  const bundleDir = join(cwd, bundleArg);

  if (!existsSync(bundleDir)) {
    console.error(`Harness bundle not found: ${bundleDir}`);
    return 1;
  }

  const result = lintHarnessBundle(bundleDir, cwd);
  const label = bundleArg.replace(/^\.\//, "");

  if (result.ok) {
    console.log(`OK  ${label} (agents.yaml, gates.yaml, harness.lock)`);
    return 0;
  }

  console.error(`FAIL ${label}`);
  for (const err of result.errors) console.error(`  - ${err}`);
  return 1;
}
