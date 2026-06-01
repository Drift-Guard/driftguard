#!/usr/bin/env node
import {
  assertCoverage,
  coveragePreview,
  formatCiUpgradeSummary,
  mintTrialSession,
} from "./coverage-api.js";
import { ciRepo, ciRunId, appendCiSummary } from "./ci-platform.js";

export async function runCoveragePreview(opts: {
  filesJson: string;
  repo?: string;
  runId?: string;
  failOnMissing?: boolean;
}): Promise<number> {
  const files = JSON.parse(opts.filesJson) as Array<{ path: string; content: string }>;
  const result = await coveragePreview({
    files,
    repo: opts.repo ?? ciRepo(),
    runId: opts.runId ?? ciRunId(),
  });
  const body = result.body as Record<string, unknown>;
  console.log(JSON.stringify(body, null, 2));

  let summaryBody = body;
  const upgrade = body.upgrade as { ciSetup?: string } | undefined;
  if (upgrade?.ciSetup && process.env.DRIFTGUARD_MINT_TRIAL_SESSION !== "0") {
    const mint = await mintTrialSession({
      repo: opts.repo ?? ciRepo(),
      importToken: new URL(upgrade.ciSetup).searchParams.get("import") ?? undefined,
    });
    if (mint.ok) {
      summaryBody = { ...body, trialGate: (mint.body as Record<string, unknown>).trialGate };
    }
  }

  const summary = formatCiUpgradeSummary(summaryBody);
  await appendCiSummary(summary);

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
    repo: opts.repo ?? ciRepo(),
  });
  const body = result.body as Record<string, unknown>;
  console.log(JSON.stringify(body, null, 2));

  const summary = formatCiUpgradeSummary(body);
  await appendCiSummary(summary);

  if (!result.ok) {
    const upgrade = body.upgrade as { console?: string; start?: string } | undefined;
    if (upgrade?.console) {
      console.error(`\n→ Open console to fix: ${upgrade.console}`);
    }
    return 1;
  }
  return 0;
}
