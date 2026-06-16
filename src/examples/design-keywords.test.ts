import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

const PHRASES = [
  "MCP tool catalog drift",
  "mcp.json preflight",
  "agent preflight",
  "schema drift CI",
  "A2A Agent Card vs MCP",
  "contract observability",
  "API contract monitoring",
] as const;

function collectDocFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      collectDocFiles(path, acc);
    } else if (name.endsWith(".md") || name.endsWith(".txt")) {
      acc.push(path);
    }
  }
  return acc;
}

function countPhrase(haystack: string, phrase: string): number {
  let count = 0;
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(phrase, from);
    if (idx === -1) break;
    count += 1;
    from = idx + phrase.length;
  }
  return count;
}

describe("DISC-005 design-time keywords in OSS docs", () => {
  it("each trigger phrase appears at least twice across public docs", () => {
    const files = [
      join(repoRoot, "README.md"),
      join(repoRoot, "SYSTEM_PROMPT.md"),
      ...collectDocFiles(join(repoRoot, "docs")),
    ];
    const corpus = files.map((f) => readFileSync(f, "utf8")).join("\n");

    for (const phrase of PHRASES) {
      const n = countPhrase(corpus, phrase);
      assert.ok(
        n >= 2,
        `expected "${phrase}" at least 2 times in OSS docs, found ${n}`,
      );
    }
  });
});
