import { readFileSync, writeFileSync } from "node:fs";
import {
  buildLockServer,
  buildLockfile,
  listMcpJsonHttpServers,
  LockfileError,
  parseLockfile,
  serializeLockfile,
  toolsFromProbe,
  type McpToolSnapshot,
} from "@drift-guard/diff-core";
import { VERSION } from "../mcp/constants.js";
import { fetchMcpToolsList } from "../core/mcp-probe.js";
import { BUNDLE_LOCKFILE_DEFAULT, isDeprecatedLockPath } from "../manifest/paths.js";
import { resolveLockfilePathFromRepo } from "../manifest/resolve-lockfile.js";

export type LockRunDeps = {
  fetchTools: (url: string) => Promise<McpToolSnapshot[]>;
  readFile?: (path: string) => string;
  writeFile?: (path: string, content: string) => void;
};

const defaultDeps: LockRunDeps = {
  fetchTools: (url) => fetchMcpToolsList(url, { clientVersion: VERSION }),
  readFile: (path) => readFileSync(path, "utf8"),
  writeFile: (path, content) => writeFileSync(path, content, "utf8"),
};

export function parseLockArgs(argv: string[]): {
  url?: string;
  configPath?: string;
  outputPath: string;
  update: boolean;
  serverName?: string;
} {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const valueAfter = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    if (index === -1) return undefined;
    return argv[index + 1];
  };

  const update = flags.has("--update");
  const explicitOutput = valueAfter("-o") ?? valueAfter("--output");

  let outputPath: string;
  if (explicitOutput) {
    outputPath = explicitOutput;
  } else if (update) {
    outputPath = resolveLockfilePathFromRepo();
  } else {
    outputPath = BUNDLE_LOCKFILE_DEFAULT;
  }

  return {
    url: valueAfter("--url"),
    configPath: valueAfter("--config"),
    outputPath,
    update,
    serverName: valueAfter("--name"),
  };
}

export function lockUsage(): string {
  return `Usage: driftguard lock [--url URL] [--config mcp.json] [--name NAME] [-o ${BUNDLE_LOCKFILE_DEFAULT}] [--update]

Snapshot MCP tools/list into a deterministic lockfile (no API key).`;
}

function warnDeprecatedLockPath(outputPath: string): void {
  if (isDeprecatedLockPath(outputPath)) {
    console.warn(
      `DG-LOCK-020 [warn]: ${outputPath} is deprecated — prefer ${BUNDLE_LOCKFILE_DEFAULT}`,
    );
  }
}

function collectLockTargets(
  opts: ReturnType<typeof parseLockArgs>,
  readFile: (path: string) => string,
): Array<{ name: string; url: string }> {
  if (opts.update) {
    const existing = parseLockfile(JSON.parse(readFile(opts.outputPath)));
    return existing.servers.map((server) => ({ name: server.name, url: server.url }));
  }
  if (opts.configPath) {
    const configText = readFile(opts.configPath);
    return listMcpJsonHttpServers(JSON.parse(configText));
  }
  if (opts.url) {
    const name = opts.serverName ?? new URL(opts.url).hostname.replace(/^www\./, "");
    return [{ name, url: opts.url }];
  }
  return [];
}

export async function runLock(argv: string[], deps: LockRunDeps = defaultDeps): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(lockUsage());
    return 0;
  }

  let opts;
  try {
    opts = parseLockArgs(argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 2;
  }

  if (!opts.url && !opts.configPath && !opts.update) {
    console.error(lockUsage());
    return 2;
  }

  try {
    const targets = collectLockTargets(opts, deps.readFile!);
    const servers = [];
    for (const target of targets) {
      const tools = await deps.fetchTools(target.url);
      servers.push(
        buildLockServer({
          name: target.name,
          url: target.url,
          tools: toolsFromProbe(tools),
        }),
      );
    }

    const lockfile = buildLockfile(servers, {
      generator: "@drift-guard/driftguard",
      generatedAt: new Date().toISOString(),
    });
    deps.writeFile!(opts.outputPath, serializeLockfile(lockfile));
    warnDeprecatedLockPath(opts.outputPath);
    console.log(`Wrote ${opts.outputPath} (${lockfile.servers.length} server(s), ${VERSION})`);
    return 0;
  } catch (err) {
    if (err instanceof LockfileError) {
      console.error(err.message);
      return 2;
    }
    console.error(err instanceof Error ? err.message : "lock failed");
    return 2;
  }
}
