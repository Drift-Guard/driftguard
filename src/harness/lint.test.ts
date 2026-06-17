import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lintHarnessBundle } from "../harness/lint.js";
import { validateGatesYamlText } from "../harness/validate-gates.js";
import { validateHarnessLockText } from "../harness/validate-lock.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../..", import.meta.url).pathname;
const bundleDir = join(repoRoot, "examples/harness/.driftguard");

describe("harness bundle lint", () => {
  it("validates example gates.yaml", () => {
    const yaml = readFileSync(join(bundleDir, "gates.yaml"), "utf8");
    const result = validateGatesYamlText(yaml);
    assert.equal(result.ok, true);
  });

  it("validates example harness.lock", () => {
    const yaml = readFileSync(join(bundleDir, "harness.lock"), "utf8");
    const result = validateHarnessLockText(yaml);
    assert.equal(result.ok, true);
  });

  it("lints example harness bundle paths", () => {
    const result = lintHarnessBundle(bundleDir, repoRoot);
    assert.equal(result.ok, true);
  });

  it("lints MGFA harness bundle with agents.yaml and toolchange pins", () => {
    const mgfaDir = join(repoRoot, "examples/harness-mgfa/.driftguard");
    const lockYaml = readFileSync(join(mgfaDir, "harness.lock"), "utf8");
    const lock = validateHarnessLockText(lockYaml);
    assert.equal(lock.ok, true);
    const result = lintHarnessBundle(mgfaDir, repoRoot);
    assert.equal(result.ok, true);
  });
});
