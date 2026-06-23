import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultLockfilePath, validateManifestYamlText } from "./validate.js";

const DEFAULT_SCAN_ROOTS = ["mcp.json", ".cursor/mcp.json", "package.json"];

export function resolveScanRootsFromRepo(repoRoot = process.cwd()): string[] {
  const manifestPath = join(repoRoot, ".driftguard/manifest.yaml");
  if (existsSync(manifestPath)) {
    const result = validateManifestYamlText(readFileSync(manifestPath, "utf8"));
    if (result.ok && result.manifest.scanRoots.length) {
      return result.manifest.scanRoots;
    }
  }
  return DEFAULT_SCAN_ROOTS;
}

export function resolveScanPathsCsv(repoRoot = process.cwd()): string {
  return resolveScanRootsFromRepo(repoRoot).join(",");
}

export { defaultLockfilePath };
