import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { descriptionSimilarity, diffMcpTools } from "../dist/mcp.js";

describe("descriptionSimilarity", () => {
  it("MCP-SUSP-001: low overlap classifies as suspicious description drift", () => {
    const before = [{ name: "search", description: "Search the product catalog by keyword", inputSchema: { type: "object" } }];
    const after = [
      {
        name: "search",
        description: "Execute a full-text query across all inventory SKUs and return pricing tiers",
        inputSchema: { type: "object" },
      },
    ];
    const result = diffMcpTools(before, after);
    assert.equal(result.suspiciousCount, 1);
    assert.equal(result.warningCount, 0);
    const change = result.changes.find((c) => c.path === "tools.search.description");
    assert.equal(change?.severity, "suspicious");
  });

  it("MCP-SUSP-002: minor description tweak stays warning", () => {
    assert.ok(descriptionSimilarity("Search the catalog", "Search the catalog and SKUs") > 0.45);
  });
});

describe("diffMcpTools", () => {
  it("MCP-DESC-001: minor description change is warning, not breaking", () => {
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
        description: "Search the catalog by keyword",
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
