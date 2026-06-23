import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseLockfile, type McpLockfileV1 } from "@driftguard/diff-core";
import type { HarnessLock } from "../harness/validate-lock.js";
import { BUNDLE_LOCKFILE_DEFAULT, LEGACY_LOCKFILE_PATH } from "./paths.js";
import { defaultLockfilePath, validateManifestYamlText } from "./validate.js";

export type LockServerIndex = Map<string, { url: string; lockPath: string }>;

export function normalizeMcpUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "") || "/";
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

export function indexLockfileServers(lockPath: string, lockfile: McpLockfileV1): LockServerIndex {
  const index: LockServerIndex = new Map();
  for (const server of lockfile.servers) {
    index.set(server.name, { url: server.url, lockPath });
  }
  return index;
}

export function readLockfileAt(repoRoot: string, relPath: string): McpLockfileV1 | null {
  const abs = resolve(repoRoot, relPath);
  if (!existsSync(abs)) return null;
  return parseLockfile(JSON.parse(readFileSync(abs, "utf8")) as unknown);
}

export function collectLockfilePaths(
  repoRoot: string,
  bundleDir: string,
  harnessLock: HarnessLock | null,
): string[] {
  const paths = new Set<string>();

  for (const pin of harnessLock?.manifests?.mcp_lock ?? []) {
    paths.add(pin.path);
  }

  const manifestPath = join(bundleDir, "manifest.yaml");
  if (existsSync(manifestPath)) {
    const manifest = validateManifestYamlText(readFileSync(manifestPath, "utf8"));
    if (manifest.ok) {
      paths.add(defaultLockfilePath(manifest.manifest));
    }
  }

  if (!paths.size) {
    if (existsSync(resolve(repoRoot, BUNDLE_LOCKFILE_DEFAULT))) {
      paths.add(BUNDLE_LOCKFILE_DEFAULT);
    } else if (existsSync(resolve(repoRoot, LEGACY_LOCKFILE_PATH))) {
      paths.add(LEGACY_LOCKFILE_PATH);
    }
  }

  return [...paths];
}

export function buildLockServerIndex(
  repoRoot: string,
  bundleDir: string,
  harnessLock: HarnessLock | null,
): LockServerIndex {
  const merged: LockServerIndex = new Map();
  for (const relPath of collectLockfilePaths(repoRoot, bundleDir, harnessLock)) {
    const lockfile = readLockfileAt(repoRoot, relPath);
    if (!lockfile) continue;
    for (const [name, entry] of indexLockfileServers(relPath, lockfile)) {
      merged.set(name, entry);
    }
  }
  return merged;
}

export function resolveLockfilePathFromRepo(repoRoot = process.cwd()): string {
  const bundleDir = join(repoRoot, ".driftguard");
  const manifestPath = join(bundleDir, "manifest.yaml");
  if (existsSync(manifestPath)) {
    const manifest = validateManifestYamlText(readFileSync(manifestPath, "utf8"));
    if (manifest.ok) return defaultLockfilePath(manifest.manifest);
  }
  if (existsSync(join(repoRoot, BUNDLE_LOCKFILE_DEFAULT))) return BUNDLE_LOCKFILE_DEFAULT;
  return LEGACY_LOCKFILE_PATH;
}
