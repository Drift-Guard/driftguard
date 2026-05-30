#!/usr/bin/env node
import { startMcpServer } from "../mcp/server.js";
import { diffSchemas, inferSchema } from "../core/diff.js";
import { assertCoverage } from "./assert-coverage.js";
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

  if (command === "assert-coverage") {
    const key = process.env.DRIFTGUARD_API_KEY;
    if (!key) {
      console.error("DRIFTGUARD_API_KEY required (Pro/Team). Trial: " + HOSTED_TRIAL);
      process.exit(1);
    }
    const raw = readFilesJson();
    if (!raw) {
      console.error("Usage: driftguard assert-coverage '<files-json>'");
      console.error("  or set DRIFTGUARD_FILES_JSON");
      process.exit(1);
    }
    const files = JSON.parse(raw) as Array<{ path: string; content: string }>;
    const result = await assertCoverage({ apiKey: key, files });
    console.log(JSON.stringify(result.body, null, 2));
    if (!result.ok) {
      console.error(
        `Coverage assert failed (${result.status}): ${result.missingCount} missing of ${result.suggestionCount ?? "?"} suggestions`,
      );
      process.exit(1);
    }
    console.error(`Coverage assert passed (${result.suggestionCount ?? 0} suggestions)`);
    return;
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
  driftguard diff '<before-json>' '<after-json>'
  driftguard assert-coverage '<files-json>'   Hosted Pro/Team CI gate
  driftguard version [--json]
  driftguard mcp                              MCP server (stdio)

CI (pin version):
  uses: kioie/driftguard/.github/actions/drift-diff@v0.3.1
  npx driftguard@0.3.1 diff '...' '...'

Docs: https://github.com/kioie/driftguard/blob/main/docs/CI.md
Trial: ${HOSTED_TRIAL}
Pricing: ${HOSTED_PRICING}
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
