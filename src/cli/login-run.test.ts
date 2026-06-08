import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { runLogin } from "./login-run.js";

describe("runLogin", () => {
  const logs: string[] = [];
  const errors: string[] = [];
  let origLog: typeof console.log;
  let origError: typeof console.error;
  let origFetch: typeof fetch;

  beforeEach(() => {
    logs.length = 0;
    errors.length = 0;
    origLog = console.log;
    origError = console.error;
    console.log = (msg: string) => logs.push(msg);
    console.error = (msg: string) => errors.push(msg);
    origFetch = globalThis.fetch;
  });

  afterEach(() => {
    console.log = origLog;
    console.error = origError;
    globalThis.fetch = origFetch;
    delete process.env.DRIFTGUARD_API_KEY;
  });

  it("redacts API key in success output", async () => {
    const sample = "b".repeat(32);
    globalThis.fetch = async () =>
      ({
        ok: true,
        json: async () => ({ email: "a@b.com", plan: "pro" }),
      }) as Response;

    const code = await runLogin([`--api-key=${sample}`]);
    assert.equal(code, 0);
    const output = logs.join("\n");
    assert.ok(!output.includes(sample));
    assert.match(output, /ends with/);
  });
});
