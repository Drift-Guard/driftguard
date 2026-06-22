import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { descriptionSimilarity, diffMcpTools, stableStringify } from "../dist/mcp.js";

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

  it("MCP-BRK-001: tool removed → breakingCount=1", () => {
    const before = [{ name: "search", inputSchema: { type: "object" } }];
    const result = diffMcpTools(before, []);
    assert.equal(result.breakingCount, 1);
    assert.equal(result.changes[0]?.severity, "breaking");
    assert.match(result.changes[0]?.message ?? "", /removed/i);
  });

  it("MCP-BRK-002: required param added → breaking", () => {
    const schema = (required: string[]) => ({
      type: "object" as const,
      properties: { q: { type: "string" } },
      required,
    });
    const before = [{ name: "search", inputSchema: schema([]) }];
    const after = [{ name: "search", inputSchema: schema(["q"]) }];
    const result = diffMcpTools(before, after);
    assert.equal(result.breakingCount, 1);
    const change = result.changes.find((c) => c.path.includes("q"));
    assert.equal(change?.severity, "breaking");
  });

  it("MCP-BRK-003: type change → breaking", () => {
    const before = [
      {
        name: "search",
        inputSchema: {
          type: "object",
          properties: { q: { type: "string" } },
        },
      },
    ];
    const after = [
      {
        name: "search",
        inputSchema: {
          type: "object",
          properties: { q: { type: "number" } },
        },
      },
    ];
    const result = diffMcpTools(before, after);
    assert.equal(result.breakingCount, 1);
    assert.equal(result.changes[0]?.severity, "breaking");
    assert.match(result.changes[0]?.message ?? "", /type changed/i);
  });

  it("MCP-BRK-004: enum value removed → breaking", () => {
    const before = [
      {
        name: "update_status",
        inputSchema: {
          type: "object",
          properties: { status: { type: "string", enum: ["active", "inactive"] } },
        },
      },
    ];
    const after = [
      {
        name: "update_status",
        inputSchema: {
          type: "object",
          properties: { status: { type: "string", enum: ["active"] } },
        },
      },
    ];
    const result = diffMcpTools(before, after);
    assert.equal(result.breakingCount, 1);
    assert.equal(result.changes[0]?.severity, "breaking");
    assert.match(result.changes[0]?.message ?? "", /enum value/i);
  });

  it("MCP-SUSP-003: enum relabel (add+remove) → suspicious", () => {
    const before = [
      {
        name: "publish",
        inputSchema: {
          type: "object",
          properties: { state: { type: "string", enum: ["draft", "published"] } },
        },
      },
    ];
    const after = [
      {
        name: "publish",
        inputSchema: {
          type: "object",
          properties: { state: { type: "string", enum: ["draft", "live"] } },
        },
      },
    ];
    const result = diffMcpTools(before, after);
    assert.equal(result.suspiciousCount, 1);
    assert.equal(result.breakingCount, 0);
    assert.equal(result.changes[0]?.severity, "suspicious");
  });

  it("MCP-WARN-001: inputSchema removed → warning", () => {
    const before = [
      {
        name: "search",
        inputSchema: { type: "object", properties: { q: { type: "string" } } },
      },
    ];
    const after = [{ name: "search" }];
    const result = diffMcpTools(before, after);
    assert.equal(result.warningCount, 1);
    const change = result.changes.find((c) => c.path === "tools.search.inputSchema");
    assert.equal(change?.severity, "warning");
  });

  it("MCP-INFO-001: new optional field → info", () => {
    const before = [
      {
        name: "search",
        inputSchema: {
          type: "object",
          properties: { q: { type: "string" } },
        },
      },
    ];
    const after = [
      {
        name: "search",
        inputSchema: {
          type: "object",
          properties: {
            q: { type: "string" },
            limit: { type: "integer" },
          },
        },
      },
    ];
    const result = diffMcpTools(before, after);
    assert.equal(result.infoCount, 1);
    assert.equal(result.breakingCount, 0);
    const change = result.changes.find((c) => c.path.includes("limit"));
    assert.equal(change?.severity, "info");
  });
});

describe("stableStringify", () => {
  it("MCP-LOCK-001: deterministic across key order", () => {
    const a = { b: 1, a: { z: 3, y: 2 } };
    const c = { a: { y: 2, z: 3 }, b: 1 };
    assert.equal(stableStringify(a), stableStringify(c));
  });
});
