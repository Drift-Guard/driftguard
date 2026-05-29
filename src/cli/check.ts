#!/usr/bin/env node
import { diffSchemas, inferSchema } from "../core/diff.js";

const [,, command, ...args] = process.argv;

async function main(): Promise<void> {
  if (command === "diff") {
    const before = JSON.parse(args[0]);
    const after = JSON.parse(args[1]);
    const result = diffSchemas(inferSchema(before), inferSchema(after));
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.breakingCount > 0 ? 1 : 0);
  }

  console.log(`DriftGuard CLI — local JSON schema diff

Usage:
  driftguard diff '<before-json>' '<after-json>'

Continuous monitoring requires hosted DriftGuard Pro:
  https://driftguard.org/pricing
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
