import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hostedApiErrorMessage, missingApiKeyMessage, parseJsonString } from "./tool-input.js";

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

describe("hostedApiErrorMessage", () => {
  it("appends trial and pricing URLs to API errors", () => {
    const msg = hostedApiErrorMessage({ error: "Invalid or inactive API key" }, 401);
    assert.match(msg, /Invalid or inactive API key/);
    assert.match(msg, /\/start/);
    assert.match(msg, /\/pricing/);
  });

  it("uses trialUrl and pricingUrl from response body when present", () => {
    const msg = hostedApiErrorMessage(
      {
        error: "Missing API key",
        trialUrl: "https://driftguard.org/start",
        pricingUrl: "https://driftguard.org/pricing",
      },
      401,
    );
    assert.match(msg, /https:\/\/driftguard\.org\/start/);
    assert.match(msg, /https:\/\/driftguard\.org\/pricing/);
  });

  it("does not duplicate funnel links when error already includes them", () => {
    const msg = hostedApiErrorMessage(
      { error: "See https://driftguard.org/start for a trial" },
      401,
    );
    assert.equal(msg, "See https://driftguard.org/start for a trial");
  });
});

describe("missingApiKeyMessage", () => {
  it("includes trial and pricing URLs", () => {
    const msg = missingApiKeyMessage();
    assert.match(msg, /DRIFTGUARD_API_KEY/);
    assert.match(msg, /driftguard\.org\/start/);
    assert.match(msg, /driftguard\.org\/pricing/);
  });

  it("mentions offline sibling tools", () => {
    const msg = missingApiKeyMessage();
    assert.match(msg, /compare_json/);
    assert.match(msg, /parse_mcp_config/);
    assert.match(msg, /hosted_info/);
  });
});
