#!/usr/bin/env node
import { startMcpServer } from "../mcp/server.js";
import { diffSchemas, inferSchema } from "../core/diff.js";
import { HOSTED_PRICING, HOSTED_TRIAL } from "../mcp/constants.js";

const [,, command, ...args] = process.argv;

async function main(): Promise<void> {
  if (command === "diff") {
    const before = JSON.parse(args[0]);
    const after = JSON.parse(args[1]);
    const result = diffSchemas(inferSchema(before), inferSchema(after));
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.breakingCount > 0 ? 1 : 0);
  }

  if (command === "mcp") {
    await startMcpServer();
    return;
  }

  console.log(`DriftGuard — open-source local schema diff + MCP client

Usage:
  driftguard diff '<before-json>' '<after-json>'
  driftguard mcp                    Start MCP server (stdio)

Local (no API key):
  compare_json, parse_mcp_config, hosted_info, explain_drift

Continuous monitoring (hosted Pro/Team):
  ${HOSTED_TRIAL}
  ${HOSTED_PRICING}
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
