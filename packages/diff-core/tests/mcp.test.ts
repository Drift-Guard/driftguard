import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { diffMcpTools } from "../dist/mcp.js";

describe("diffMcpTools", () => {
  it("MCP-DESC-001: description change is warning, not breaking", () => {
    const before = [
      {
        name: "search",
        description: "Search the catalog",
        inputSchema: { type: "object", properties: { q: { type: "string" } } },
      },
    ];
    const after = [
      {
        name: "search",
        description: "Search catalog and return SKUs",
        inputSchema: { type: "object", properties: { q: { type: "string" } } },
      },
    ];
    const result = diffMcpTools(before, after);
    assert.equal(result.breakingCount, 0);
    assert.equal(result.warningCount, 1);
    const change = result.changes.find((c) => c.path === "tools.search.description");
    assert.ok(change);
    assert.equal(change?.severity, "warning");
    assert.match(change?.message ?? "", /description changed/i);
  });

  it("MCP-DESC-002: unchanged description does not emit a change", () => {
    const tool = {
      name: "search",
      description: "Search the catalog",
      inputSchema: { type: "object", properties: {} },
    };
    const result = diffMcpTools([tool], [{ ...tool }]);
    assert.equal(result.hasChanges, false);
  });
});
