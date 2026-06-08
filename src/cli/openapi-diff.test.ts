import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runOpenApiDiff } from "./openapi-diff-run.js";
import { runOpenApiChangelog } from "./openapi-changelog-run.js";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "../../test/fixtures/openapi");

function fixturePair(): { base: string; target: string } {
  return {
    base: join(FIXTURES, "petstore-v1.json"),
    target: join(FIXTURES, "petstore-removed-op.json"),
  };
}

describe("openapi-diff CLI", () => {
  it("G1: detects breaking changes and exits 1 with --fail-on-breaking", async () => {
    const { base, target } = fixturePair();
    const code = await runOpenApiDiff([base, target, "--fail-on-breaking"]);
    assert.equal(code, 1);
  });

  it("returns JSON payload with --json", async () => {
    const { base, target } = fixturePair();
    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);
    const code = await runOpenApiDiff([base, target, "--json"]);
    console.log = orig;
    assert.equal(code, 0);
    const body = JSON.parse(logs.join("\n"));
    assert.ok(body.breakingCount >= 1);
    assert.ok(body.changelog?.markdown);
  });
});

describe("openapi-changelog CLI", () => {
  it("prints markdown changelog", () => {
    const { base, target } = fixturePair();
    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);
    const code = runOpenApiChangelog([base, target]);
    console.log = orig;
    assert.equal(code, 0);
    assert.match(logs.join("\n"), /Breaking/);
  });
});
