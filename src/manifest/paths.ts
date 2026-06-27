/** Contract Manifest lockfile paths — see docs/adr/0004-contract-manifest.md */

export const LEGACY_LOCKFILE_PATH = "driftguard-lock.json";
export const BUNDLE_LOCKFILE_DEFAULT = ".driftguard/mcp/driftguard-lock.json";

export function isDeprecatedLockPath(lockPath: string): boolean {
  const normalized = lockPath.replace(/\\/g, "/");
  if (normalized === LEGACY_LOCKFILE_PATH) return true;
  return (
    normalized.endsWith(`/${LEGACY_LOCKFILE_PATH}`) && !normalized.includes(".driftguard/")
  );
}

export function defaultLockOutputPath(update: boolean, explicitPath?: string): string {
  if (explicitPath) return explicitPath;
  return BUNDLE_LOCKFILE_DEFAULT;
}
