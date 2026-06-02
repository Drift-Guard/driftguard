import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runOpenApiDiff } from "./openapi-diff-run.js";
import { runOpenApiChangelog } from "./openapi-changelog-run.js";

const petstoreV1 = {
  openapi: "3.0.0",
  info: { title: "Petstore", version: "1.0.0" },
  paths: {
    "/pets": {
      get: {
        responses: { "200": { description: "ok", content: { "application/json": { schema: { type: "array" } } } } },
      },
    },
  },
};

const petstoreV2 = {
  ...petstoreV1,
  info: { title: "Petstore", version: "2.0.0" },
  paths: {},
};

function writeSpecs(): { dir: string; base: string; target: string } {
  const dir = mkdtempSync(join(tmpdir(), "dg-openapi-"));
  const base = join(dir, "base.json");
  const target = join(dir, "target.json");
  writeFileSync(base, JSON.stringify(petstoreV1));
  writeFileSync(target, JSON.stringify(petstoreV2));
  return { dir, base, target };
}

describe("openapi-diff CLI", () => {
  it("G1: detects breaking changes and exits 1 with --fail-on-breaking", async () => {
    const { dir, base, target } = writeSpecs();
    try {
      const code = await runOpenApiDiff([base, target, "--fail-on-breaking"]);
      assert.equal(code, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns JSON payload with --json", async () => {
    const { dir, base, target } = writeSpecs();
    try {
      const logs: string[] = [];
      const orig = console.log;
      console.log = (msg: string) => logs.push(msg);
      const code = await runOpenApiDiff([base, target, "--json"]);
      console.log = orig;
      assert.equal(code, 0);
      const body = JSON.parse(logs.join("\n"));
      assert.ok(body.breakingCount >= 1);
      assert.ok(body.changelog?.markdown);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("openapi-changelog CLI", () => {
  it("prints markdown changelog", () => {
    const { dir, base, target } = writeSpecs();
    try {
      const logs: string[] = [];
      const orig = console.log;
      console.log = (msg: string) => logs.push(msg);
      const code = runOpenApiChangelog([base, target]);
      console.log = orig;
      assert.equal(code, 0);
      assert.match(logs.join("\n"), /Breaking/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
