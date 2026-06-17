import { HOSTED_API, hostedFetchSignal, VERSION } from "../mcp/constants.js";
import type { AgentsManifest } from "../agents/validate.js";

export type A2aCoverageResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

function ciHeaders(apiKey: string, extra: Record<string, string> = {}) {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
    "x-driftguard-client-version": VERSION,
    ...extra,
  };
}

export async function assertA2aCoverage(opts: {
  apiKey: string;
  manifest: AgentsManifest;
  api?: string;
  repo?: string;
}): Promise<A2aCoverageResult> {
  const api = opts.api ?? HOSTED_API;
  const res = await fetch(`${api}/api/a2a/coverage/assert`, {
    method: "POST",
    headers: ciHeaders(opts.apiKey, {
      ...(opts.repo ? { "x-driftguard-ci-repo": opts.repo } : {}),
    }),
    body: JSON.stringify({ manifest: opts.manifest, repo: opts.repo }),
    signal: hostedFetchSignal(),
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

export function formatA2aCoverageSummary(body: Record<string, unknown>): string {
  const upgrade = body.upgrade as Record<string, string> | undefined;
  const missing = body.missingWatchUrls as string[] | undefined;
  const agents = body.agents as Array<{
    id: string;
    missingWatches?: Array<{ type: string; url: string }>;
  }> | undefined;
  const lines = [
    "### DriftGuard A2A coverage",
    "",
    String(body.message ?? (body.ok ? "All manifest watches are registered." : "A2A coverage check failed.")),
    "",
  ];
  if (missing?.length) {
    lines.push("**Unregistered manifest watches:**", "");
    for (const url of missing.slice(0, 8)) {
      lines.push(`- ${url}`);
    }
    if (missing.length > 8) lines.push(`- … and ${missing.length - 8} more`);
    lines.push("");
  }
  if (agents?.length) {
    const withGaps = agents.filter((a) => (a.missingWatches?.length ?? 0) > 0);
    if (withGaps.length) {
      lines.push("**Agents with missing watches:**", "");
      for (const agent of withGaps.slice(0, 6)) {
        const urls = (agent.missingWatches ?? []).map((w) => `\`${w.type}\` ${w.url}`).join(", ");
        lines.push(`- \`${agent.id}\`: ${urls}`);
      }
      lines.push("");
    }
  }
  if (upgrade) {
    lines.push(
      "**Register watches:**",
      "",
      `- [Open console & import watches](${upgrade.console})`,
      `- [View pricing](${upgrade.pricing})`,
      "",
    );
  }
  return lines.join("\n");
}
