import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatLoginExportHint } from "./api-key-hint.js";

describe("formatLoginExportHint", () => {
  it("does not include the full API key", () => {
    const sample = "a".repeat(32);
    const hint = formatLoginExportHint(sample);
    assert.ok(!hint.includes(sample));
    assert.match(hint, /<your-key>/);
    assert.match(hint, /aaaa/);
  });
});
