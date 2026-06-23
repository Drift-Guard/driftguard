import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { planAdopt, runAdopt } from "./adopt-run.js";
import type { LockRunDeps } from "./lock-run.js";

const mockLockDeps = (root: string): LockRunDeps => ({
  fetchTools: async () => [{ name: "ping", inputSchema: { type: "object" } }],
  readFile: (path) => readFileSync(path, "utf8"),
  writeFile: (path, content) => writeFileSync(path, content, "utf8"),
});

describe("adopt-run", () => {
  it("dry-run lists planned manifest and lock without writing", async () => {
    const root = mkdtempSync(join(tmpdir(), "dg-adopt-"));
    writeFileSync(
      join(root, "mcp.json"),
      JSON.stringify({ mcpServers: { demo: { url: "https://demo.example/mcp" } } }),
    );

    const code = await runAdopt(["--dry-run", "--level", "1"], root);
    assert.equal(code, 0);
    assert.equal(existsSync(join(root, ".driftguard/manifest.yaml")), false);

    const planned = planAdopt(root, {
      level: 1,
      force: false,
      dryRun: true,
      fixtureId: "mcp/tool-removed",
    });
    assert.ok(planned.some((p) => p.action === "lock"));
    assert.ok(planned.some((p) => p.path.endsWith("manifest.yaml")));
  });

  it("level 1 writes manifest, lockfile, and workflow", async () => {
    const root = mkdtempSync(join(tmpdir(), "dg-adopt-"));
    writeFileSync(
      join(root, "mcp.json"),
      JSON.stringify({ mcpServers: { demo: { url: "https://demo.example/mcp" } } }),
    );

    const code = await runAdopt(["--level", "1"], root, { lockDeps: mockLockDeps(root) });
    assert.equal(code, 0);
    assert.equal(existsSync(join(root, ".driftguard/manifest.yaml")), true);
    assert.equal(existsSync(join(root, ".driftguard/mcp/driftguard-lock.json")), true);
    assert.equal(existsSync(join(root, ".github/workflows/driftguard-manifest.yml")), true);
  });

  it("level 2 writes harness bundle and passes lint", async () => {
    const root = mkdtempSync(join(tmpdir(), "dg-adopt-"));
    writeFileSync(
      join(root, "mcp.json"),
      JSON.stringify({ mcpServers: { demo: { url: "https://demo.example/mcp" } } }),
    );

    const code = await runAdopt(["--level", "2"], root, { lockDeps: mockLockDeps(root) });
    assert.equal(code, 0);
    assert.equal(existsSync(join(root, ".driftguard/gates.yaml")), true);
    assert.equal(existsSync(join(root, ".driftguard/harness.lock")), true);
  });
});
