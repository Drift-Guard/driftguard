import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import { loadOpenApiSpecFile, parseOpenApiText } from "./openapi-load.js";

describe("parseOpenApiText", () => {
  it("parses JSON OpenAPI", () => {
    const spec = parseOpenApiText('{"openapi":"3.0.0","paths":{}}') as { openapi: string };
    assert.equal(spec.openapi, "3.0.0");
  });

  it("parses YAML OpenAPI", () => {
    const spec = parseOpenApiText("openapi: 3.0.0\npaths: {}") as { openapi: string };
    assert.equal(spec.openapi, "3.0.0");
  });

  it("throws on empty input", () => {
    assert.throws(() => parseOpenApiText("   "), /empty/);
  });
});

describe("loadOpenApiSpecFile", () => {
  const files: string[] = [];

  afterEach(() => {
    for (const file of files) fs.unlinkSync(file);
    files.length = 0;
  });

  it("loads spec from disk", () => {
    const file = path.join(os.tmpdir(), `openapi-${Date.now()}.json`);
    files.push(file);
    fs.writeFileSync(file, '{"openapi":"3.0.0","paths":{}}');
    const spec = loadOpenApiSpecFile(file) as { openapi: string };
    assert.equal(spec.openapi, "3.0.0");
  });
});
