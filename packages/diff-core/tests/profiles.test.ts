import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inferSchema } from "../dist/index.js";
import { resolveMarkAllFieldsRequired } from "../dist/profiles.js";

describe("ARCH-U01 profile seams", () => {
  it("cli profile marks observed fields required", () => {
    const schema = inferSchema({ id: 1, name: "x" }, "$", { profile: "cli" });
    assert.deepEqual(schema.required, ["id", "name"]);
  });

  it("hosted profile leaves fields optional unless explicit", () => {
    const schema = inferSchema({ id: 1, name: "x" }, "$", { profile: "hosted" });
    assert.equal(schema.required, undefined);
  });

  it("explicit markAllFieldsRequired overrides profile default", () => {
    assert.equal(resolveMarkAllFieldsRequired({ profile: "hosted", markAllFieldsRequired: true }), true);
    assert.equal(resolveMarkAllFieldsRequired({ profile: "cli", markAllFieldsRequired: false }), false);
  });
});
