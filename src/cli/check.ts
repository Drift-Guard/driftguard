#!/usr/bin/env node
import { startMcpServer } from "../mcp/server.js";
import { diffSchemas, inferSchema } from "../core/diff.js";
import { runAssertCoverage, runCoveragePreview } from "./coverage-run.js";
import { printVersionJson, printVersionPlain } from "./version.js";
import { HOSTED_PRICING, HOSTED_TRIAL } from "../mcp/constants.js";

const [,, command, ...args] = process.argv;

function readFilesJson(): string {
  return process.env.DRIFTGUARD_FILES_JSON ?? args[0] ?? "";
}

async function main(): Promise<void> {
  if (command === "diff") {
    const before = JSON.parse(args[0]);
    const after = JSON.parse(args[1]);
    const result = diffSchemas(inferSchema(before), inferSchema(after));
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.breakingCount > 0 ? 1 : 0);
  }

  if (command === "coverage-preview") {
    const raw = readFilesJson();
    if (!raw) {
      console.error("Usage: driftguard coverage-preview '<files-json>'");
      process.exit(1);
    }
    const code = await runCoveragePreview({
      filesJson: raw,
      failOnMissing: process.env.DRIFTGUARD_FAIL_ON_MISSING === "1",
    });
    process.exit(code);
  }

  if (command === "assert-coverage") {
    const raw = readFilesJson();
    if (!raw) {
      console.error("Usage: driftguard assert-coverage '<files-json>'");
      process.exit(1);
    }
    const apiKey = process.env.DRIFTGUARD_API_KEY;
    const trialSession = process.env.DRIFTGUARD_TRIAL_SESSION;
    if (!apiKey && !trialSession) {
      console.error(`CI gate requires DRIFTGUARD_API_KEY (Pro) or DRIFTGUARD_TRIAL_SESSION (1 endpoint trial).`);
      console.error(`Free hook: driftguard coverage-preview — ${HOSTED_TRIAL}`);
      process.exit(1);
    }
    const code = await runAssertCoverage({ filesJson: raw, apiKey, trialSession });
    process.exit(code);
  }

  if (command === "version") {
    if (args[0] === "--json") printVersionJson();
    else printVersionPlain();
    return;
  }

  if (command === "mcp") {
    await startMcpServer();
    return;
  }

  console.log(`DriftGuard — open-source local schema diff + MCP client

Usage:
  driftguard diff '<before-json>' '<after-json>'          Free — hook (unlimited in CI)
  driftguard coverage-preview '<files-json>'             Free — scan + console upgrade links
  driftguard assert-coverage '<files-json>'              Gate — Pro key or trial (1 endpoint)
  driftguard version [--json]
  driftguard mcp

CI funnel: https://github.com/kioie/driftguard/blob/main/docs/CI.md
Trial: ${HOSTED_TRIAL}
Pricing: ${HOSTED_PRICING}
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
