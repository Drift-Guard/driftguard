import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCiUpgradeSummary } from "./coverage-api.js";

describe("formatCiUpgradeSummary", () => {
  it("includes message and upgrade links", () => {
    const md = formatCiUpgradeSummary({
      message: "2 endpoints unmonitored",
      upgrade: {
        start: "https://driftguard.org/start",
        console: "https://driftguard.org/console",
        pricing: "https://driftguard.org/pricing",
        ciSetup: "https://driftguard.org/start?ci=1",
      },
      missing: [{ url: "https://api.example.com/v1", watchType: "rest" }],
    });
    assert.match(md, /2 endpoints unmonitored/);
    assert.match(md, /Unmonitored endpoints/);
    assert.match(md, /api.example.com/);
    assert.match(md, /View pricing/);
  });

  it("includes trial gate env block when present", () => {
    const md = formatCiUpgradeSummary({
      message: "ok",
      trialGate: { envVar: "DRIFTGUARD_TRIAL_SESSION=abc" },
    });
    assert.match(md, /DRIFTGUARD_TRIAL_SESSION=abc/);
  });
});
