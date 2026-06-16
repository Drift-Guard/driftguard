import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { missingApiKeyMessage, parseJsonString } from "./tool-input.js";

describe("parseJsonString", () => {
  it("parses valid JSON", () => {
    const result = parseJsonString('{"a":1}', "mcpJson");
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.value, { a: 1 });
  });

  it("returns error for invalid JSON", () => {
    const result = parseJsonString("{", "changesJson");
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /changesJson/);
  });
});

describe("missingApiKeyMessage", () => {
  it("includes trial and pricing URLs", () => {
    const msg = missingApiKeyMessage();
    assert.match(msg, /DRIFTGUARD_API_KEY/);
    assert.match(msg, /driftguard\.org/);
  });

  it("mentions offline sibling tools", () => {
    const msg = missingApiKeyMessage();
    assert.match(msg, /compare_json/);
    assert.match(msg, /parse_mcp_config/);
    assert.match(msg, /hosted_info/);
  });
});
