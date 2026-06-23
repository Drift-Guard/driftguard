import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runDoctor } from "./doctor-run.js";

describe("doctor-run", () => {
  it("prints text report for empty repo", async () => {
    const root = mkdtempSync(join(tmpdir(), "dg-doctor-"));
    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg?: unknown) => {
      logs.push(String(msg));
    };
    try {
      const code = await runDoctor([], root);
      assert.equal(code, 1);
      assert.ok(logs.join("\n").includes("No manifest"));
    } finally {
      console.log = orig;
    }
  });

  it("--json emits schemaVersion", async () => {
    const root = mkdtempSync(join(tmpdir(), "dg-doctor-"));
    writeFileSync(join(root, "mcp.json"), '{"mcpServers":{}}');
    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg?: unknown) => {
      logs.push(String(msg));
    };
    try {
      await runDoctor(["--json"], root);
      const report = JSON.parse(logs[0] ?? "{}") as { schemaVersion: number };
      assert.equal(report.schemaVersion, 1);
    } finally {
      console.log = orig;
    }
  });
});
