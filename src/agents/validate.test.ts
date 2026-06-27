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

  it("rejects duplicate agent ids", () => {
    const result = validateAgentsYamlText(`
version: 1
agents:
  - id: dup
    environment: dev
    policy: notify-only
    watches:
      - type: api
        url: https://example.com/openapi.json
  - id: dup
    environment: staging
    policy: notify-only
    watches:
      - type: api
        url: https://example.com/other.json
`);
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.errors.some((e) => e.includes("duplicate agent id")));
  });

  it("requires skillToolMap when a2a.cardUrl is set", () => {
    const result = validateAgentsYamlText(`
version: 1
agents:
  - id: a2a-only
    environment: dev
    policy: notify-only
    a2a:
      cardUrl: https://agent.example/.well-known/agent.json
    watches:
      - type: a2a_card
        url: https://agent.example/.well-known/agent.json
`);
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.errors.some((e) => e.includes("skillToolMap")));
  });

  it("requires a2a_card watch matching cardUrl", () => {
    const result = validateAgentsYamlText(`
version: 1
agents:
  - id: skewed-card
    environment: dev
    policy: notify-only
    a2a:
      cardUrl: https://agent.example/.well-known/agent.json
    mcp:
      configPath: .cursor/mcp.json
      skillToolMap:
        do_thing:
          - tool_a
    watches:
      - type: a2a_card
        url: https://other.example/.well-known/agent.json
`);
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.errors.some((e) => e.includes("a2a_card")));
  });

  it("requires mcp.configPath when mcp watch is declared", () => {
    const result = validateAgentsYamlText(`
version: 1
agents:
  - id: mcp-watch-only
    environment: dev
    policy: notify-only
    watches:
      - type: mcp
        url: https://mcp.example.com/sse
`);
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.errors.some((e) => e.includes("mcp.configPath")));
  });

  it("accepts optional mcp.lockServers", () => {
    const result = validateAgentsYamlText(`
version: 1
agents:
  - id: billing-refund
    environment: staging
    policy: staging-strict
    mcp:
      configPath: .cursor/mcp.json
      lockServers: [stripe, github]
    watches:
      - type: mcp
        url: https://mcp.stripe.com/mcp
`);
    assert.equal(result.ok, true);
  });
});
