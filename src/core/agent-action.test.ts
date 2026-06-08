import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SchemaChange } from "./diff.js";
import {
  enrichChangesWithAgentActions,
  explainDriftChanges,
  suggestAgentAction,
} from "./agent-action.js";

function change(partial: Partial<SchemaChange> & Pick<SchemaChange, "path" | "changeType" | "severity">): SchemaChange {
  return {
    message: partial.message ?? "changed",
    before: partial.before,
    after: partial.after,
    ...partial,
  };
}

describe("suggestAgentAction", () => {
  it("advises MCP tool removal", () => {
    const action = suggestAgentAction(
      change({
        path: "tools.search",
        changeType: "removed",
        severity: "breaking",
      }),
    );
    assert.match(action, /MCP tool 'search'/);
  });

  it("advises OpenAPI operation removal", () => {
    const action = suggestAgentAction(
      change({
        path: "GET /v1/users",
        changeType: "removed",
        severity: "breaking",
      }),
    );
    assert.match(action, /operation GET \/v1\/users/);
  });

  it("advises required field additions", () => {
    const action = suggestAgentAction(
      change({
        path: "billing_country",
        changeType: "required_added",
        severity: "breaking",
      }),
    );
    assert.match(action, /required value/);
  });

  it("falls back to generic review message", () => {
    const action = suggestAgentAction(
      change({
        path: "meta.version",
        changeType: "removed",
        severity: "warning",
        message: "description updated",
      }),
    );
    assert.match(action, /Review drift at meta.version/);
  });
});

describe("explainDriftChanges", () => {
  it("summarizes breaking changes", () => {
    const { summary, changes } = explainDriftChanges([
      change({ path: "id", changeType: "removed", severity: "breaking" }),
    ]);
    assert.match(summary, /breaking change/);
    assert.equal(changes.length, 1);
    assert.ok(changes[0]?.agentAction);
  });

  it("reports informational-only drift", () => {
    const { summary } = explainDriftChanges([
      change({ path: "note", changeType: "added", severity: "info" }),
    ]);
    assert.match(summary, /Informational/);
  });
});

describe("enrichChangesWithAgentActions", () => {
  it("attaches agentAction to every change", () => {
    const enriched = enrichChangesWithAgentActions([
      change({ path: "a", changeType: "added", severity: "info" }),
    ]);
    assert.equal(enriched[0]?.agentAction.length > 0, true);
  });
});
