import { resolveLockfilePathFromRepo } from "../manifest/resolve-lockfile.js";

export function runManifestLockfilePath(argv: string[]): number {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`Usage: driftguard manifest lockfile-path

Print the repo-relative MCP lockfile path from .driftguard/manifest.yaml or defaults.`);
    return 0;
  }

  console.log(resolveLockfilePathFromRepo());
  return 0;
}
