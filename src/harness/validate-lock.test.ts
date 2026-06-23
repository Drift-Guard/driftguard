import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateHarnessLockText } from "./validate-lock.js";

describe("harness.lock mcp_lock pins", () => {
  it("accepts manifests.mcp_lock with optional servers subset", () => {
    const result = validateHarnessLockText(`
version: 1
fixtures:
  - id: mcp/tool-removed
    version: "1.0.0"
    path: packages/mockdrift/fixtures/mcp-tool-removed
manifests:
  mcp_lock:
    - path: .driftguard/mcp/driftguard-lock.json
      servers: [stripe]
`);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.lock.manifests?.mcp_lock?.[0]?.path, ".driftguard/mcp/driftguard-lock.json");
  });

  it("rejects mcp_lock entry without path", () => {
    const result = validateHarnessLockText(`
version: 1
fixtures:
  - id: mcp/tool-removed
    version: "1.0.0"
    path: packages/mockdrift/fixtures/mcp-tool-removed
manifests:
  mcp_lock:
    - servers: [stripe]
`);
    assert.equal(result.ok, false);
  });
});
