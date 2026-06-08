import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DiffResult } from "./diff.js";
import { buildOpenApiChangelog } from "./openapi-changelog.js";

function diff(partial: Partial<DiffResult>): DiffResult {
  return {
    hasChanges: partial.hasChanges ?? true,
    breakingCount: partial.breakingCount ?? 0,
    warningCount: partial.warningCount ?? 0,
    infoCount: partial.infoCount ?? 0,
    changes: partial.changes ?? [],
  };
}

describe("buildOpenApiChangelog", () => {
  it("reports no changes when diff is empty", () => {
    const changelog = buildOpenApiChangelog(
      diff({ hasChanges: false, breakingCount: 0, warningCount: 0, infoCount: 0, changes: [] }),
    );
    assert.match(changelog.summary, /No OpenAPI changes/);
    assert.equal(changelog.sections.breaking.length, 0);
  });

  it("groups changes by severity in markdown", () => {
    const changelog = buildOpenApiChangelog(
      diff({
        breakingCount: 1,
        warningCount: 1,
        infoCount: 1,
        changes: [
          {
            path: "GET /a",
            changeType: "removed",
            severity: "breaking",
            message: "removed op",
          },
          {
            path: "GET /b",
            changeType: "type_changed",
            severity: "warning",
            message: "type changed",
          },
          {
            path: "GET /c",
            changeType: "added",
            severity: "info",
            message: "new op",
          },
        ],
      }),
      { base: "old.yaml", target: "new.yaml" },
    );
    assert.match(changelog.markdown, /old.yaml → new.yaml/);
    assert.match(changelog.markdown, /## Breaking/);
    assert.match(changelog.markdown, /GET \/a/);
    assert.equal(changelog.sections.warning.length, 1);
    assert.equal(changelog.sections.info.length, 1);
  });
});
