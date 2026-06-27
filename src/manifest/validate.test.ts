import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { defaultLockfilePath, validateManifestYamlText } from "./validate.js";

const repoRoot = new URL("../..", import.meta.url).pathname;

describe("contract manifest validate", () => {
  it("validates example harness manifest.yaml", () => {
    const yaml = readFileSync(
      join(repoRoot, "examples/harness/.driftguard/manifest.yaml"),
      "utf8",
    );
    const result = validateManifestYamlText(yaml);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.manifest.adoptionLevel, 2);
    assert.equal(result.manifest.kind, "agent-repo");
    assert.deepEqual(result.manifest.scanRoots, ["mcp.json", ".cursor/mcp.json"]);
  });

  it("rejects invalid adoptionLevel", () => {
    const result = validateManifestYamlText(`
version: 1
kind: library
adoptionLevel: 4
scanRoots: [mcp.json]
`);
    assert.equal(result.ok, false);
  });

  it("resolves default lockfile path", () => {
    const result = validateManifestYamlText(`
version: 1
kind: mcp-server
adoptionLevel: 1
scanRoots: [mcp.json]
`);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(defaultLockfilePath(result.manifest), ".driftguard/mcp/driftguard-lock.json");
  });

  it("uses custom lockfiles dir and primary", () => {
    const result = validateManifestYamlText(`
version: 1
kind: api-service
adoptionLevel: 1
scanRoots: [openapi.yaml]
lockfiles:
  dir: locks
  primary: mcp.lock.json
`);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(defaultLockfilePath(result.manifest), "locks/mcp.lock.json");
  });
});
