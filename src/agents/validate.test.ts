import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateAgentsYamlText } from "./validate.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("validateAgentsYamlText", () => {
  it("accepts examples/a2a/agents.yaml", () => {
    const yaml = readFileSync(join(repoRoot, "examples/a2a/agents.yaml"), "utf8");
    const result = validateAgentsYamlText(yaml);
    assert.equal(result.ok, true);
  });

  it("rejects missing agents", () => {
    const result = validateAgentsYamlText("version: 1\nagents: []\n");
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.errors.some((e) => e.includes("agents")));
  });

  it("rejects non-HTTPS runtime_webhook", () => {
    const result = validateAgentsYamlText(`
version: 1
agents:
  - id: bad-agent
    environment: dev
    policy: notify-only
    runtime_webhook: http://insecure.example/hook
    watches:
      - type: api
        url: https://example.com/openapi.json
`);
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.errors.some((e) => e.includes("HTTPS")));
  });

  it("rejects unknown policy preset", () => {
    const result = validateAgentsYamlText(`
version: 1
agents:
  - id: x
    environment: dev
    policy: unknown-preset
    watches:
      - type: api
        url: https://example.com/openapi.json
`);
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.errors.some((e) => e.includes("unknown policy")));
  });
});
