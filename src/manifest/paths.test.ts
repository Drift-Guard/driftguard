import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { BUNDLE_LOCKFILE_DEFAULT, isDeprecatedLockPath } from "./paths.js";
import { resolveLockfilePathFromRepo } from "./resolve-lockfile.js";

describe("manifest lockfile paths", () => {
  it("detects deprecated repo-root lock path", () => {
    assert.equal(isDeprecatedLockPath("driftguard-lock.json"), true);
    assert.equal(isDeprecatedLockPath(BUNDLE_LOCKFILE_DEFAULT), false);
  });

  it("resolveLockfilePathFromRepo prefers manifest lockfiles dir and primary", () => {
    const root = mkdtempSync(join(tmpdir(), "dg-manifest-"));
    mkdirSync(join(root, ".driftguard"), { recursive: true });
    writeFileSync(
      join(root, ".driftguard/manifest.yaml"),
      `version: 1
kind: agent-repo
adoptionLevel: 1
scanRoots: [mcp.json]
lockfiles:
  dir: custom/locks
  primary: tools.lock.json
`,
    );

    const cwd = process.cwd();
    process.chdir(root);
    try {
      assert.equal(resolveLockfilePathFromRepo(), "custom/locks/tools.lock.json");
    } finally {
      process.chdir(cwd);
    }
  });
});
