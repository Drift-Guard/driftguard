import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { extractLockfilePatch, runManifestExport } from "./manifest-export-run.js";

describe("manifest export", () => {
  it("extractLockfilePatch reads webhook shape", () => {
    const patch = extractLockfilePatch({
      suggestedLockfilePatch: {
        targetPath: ".driftguard/mcp/driftguard-lock.json",
        afterLockfile: { version: 1, servers: [] },
      },
    });
    assert.equal(patch?.targetPath, ".driftguard/mcp/driftguard-lock.json");
  });

  it("writes lockfile from --input", () => {
    const root = mkdtempSync(join(tmpdir(), "dg-export-"));
    const input = join(root, "webhook.json");
    const target = join(root, "out/lock.json");
    writeFileSync(
      input,
      JSON.stringify({
        suggestedLockfilePatch: {
          targetPath: target,
          afterLockfile: { version: 1, generatedAt: "2026-01-01T00:00:00.000Z", servers: [] },
        },
      }),
    );

    const code = runManifestExport(["--format", "lockfile-patch", "--input", input]);
    assert.equal(code, 0);
    assert.equal(existsSync(target), true);
    const written = JSON.parse(readFileSync(target, "utf8")) as { version: number };
    assert.equal(written.version, 1);
  });
});
