import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldFailCheck, runCheckLock, type CheckLockRunDeps } from "./check-lock-run.js";

const baseLock = {
  lockfileVersion: 1,
  generator: "@drift-guard/driftguard",
  generatedAt: "2026-01-01T00:00:00.000Z",
  servers: [
    {
      name: "demo",
      transport: "streamable-http",
      url: "https://demo.example/mcp",
      tools: [
        {
          name: "search",
          description: "Search the catalog",
          inputSchema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
        },
      ],
    },
  ],
};

describe("check-lock-run", () => {
  it("shouldFailCheck respects fail-on threshold", () => {
    assert.equal(shouldFailCheck({ hasChanges: true, breakingCount: 0, suspiciousCount: 1, warningCount: 0, infoCount: 0, changes: [] }, "breaking"), false);
    assert.equal(shouldFailCheck({ hasChanges: true, breakingCount: 0, suspiciousCount: 1, warningCount: 0, infoCount: 0, changes: [] }, "suspicious"), true);
    assert.equal(shouldFailCheck({ hasChanges: true, breakingCount: 1, suspiciousCount: 0, warningCount: 0, infoCount: 0, changes: [] }, "suspicious"), true);
  });

  it("CLI-CHECK-001: identical catalog → exit 0", async () => {
    const deps: CheckLockRunDeps = {
      readFile: () => JSON.stringify(baseLock),
      fetchTools: async () => baseLock.servers[0]!.tools,
    };
    const code = await runCheckLock(["--lock", "driftguard-lock.json"], deps);
    assert.equal(code, 0);
  });

  it("CLI-CHECK-002: breaking drift → exit 1 default", async () => {
    const deps: CheckLockRunDeps = {
      readFile: () => JSON.stringify(baseLock),
      fetchTools: async () => [],
    };
    const code = await runCheckLock(["--lock", "driftguard-lock.json"], deps);
    assert.equal(code, 1);
  });

  it("CLI-CHECK-003: --fail-on suspicious exits 1 on suspicious only", async () => {
    const deps: CheckLockRunDeps = {
      readFile: () => JSON.stringify(baseLock),
      fetchTools: async () => [
        {
          name: "search",
          description: "Execute a full-text query across all inventory SKUs and return pricing tiers",
          inputSchema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
        },
      ],
    };
    assert.equal(await runCheckLock(["--lock", "driftguard-lock.json"], deps), 0);
    assert.equal(await runCheckLock(["--lock", "driftguard-lock.json", "--fail-on", "suspicious"], deps), 1);
  });

  it("CLI-CHECK-004: stderr summary lists counts", async () => {
    const stderr: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      stderr.push(args.map(String).join(" "));
    };
    try {
      const deps: CheckLockRunDeps = {
        readFile: () => JSON.stringify(baseLock),
        fetchTools: async () => [],
      };
      await runCheckLock(["--lock", "driftguard-lock.json"], deps);
      assert.match(stderr.join("\n"), /1 breaking/);
    } finally {
      console.error = original;
    }
  });
});
