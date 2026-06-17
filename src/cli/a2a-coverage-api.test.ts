import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { assertA2aCoverage, formatA2aCoverageSummary } from "./a2a-coverage-api.js";

describe("assertA2aCoverage", () => {
  let origFetch: typeof fetch;

  beforeEach(() => {
    origFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  it("posts manifest to hosted assert endpoint", async () => {
    const manifest = {
      version: 1 as const,
      agents: [
        {
          id: "billing-refund-v3",
          environment: "staging",
          policy: "staging-strict",
          watches: [{ type: "mcp" as const, url: "https://mcp.example.com/sse" }],
        },
      ],
    };
    const calls: Array<{ url: string; init: RequestInit }> = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return Response.json({ ok: true, agents: [{ id: "billing-refund-v3", missingWatches: [] }] });
    };

    const result = await assertA2aCoverage({
      apiKey: "dg_test",
      manifest,
      repo: "acme/repo",
    });
    assert.equal(result.ok, true);
    assert.equal(calls.length, 1);
    assert.match(calls[0]!.url, /\/api\/a2a\/coverage\/assert$/);
    assert.equal((calls[0]!.init.headers as Record<string, string>).authorization, "Bearer dg_test");
    const body = JSON.parse(String(calls[0]!.init.body)) as { manifest: typeof manifest; repo: string };
    assert.equal(body.repo, "acme/repo");
    assert.equal(body.manifest.agents[0]?.id, "billing-refund-v3");
  });
});

describe("formatA2aCoverageSummary", () => {
  it("includes missing watch URLs and console link", () => {
    const summary = formatA2aCoverageSummary({
      ok: false,
      message: "2 manifest watch URL(s) are not registered.",
      missingWatchUrls: ["https://mcp.example.com/sse"],
      agents: [
        {
          id: "billing-refund-v3",
          missingWatches: [{ type: "mcp", url: "https://mcp.example.com/sse" }],
        },
      ],
      upgrade: { console: "https://driftguard.org/console", pricing: "https://driftguard.org/pricing" },
    });
    assert.match(summary, /Unregistered manifest watches/);
    assert.match(summary, /billing-refund-v3/);
    assert.match(summary, /console/);
  });
});
