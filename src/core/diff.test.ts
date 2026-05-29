import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { diffSchemas, inferSchema } from "./diff.js";

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
