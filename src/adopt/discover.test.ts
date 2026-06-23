import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  discoverRepoKind,
  discoverScanRoots,
  findMcpConfigForLock,
} from "./discover.js";

describe("adopt discover", () => {
  it("finds scan roots and mcp config", () => {
    const root = mkdtempSync(join(tmpdir(), "dg-adopt-"));
    writeFileSync(
      join(root, "mcp.json"),
      JSON.stringify({
        mcpServers: {
          stripe: { url: "https://mcp.stripe.com/mcp" },
        },
      }),
    );

    const roots = discoverScanRoots(root);
    assert.deepEqual(roots, ["mcp.json"]);
    assert.equal(findMcpConfigForLock(root), "mcp.json");
    assert.equal(discoverRepoKind(root, roots), "mcp-server");
  });

  it("prefers agent-repo when .cursor/mcp.json exists", () => {
    const root = mkdtempSync(join(tmpdir(), "dg-adopt-"));
    mkdirSync(join(root, ".cursor"), { recursive: true });
    writeFileSync(
      join(root, ".cursor/mcp.json"),
      JSON.stringify({ mcpServers: { x: { url: "https://x.example/mcp" } } }),
    );

    const roots = discoverScanRoots(root);
    assert.equal(discoverRepoKind(root, roots), "agent-repo");
  });
});
