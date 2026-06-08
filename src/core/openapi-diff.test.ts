import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { diffOpenApiSpecs } from "./openapi-diff.js";
import { normalizeOpenApiSpec } from "./openapi-normalize.js";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "../../test/fixtures/openapi");

function loadFixture(name: string): ReturnType<typeof normalizeOpenApiSpec> {
  const raw = JSON.parse(readFileSync(join(FIXTURES, name), "utf8")) as unknown;
  return normalizeOpenApiSpec(raw);
}

function diffFixtures(baseName: string, targetName: string) {
  return diffOpenApiSpecs(loadFixture(baseName), loadFixture(targetName));
}

describe("diffOpenApiSpecs", () => {
  it("reports no changes for identical specs", () => {
    const ops = loadFixture("petstore-v1.json");
    const result = diffOpenApiSpecs(ops, ops);
    assert.equal(result.hasChanges, false);
    assert.equal(result.breakingCount, 0);
    assert.equal(result.warningCount, 0);
    assert.equal(result.infoCount, 0);
  });

  it("detects removed operation as breaking", () => {
    const result = diffFixtures("petstore-v1.json", "petstore-removed-op.json");
    assert.ok(result.breakingCount >= 1);
    assert.ok(
      result.changes.some(
        (c) => c.changeType === "removed" && c.path === "operations.GET /pets",
      ),
    );
    assert.match(result.changes.find((c) => c.path === "operations.GET /pets")?.message ?? "", /removed/);
  });

  it("detects added operation as warning", () => {
    const result = diffFixtures("petstore-v1.json", "petstore-added-op.json");
    const added = result.changes.find((c) => c.path === "operations.POST /pets");
    assert.ok(added);
    assert.equal(added?.severity, "warning");
    assert.equal(added?.changeType, "added");
  });

  it("detects parameter type change and new required parameter", () => {
    const result = diffFixtures("petstore-v1.json", "petstore-param-drift.json");
    assert.ok(
      result.changes.some(
        (c) => c.path.includes(".parameters") && c.changeType === "type_changed",
      ),
    );
    assert.ok(
      result.changes.some(
        (c) => c.path.includes("offset") && (c.changeType === "added" || c.changeType === "required_added"),
      ),
    );
  });

  it("detects response body field removal as breaking", () => {
    const result = diffFixtures("petstore-v1.json", "petstore-response-drift.json");
    const responseChanges = result.changes.filter((c) => c.path.includes(".response"));
    assert.ok(responseChanges.length > 0);
    assert.ok(
      responseChanges.some(
        (c) => c.severity === "breaking" && (c.changeType === "removed" || c.changeType === "required_removed"),
      ),
    );
  });

  it("diffs per-status response map entries", () => {
    const result = diffFixtures("petstore-v1.json", "petstore-response-drift.json");
    const responseMap = result.changes.filter((c) => c.path.includes(".responses."));
    assert.ok(responseMap.some((c) => c.path.includes("responses.default")));
  });

  it("diffs response header map when status header keys change", () => {
    const result = diffFixtures("petstore-v1.json", "petstore-header-drift.json");
    const headerChanges = result.changes.filter((c) => c.path.includes("responseHeaders"));
    assert.ok(headerChanges.length > 0);
    assert.ok(
      headerChanges.some(
        (c) => c.changeType === "removed" || c.changeType === "added" || c.path.includes("X-"),
      ),
    );
  });

  it("diffs security requirements when auth scheme changes", () => {
    const result = diffFixtures("petstore-v1.json", "petstore-param-drift.json");
    const securityChanges = result.changes.filter((c) => c.path.includes(".security"));
    assert.ok(securityChanges.length > 0);
    assert.ok(securityChanges.some((c) => c.changeType === "type_changed"));
  });

  it("detects added default response status in responses map", () => {
    const result = diffFixtures("petstore-v1.json", "petstore-response-drift.json");
    const addedDefault = result.changes.find(
      (c) => c.path.includes("responses.default") && c.changeType === "added",
    );
    assert.ok(addedDefault);
    assert.equal(addedDefault?.severity, "warning");
  });

  it("summarizes mixed severities in counts", () => {
    const result = diffFixtures("petstore-v1.json", "petstore-response-drift.json");
    assert.equal(
      result.breakingCount + result.warningCount + result.infoCount,
      result.changes.length,
    );
    assert.equal(result.hasChanges, result.changes.length > 0);
  });
});

describe("diffOpenApiSpecs fixture files on disk", () => {
  it("loads YAML-free JSON fixtures end-to-end via normalize + diff", () => {
    const before = loadFixture("petstore-v1.json");
    const after = loadFixture("petstore-added-op.json");
    assert.ok(before["GET /pets"]);
    assert.ok(after["POST /pets"]);
    const result = diffOpenApiSpecs(before, after);
    assert.ok(result.warningCount >= 1);
  });
});
