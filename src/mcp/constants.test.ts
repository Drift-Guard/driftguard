import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HOSTED_FETCH_TIMEOUT_MS, hostedFetchSignal } from "./constants.js";

describe("hostedFetchSignal", () => {
  it("returns an AbortSignal with the hosted fetch timeout", () => {
    const signal = hostedFetchSignal();
    assert.ok(signal instanceof AbortSignal);
    assert.equal(signal.aborted, false);
    assert.equal(HOSTED_FETCH_TIMEOUT_MS, 10_000);
  });
});
