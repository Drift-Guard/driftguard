import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { diffSchemas, inferSchema } from "../src/index.js";

const vectors = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../contract/vectors.json"), "utf8"),
) as Array<{
  id: string;
  profile?: "cli" | "hosted";
  before?: unknown;
  after?: unknown;
  expect?: { breakingCount: number; warningCount: number; infoCount: number; changeType?: string };
  kind?: string;
}>;

describe("ARCH-U01 golden contract vectors", () => {
  for (const vector of vectors) {
    if (vector.kind === "tool_manifest") continue;
    it(vector.id, () => {
      const before = inferSchema(vector.before, "$", { profile: vector.profile });
      const after = inferSchema(vector.after, "$", { profile: vector.profile });
      const result = diffSchemas(before, after);
      assert.equal(result.breakingCount, vector.expect!.breakingCount, "breakingCount");
      assert.equal(result.warningCount, vector.expect!.warningCount, "warningCount");
      assert.equal(result.infoCount, vector.expect!.infoCount, "infoCount");
      if (vector.expect!.changeType) {
        assert.ok(result.changes.some((c) => c.changeType === vector.expect!.changeType));
      }
    });
  }
});
