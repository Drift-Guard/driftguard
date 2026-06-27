import type { AgentsManifest } from "../agents/validate.js";
import { formatLintCode, DG_AGENT } from "../manifest/lint-codes.js";
import { buildLockServerIndex, normalizeMcpUrl, type LockServerIndex } from "../manifest/resolve-lockfile.js";
import type { HarnessLock } from "./validate-lock.js";

export function lintAgentsAgainstLockfiles(
  repoRoot: string,
  bundleDir: string,
  harnessLock: HarnessLock | null,
  agents: AgentsManifest,
): string[] {
  const errors: string[] = [];
  const index = buildLockServerIndex(repoRoot, bundleDir, harnessLock);
  if (!index.size) return errors;

  for (const agent of agents.agents) {
    errors.push(...lintAgentLockBindings(agent.id, agent.mcp?.lockServers, index));

    const mcpWatches = agent.watches.filter((w) => w.type === "mcp");
    if (!mcpWatches.length) continue;

    if (!agent.mcp?.lockServers?.length) {
      errors.push(
        formatLintCode(
          DG_AGENT.WATCH_WITHOUT_LOCK_SERVERS,
          `agent "${agent.id}": MCP watch declared without mcp.lockServers`,
          "warn",
        ),
      );
    }

    for (const watch of mcpWatches) {
      errors.push(...lintMcpWatchUrl(agent.id, watch.url, index));
    }
  }

  return errors;
}

function lintAgentLockBindings(
  agentId: string,
  lockServers: string[] | undefined,
  index: LockServerIndex,
): string[] {
  if (!lockServers?.length) return [];
  const errors: string[] = [];
  for (const name of lockServers) {
    if (!index.has(name)) {
      errors.push(
        formatLintCode(
          DG_AGENT.LOCK_SERVER_MISSING,
          `agent "${agentId}": lockServers entry "${name}" not in MCP lockfile`,
        ),
      );
    }
  }
  return errors;
}

function lintMcpWatchUrl(agentId: string, watchUrl: string, index: LockServerIndex): string[] {
  const normalizedWatch = normalizeMcpUrl(watchUrl);
  const matched = [...index.values()].some(
    (entry) => normalizeMcpUrl(entry.url) === normalizedWatch,
  );
  if (matched) return [];

  return [
    formatLintCode(
      DG_AGENT.WATCH_URL_MISMATCH,
      `agent "${agentId}": MCP watch URL does not match any lockfile server (${watchUrl})`,
    ),
  ];
}
