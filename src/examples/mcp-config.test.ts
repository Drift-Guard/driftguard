import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { VERSION } from "../mcp/constants.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("examples/mcp-client-config.json", () => {
  it("uses npx without absolute paths", () => {
    const raw = readFileSync(join(repoRoot, "examples/mcp-client-config.json"), "utf8");
    const config = JSON.parse(raw) as {
      mcpServers: {
        driftguard: { command: string; args: string[]; env?: Record<string, string> };
      };
    };
    const dg = config.mcpServers.driftguard;
    assert.equal(dg.command, "npx");
    assert.ok(dg.args.includes("-y"));
    assert.ok(dg.args.some((arg) => arg === `@driftguard/driftguard@${VERSION}`));
    assert.equal(dg.args.at(-1), "mcp");
    for (const arg of dg.args) {
      assert.ok(!arg.startsWith("/"), `arg must not be absolute path: ${arg}`);
      assert.ok(!arg.includes("/Users/"), `arg must not contain /Users/: ${arg}`);
    }
    const serialized = JSON.stringify(config);
    assert.ok(!serialized.includes("/absolute/"));
    assert.ok(!serialized.includes("/Users/"));
  });
});
