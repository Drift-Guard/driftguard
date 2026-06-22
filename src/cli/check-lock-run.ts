import { readFileSync } from "node:fs";
import {
  diffMcpTools,
  DEFAULT_LOCKFILE_PATH,
  parseLockfile,
  toolsFromProbe,
  type ChangeSeverity,
  type DiffResult,
} from "@driftguard/diff-core";
import type { McpToolSnapshot } from "@driftguard/diff-core";
import { VERSION } from "../mcp/constants.js";
import { fetchMcpToolsList } from "../core/mcp-probe.js";

export type CheckLockRunDeps = {
  fetchTools: (url: string) => Promise<McpToolSnapshot[]>;
  readFile?: (path: string) => string;
};

const defaultDeps: CheckLockRunDeps = {
  fetchTools: (url) => fetchMcpToolsList(url, { clientVersion: VERSION }),
  readFile: (path) => readFileSync(path, "utf8"),
};

export function parseCheckLockArgs(argv: string[]): {
  lockPath: string;
  failOn: ChangeSeverity;
  json: boolean;
} {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const positional = argv.filter((a) => !a.startsWith("--"));
  const valueAfter = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    if (index === -1) return undefined;
    return argv[index + 1];
  };

  const failOnRaw = valueAfter("--fail-on") ?? "breaking";
  if (!["breaking", "suspicious", "warning", "info"].includes(failOnRaw)) {
    throw new Error("--fail-on must be breaking, suspicious, warning, or info");
  }

  return {
    lockPath: valueAfter("--lock") ?? positional[0] ?? DEFAULT_LOCKFILE_PATH,
    failOn: failOnRaw as ChangeSeverity,
    json: flags.has("--json"),
  };
}

export function shouldFailCheck(result: DiffResult, failOn: ChangeSeverity): boolean {
  if (result.breakingCount > 0) return true;
  if (failOn === "breaking") return false;
  if (result.suspiciousCount > 0) return true;
  if (failOn === "suspicious") return false;
  if (result.warningCount > 0) return true;
  if (failOn === "warning") return false;
  return result.infoCount > 0;
}

export function mergeDiffResults(parts: DiffResult[]): DiffResult {
  const changes = parts.flatMap((part) => part.changes);
  let breakingCount = 0;
  let suspiciousCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  for (const change of changes) {
    if (change.severity === "breaking") breakingCount++;
    else if (change.severity === "suspicious") suspiciousCount++;
    else if (change.severity === "warning") warningCount++;
    else infoCount++;
  }
  return {
    hasChanges: changes.length > 0,
    breakingCount,
    suspiciousCount,
    warningCount,
    infoCount,
    changes,
  };
}

export function checkUsage(): string {
  return `Usage: driftguard check [--lock driftguard-lock.json] [--fail-on breaking|suspicious|warning|info] [--json]

Diff live MCP tools/list catalogs against a lockfile (no API key).`;
}

export async function runCheckLock(argv: string[], deps: CheckLockRunDeps = defaultDeps): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(checkUsage());
    return 0;
  }

  let opts;
  try {
    opts = parseCheckLockArgs(argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 2;
  }

  try {
    const lockfile = parseLockfile(JSON.parse(deps.readFile!(opts.lockPath)));
    const perServer: DiffResult[] = [];

    for (const server of lockfile.servers) {
      const liveTools = await deps.fetchTools(server.url);
      const lockedTools = toolsFromProbe(server.tools);
      const diff = diffMcpTools(lockedTools, liveTools);
      perServer.push({
        ...diff,
        changes: diff.changes.map((change) => ({
          ...change,
          path: `${server.name}.${change.path}`,
          message: `[${server.name}] ${change.message}`,
        })),
      });
    }

    const result = mergeDiffResults(perServer);
    const payload = {
      lockPath: opts.lockPath,
      failOn: opts.failOn,
      ...result,
    };

    if (opts.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else if (result.hasChanges) {
      console.error(
        `Drift: ${result.breakingCount} breaking, ${result.suspiciousCount} suspicious, ${result.warningCount} warning, ${result.infoCount} info`,
      );
      for (const change of result.changes) {
        console.error(`- [${change.severity}] ${change.path}: ${change.message}`);
      }
    } else {
      console.log("No drift detected");
    }

    return shouldFailCheck(result, opts.failOn) ? 1 : 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : "check failed");
    return 2;
  }
}
