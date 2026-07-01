import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { diffSchemas, inferSchema } from "@drift-guard/diff-core";

describe("ARCH-U01 runtime package resolution", () => {
  it("resolves compiled dist via package name (CLI smoke path)", () => {
    const before = inferSchema({ id: 1, name: "test" }, "$", { profile: "cli" });
    const after = inferSchema({ id: 1 }, "$", { profile: "cli" });
    const result = diffSchemas(before, after);
    assert.equal(result.breakingCount, 1);
  });
});
