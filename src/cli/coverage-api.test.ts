import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  assertCoverage,
  coveragePreview,
  formatCiUpgradeSummary,
  mintTrialSession,
} from "./coverage-api.js";

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
    assert.match(md, /api\.example\.com/);
    assert.match(md, /View pricing/);
  });

  it("SEC-U04: redacts trial secret value from CI job summary", () => {
    const md = formatCiUpgradeSummary({
      message: "ok",
      trialGate: { envVar: "DRIFTGUARD_TRIAL_SESSION=super-secret-token" },
    });
    assert.match(md, /DRIFTGUARD_TRIAL_SESSION/);
    assert.doesNotMatch(md, /super-secret-token/);
    assert.match(md, /omitted from job summary/i);
  });
});

describe("hosted coverage fetch", () => {
  let origFetch: typeof fetch;

  beforeEach(() => {
    origFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  function mockFetch() {
    const calls: RequestInit[] = [];
    globalThis.fetch = async (_url, init) => {
      calls.push(init ?? {});
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response;
    };
    return calls;
  }

  it("mintTrialSession passes AbortSignal.timeout", async () => {
    const calls = mockFetch();
    await mintTrialSession({ repo: "org/repo" });
    assert.ok(calls[0]?.signal instanceof AbortSignal);
  });

  it("coveragePreview passes AbortSignal.timeout", async () => {
    const calls = mockFetch();
    await coveragePreview({ files: [{ path: "mcp.json", content: "{}" }] });
    assert.ok(calls[0]?.signal instanceof AbortSignal);
  });

  it("assertCoverage passes AbortSignal.timeout", async () => {
    const calls = mockFetch();
    await assertCoverage({ apiKey: "dg_test", files: [{ path: "mcp.json", content: "{}" }] });
    assert.ok(calls[0]?.signal instanceof AbortSignal);
  });
});
