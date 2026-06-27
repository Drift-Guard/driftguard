import assert from "node:assert/strict";
import fs, { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { appendCiSummary, ciRepo, ciRunId, ciSummaryPath } from "./ci-platform.js";

describe("ci-platform", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of [
      "DRIFTGUARD_CI_REPO",
      "GITHUB_REPOSITORY",
      "CI_PROJECT_PATH",
      "GITHUB_RUN_ID",
      "CI_PIPELINE_ID",
      "CI_JOB_ID",
      "GITHUB_STEP_SUMMARY",
      "CI_JOB_SUMMARY",
    ]) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("ciRepo prefers DRIFTGUARD_CI_REPO", () => {
    process.env.DRIFTGUARD_CI_REPO = "acme/widget";
    assert.equal(ciRepo(), "acme/widget");
  });

  it("ciRepo falls back to GITHUB_REPOSITORY", () => {
    process.env.GITHUB_REPOSITORY = "Drift-Guard/driftguard";
    assert.equal(ciRepo(), "Drift-Guard/driftguard");
  });

  it("ciRunId reads GitHub run id", () => {
    process.env.GITHUB_RUN_ID = "12345";
    assert.equal(ciRunId(), "12345");
  });

  it("ciSummaryPath reads GITHUB_STEP_SUMMARY", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "dg-ci-summary-"));
    const file = path.join(dir, "summary.md");
    process.env.GITHUB_STEP_SUMMARY = file;
    assert.equal(ciSummaryPath(), file);
    rmSync(dir, { recursive: true, force: true });
  });

  it("appendCiSummary writes to summary file when configured", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "dg-summary-"));
    const file = path.join(dir, "summary.md");
    process.env.GITHUB_STEP_SUMMARY = file;
    try {
      await appendCiSummary("### DriftGuard\n\nhello");
      assert.match(fs.readFileSync(file, "utf8"), /hello/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
