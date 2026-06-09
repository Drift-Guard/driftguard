import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const checkPath = fileURLToPath(new URL("./check.ts", import.meta.url));
const checkSource = readFileSync(checkPath, "utf8");

const HEAVY_STATIC_IMPORTS = [
  /^\s*import\s+.+\s+from\s+["']\.\.\/mcp\/server/,
  /^\s*import\s+.+\s+from\s+["']\.\.\/core\/diff/,
  /^\s*import\s+.+\s+from\s+["']\.\/coverage-run/,
  /^\s*import\s+.+\s+from\s+["']\.\/openapi-diff-run/,
  /^\s*import\s+.+\s+from\s+["']\.\/openapi-changelog-run/,
  /^\s*import\s+.+\s+from\s+["']\.\/login-run/,
  /^\s*import\s+.+\s+from\s+["']\.\/init-run/,
];

test("check.ts keeps only thin static imports", () => {
  for (const pattern of HEAVY_STATIC_IMPORTS) {
    assert.doesNotMatch(checkSource, pattern);
  }
  assert.match(checkSource, /await import\(["']\.\.\/mcp\/server\.js["']\)/);
  assert.match(checkSource, /await import\(["']\.\/version\.js["']\)/);
});

test("driftguard version runs without loading MCP SDK", () => {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", checkPath, "version"],
    { encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" } },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/);
});
