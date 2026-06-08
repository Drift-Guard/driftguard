import assert from "node:assert/strict";
import fs from "node:fs";
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
    process.env.GITHUB_REPOSITORY = "kioie/driftguard";
    assert.equal(ciRepo(), "kioie/driftguard");
  });

  it("ciRunId reads GitHub run id", () => {
    process.env.GITHUB_RUN_ID = "12345";
    assert.equal(ciRunId(), "12345");
  });

  it("ciSummaryPath reads GITHUB_STEP_SUMMARY", () => {
    process.env.GITHUB_STEP_SUMMARY = "/tmp/summary.md";
    assert.equal(ciSummaryPath(), "/tmp/summary.md");
  });

  it("appendCiSummary writes to summary file when configured", async () => {
    const file = path.join(os.tmpdir(), `dg-summary-${Date.now()}.md`);
    process.env.GITHUB_STEP_SUMMARY = file;
    await appendCiSummary("### DriftGuard\n\nhello");
    assert.match(fs.readFileSync(file, "utf8"), /hello/);
    fs.unlinkSync(file);
  });
});
