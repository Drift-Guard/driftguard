#!/usr/bin/env node
import {
  assertCoverage,
  coveragePreview,
  formatCiUpgradeSummary,
} from "./coverage-api.js";

export async function runCoveragePreview(opts: {
  filesJson: string;
  repo?: string;
  runId?: string;
  failOnMissing?: boolean;
}): Promise<number> {
  const files = JSON.parse(opts.filesJson) as Array<{ path: string; content: string }>;
  const result = await coveragePreview({
    files,
    repo: opts.repo ?? process.env.GITHUB_REPOSITORY ?? process.env.DRIFTGUARD_CI_REPO,
    runId: opts.runId ?? process.env.GITHUB_RUN_ID,
  });
  const body = result.body as Record<string, unknown>;
  console.log(JSON.stringify(body, null, 2));

  const summary = formatCiUpgradeSummary(body);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const fs = await import("node:fs/promises");
    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
  } else {
    console.error("\n" + summary.replace(/^### /gm, "").replace(/\*\*/g, ""));
  }

  const missingCount = Number((body as { missingCount?: number }).missingCount ?? 0);
  if (opts.failOnMissing && missingCount > 0) return 1;
  return 0;
}

export async function runAssertCoverage(opts: {
  filesJson: string;
  apiKey?: string;
  trialSession?: string;
  repo?: string;
}): Promise<number> {
  const files = JSON.parse(opts.filesJson) as Array<{ path: string; content: string }>;
  const result = await assertCoverage({
    apiKey: opts.apiKey,
    trialSession: opts.trialSession,
    files,
    repo: opts.repo ?? process.env.GITHUB_REPOSITORY ?? process.env.DRIFTGUARD_CI_REPO,
  });
  const body = result.body as Record<string, unknown>;
  console.log(JSON.stringify(body, null, 2));

  const summary = formatCiUpgradeSummary(body);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const fs = await import("node:fs/promises");
    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
  }

  if (!result.ok) {
    const upgrade = body.upgrade as { console?: string; start?: string } | undefined;
    if (upgrade?.console) {
      console.error(`\n→ Open console to fix: ${upgrade.console}`);
    }
    return 1;
  }
  return 0;
}
