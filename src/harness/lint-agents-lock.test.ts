import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { lintAgentsAgainstLockfiles } from "./lint-agents-lock.js";
import { lintHarnessBundle } from "./lint.js";

describe("lintAgentsAgainstLockfiles", () => {
  it("flags missing lockServers entry (DG-AGENT-010)", () => {
    const root = mkdtempSync(join(tmpdir(), "dg-lint-"));
    const lockPath = ".driftguard/mcp/driftguard-lock.json";
    mkdirSync(join(root, ".driftguard/mcp"), { recursive: true });
    writeFileSync(
      join(root, lockPath),
      JSON.stringify({
        lockfileVersion: 1,
        generator: "@drift-guard/driftguard",
        generatedAt: "2026-01-01T00:00:00.000Z",
        servers: [
          {
            name: "stripe",
            transport: "streamable-http",
            url: "https://mcp.stripe.com/mcp",
            tools: [{ name: "refund", inputSchema: { type: "object" } }],
          },
        ],
      }),
    );

    const errors = lintAgentsAgainstLockfiles(
      root,
      join(root, ".driftguard"),
      {
        version: 1,
        fixtures: [{ id: "mcp/tool-removed", version: "1.0.0", path: "x" }],
        manifests: { mcp_lock: [{ path: lockPath }] },
      },
      {
        version: 1,
        agents: [
          {
            id: "billing",
            environment: "staging",
            policy: "staging-strict",
            mcp: { configPath: "mcp.json", lockServers: ["missing"] },
            watches: [{ type: "mcp", url: "https://mcp.stripe.com/mcp" }],
          },
        ],
      },
    );

    assert.ok(errors.some((e) => e.includes("DG-AGENT-010")));
  });

  it("flags MCP watch URL mismatch (DG-AGENT-013)", () => {
    const root = mkdtempSync(join(tmpdir(), "dg-lint-"));
    const lockPath = ".driftguard/mcp/driftguard-lock.json";
    mkdirSync(join(root, ".driftguard/mcp"), { recursive: true });
    writeFileSync(
      join(root, lockPath),
      JSON.stringify({
        lockfileVersion: 1,
        generator: "@drift-guard/driftguard",
        generatedAt: "2026-01-01T00:00:00.000Z",
        servers: [
          {
            name: "stripe",
            transport: "streamable-http",
            url: "https://mcp.stripe.com/mcp",
            tools: [],
          },
        ],
      }),
    );

    const errors = lintAgentsAgainstLockfiles(
      root,
      join(root, ".driftguard"),
      {
        version: 1,
        fixtures: [{ id: "mcp/tool-removed", version: "1.0.0", path: "x" }],
        manifests: { mcp_lock: [{ path: lockPath }] },
      },
      {
        version: 1,
        agents: [
          {
            id: "billing",
            environment: "staging",
            policy: "staging-strict",
            mcp: { configPath: "mcp.json", lockServers: ["stripe"] },
            watches: [{ type: "mcp", url: "https://other.example/mcp" }],
          },
        ],
      },
    );

    assert.ok(errors.some((e) => e.includes("DG-AGENT-013")));
  });
});

describe("deprecated root lockfile warn", () => {
  it("emits DG-LOCK-020 when only repo-root lockfile exists", () => {
    const root = mkdtempSync(join(tmpdir(), "dg-lint-"));
    const bundle = join(root, ".driftguard");
    mkdirSync(bundle, { recursive: true });
    writeFileSync(join(root, "driftguard-lock.json"), "{}");
    writeFileSync(
      join(bundle, "gates.yaml"),
      "version: 1\ngates:\n  mockdrift:\n    enabled: true\n",
    );
    writeFileSync(
      join(bundle, "harness.lock"),
      `version: 1
fixtures:
  - id: mcp/tool-removed
    version: "1.0.0"
    ref: driftguard/fixtures-mcp@1.0.0
`,
    );

    const result = lintHarnessBundle(bundle, root);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.some((e) => e.includes("DG-LOCK-020")));
  });
});
