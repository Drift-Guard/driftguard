import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const rulePath = join(repoRoot, "examples/cursor-rule-driftguard.mdc");

function parseMdcFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, "frontmatter block required");
  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return fields;
}

describe("examples/cursor-rule-driftguard.mdc", () => {
  it("has valid frontmatter with mcp.json glob", () => {
    const raw = readFileSync(rulePath, "utf8");
    const fm = parseMdcFrontmatter(raw);
    assert.ok(fm.description?.length, "description required");
    assert.equal(fm.globs, "**/mcp.json");
    assert.ok(raw.includes("compare_json"), "offline-first tool order");
    assert.ok(raw.includes("DRIFTGUARD_API_KEY"));
    assert.ok(raw.includes("SYSTEM_PROMPT.md"));
    assert.ok(raw.includes("AGENTS-snippet.md"));
    assert.ok(raw.includes('"command": "npx"'));
  });
});
