#!/usr/bin/env node
import { diffSchemas, inferSchema } from "../core/diff.js";
import { captureSnapshot } from "../core/snapshot.js";

const [,, command, ...args] = process.argv;

async function main(): Promise<void> {
  if (command === "diff") {
    const before = JSON.parse(args[0]);
    const after = JSON.parse(args[1]);
    const result = diffSchemas(inferSchema(before), inferSchema(after));
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.breakingCount > 0 ? 1 : 0);
  }

  if (command === "snapshot") {
    const url = args[0];
    const watchType = (args[1] ?? "api") as "api" | "mcp";
    const snapshot = await captureSnapshot(url, watchType);
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  console.log(`Usage:
  driftguard diff '<before-json>' '<after-json>'
  driftguard snapshot <url> [api|mcp]
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
