import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseLocalWatchPreviews } from "./parse-mcp-json.js";

describe("parseLocalWatchPreviews", () => {
  it("extracts MCP server URLs from mcp.json", () => {
    const previews = parseLocalWatchPreviews({
      mcpJson: {
        mcpServers: {
          "stripe-mcp": { url: "https://mcp.stripe.com" },
          local: { command: "node", args: ["./server.js"] },
        },
      },
    });
    assert.equal(previews.length, 1);
    assert.equal(previews[0].watchType, "mcp");
    assert.equal(previews[0].url, "https://mcp.stripe.com");
  });

  it("extracts https URLs from text", () => {
    const previews = parseLocalWatchPreviews({
      text: "See https://api.example.com/v1/spec.json for schema",
    });
    assert.equal(previews.length, 1);
    assert.equal(previews[0].watchType, "api");
  });
});
