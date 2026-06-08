import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseOpenApiChangelogArgs } from "./openapi-changelog-run.js";

describe("parseOpenApiChangelogArgs", () => {
  it("parses base and target paths", () => {
    const args = parseOpenApiChangelogArgs(["base.yaml", "target.yaml"]);
    assert.equal(args.basePath, "base.yaml");
    assert.equal(args.targetPath, "target.yaml");
    assert.equal(args.format, "markdown");
  });

  it("parses json format flag", () => {
    const args = parseOpenApiChangelogArgs(["a.yaml", "b.yaml", "--format=json"]);
    assert.equal(args.format, "json");
  });

  it("throws when paths missing", () => {
    assert.throws(() => parseOpenApiChangelogArgs(["only-one.yaml"]), /Usage:/);
  });
});
