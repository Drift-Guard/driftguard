import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("examples/AGENTS-snippet.md", () => {
  it("contains a compact copy-paste block without absolute paths", () => {
    const raw = readFileSync(join(repoRoot, "examples/AGENTS-snippet.md"), "utf8");
    const match = raw.match(/```markdown\n([\s\S]*?)```/);
    assert.ok(match, "expected markdown fenced block");
    const block = match[1]!.trimEnd();
    const lines = block.split("\n");
    assert.ok(lines.length <= 20, `snippet block must be ≤20 lines, got ${lines.length}`);
    assert.match(block, /compare_json/);
    assert.match(block, /DRIFTGUARD_API_KEY/);
    assert.match(block, /hosted_info/);
    assert.match(block, /npx/);
    assert.ok(!block.includes("/Users/"));
    assert.ok(!block.includes("/absolute/"));
  });
});
