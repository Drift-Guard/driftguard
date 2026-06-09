import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_HOSTED_API, resolveHostedApi } from "./constants.js";

describe("resolveHostedApi", () => {
  it("uses default when DRIFTGUARD_API is unset", () => {
    const result = resolveHostedApi({});
    assert.equal(result.api, DEFAULT_HOSTED_API);
    assert.equal(result.customBlocked, false);
  });

  it("accepts default URL without opt-in", () => {
    const result = resolveHostedApi({ DRIFTGUARD_API: "https://driftguard.org/" });
    assert.equal(result.api, DEFAULT_HOSTED_API);
    assert.equal(result.customBlocked, false);
  });

  it("blocks custom URL without DRIFTGUARD_ALLOW_CUSTOM_API", () => {
    const result = resolveHostedApi({ DRIFTGUARD_API: "https://evil.example" });
    assert.equal(result.api, DEFAULT_HOSTED_API);
    assert.equal(result.customBlocked, true);
  });

  it("allows custom URL with DRIFTGUARD_ALLOW_CUSTOM_API=1", () => {
    const result = resolveHostedApi({
      DRIFTGUARD_API: "https://staging.driftguard.org",
      DRIFTGUARD_ALLOW_CUSTOM_API: "1",
    });
    assert.equal(result.api, "https://staging.driftguard.org");
    assert.equal(result.customBlocked, false);
  });

  it("strips trailing slashes on custom URL", () => {
    const result = resolveHostedApi({
      DRIFTGUARD_API: "https://staging.driftguard.org///",
      DRIFTGUARD_ALLOW_CUSTOM_API: "true",
    });
    assert.equal(result.api, "https://staging.driftguard.org");
  });
});
