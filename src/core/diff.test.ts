import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compactDiffResult, diffSchemas, inferSchema } from "./diff.js";

describe("inferSchema", () => {
  it("infers object schemas with required fields by default for CLI compare", () => {
    const schema = inferSchema({ id: 1, name: "test" });
    assert.equal(schema.type, "object");
    assert.deepEqual(schema.required, ["id", "name"]);
  });

  it("supports optional-field mode for monitoring snapshots", () => {
    const schema = inferSchema({ id: 1, name: "test" }, "$", { markAllFieldsRequired: false });
    assert.equal(schema.required, undefined);
  });
});

describe("diffSchemas", () => {
  it("detects removed fields as breaking when required", () => {
    const before = inferSchema({ id: 1, email: "a@b.com" });
    const after = inferSchema({ id: 1 });
    const result = diffSchemas(before, after);
    assert.ok(result.breakingCount >= 1);
    assert.match(result.changes[0].message, /removed/);
  });

  it("detects type changes as breaking", () => {
    const before = inferSchema({ count: 1 });
    const after = inferSchema({ count: "one" });
    const result = diffSchemas(before, after);
    assert.equal(result.breakingCount, 1);
    assert.equal(result.changes[0].changeType, "type_changed");
  });
});

describe("compactDiffResult", () => {
  it("replaces embedded inferred schemas with type strings", () => {
    const before = inferSchema({ id: 1, profile: { name: "a", tags: ["x"] } });
    const after = inferSchema({ id: 1, profile: { name: "a", tags: ["x"] }, email: "a@b.com" });
    const result = compactDiffResult(diffSchemas(before, after));
    const added = result.changes.find((c) => c.changeType === "added");
    assert.ok(added);
    assert.equal(added.after, "string");
  });

  it("keeps string before/after from type_changed changes", () => {
    const before = inferSchema({ count: 1 });
    const after = inferSchema({ count: "one" });
    const result = compactDiffResult(diffSchemas(before, after));
    assert.equal(result.changes[0].before, "number");
    assert.equal(result.changes[0].after, "string");
  });
});
