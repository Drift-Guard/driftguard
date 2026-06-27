import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { listMcpJsonHttpServers, LockfileError } from "@driftguard/diff-core";
import type { ContractManifest } from "../manifest/validate.js";

const SCAN_CANDIDATES = ["mcp.json", ".cursor/mcp.json", "package.json"] as const;

const MCP_CONFIG_CANDIDATES = ["mcp.json", ".cursor/mcp.json"] as const;

export type RepoKind = ContractManifest["kind"];

export function discoverScanRoots(repoRoot: string): string[] {
  return SCAN_CANDIDATES.filter((rel) => existsSync(join(repoRoot, rel)));
}

export function discoverRepoKind(repoRoot: string, scanRoots: string[]): RepoKind {
  if (scanRoots.includes(".cursor/mcp.json")) return "agent-repo";
  if (existsSync(join(repoRoot, "agents")) || existsSync(join(repoRoot, "src/agents"))) {
    return "agent-repo";
  }
  if (scanRoots.includes("mcp.json")) return "mcp-server";
  return "library";
}

export function findMcpConfigForLock(repoRoot: string): string | null {
  for (const rel of MCP_CONFIG_CANDIDATES) {
    const abs = join(repoRoot, rel);
    if (!existsSync(abs)) continue;
    try {
      const parsed = JSON.parse(readFileSync(abs, "utf8")) as unknown;
      listMcpJsonHttpServers(parsed);
      return rel;
    } catch (err) {
      if (err instanceof LockfileError) continue;
      throw err;
    }
  }
  return null;
}
