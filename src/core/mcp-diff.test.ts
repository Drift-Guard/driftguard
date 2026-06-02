import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { diffMcpManifests } from "./mcp-diff.js";

describe("diffMcpManifests", () => {
  it("MCP-001: detects removed MCP tools as breaking", () => {
    const before = { tools: [{ name: "search", inputSchema: { type: "object" } }] };
    const after = { tools: [] };
    const diff = diffMcpManifests(before, after);
    assert.ok(diff.breakingCount >= 1);
    assert.ok(diff.changes.some((c) => c.path.startsWith("tools.")));
  });
});
