import { HOSTED_API, hostedFetchSignal, VERSION } from "../mcp/constants.js";

export type CoverageFile = { path: string; content: string };

export type CoverageResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

function ciHeaders(extra: Record<string, string> = {}) {
  return {
    "content-type": "application/json",
    "x-driftguard-client-version": VERSION,
    ...extra,
  };
}

export async function mintTrialSession(opts: {
  api?: string;
  repo?: string;
  importToken?: string;
}): Promise<CoverageResult> {
  const api = opts.api ?? HOSTED_API;
  const res = await fetch(`${api}/api/trial/session`, {
    method: "POST",
    headers: ciHeaders({
      ...(opts.repo ? { "x-driftguard-ci-repo": opts.repo } : {}),
    }),
    body: JSON.stringify({ repo: opts.repo, import: opts.importToken }),
    signal: hostedFetchSignal(),
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

export async function coveragePreview(opts: {
  files: CoverageFile[];
  api?: string;
  repo?: string;
  runId?: string;
}): Promise<CoverageResult> {
  const api = opts.api ?? HOSTED_API;
  const res = await fetch(`${api}/api/coverage/preview`, {
    method: "POST",
    headers: ciHeaders({
      ...(opts.repo ? { "x-driftguard-ci-repo": opts.repo } : {}),
      ...(opts.runId ? { "x-driftguard-ci-run": opts.runId } : {}),
    }),
    body: JSON.stringify({ files: opts.files, repo: opts.repo, runId: opts.runId }),
    signal: hostedFetchSignal(),
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

export async function assertCoverage(opts: {
  apiKey?: string;
  trialSession?: string;
  files: CoverageFile[];
  api?: string;
  repo?: string;
}): Promise<CoverageResult> {
  const api = opts.api ?? HOSTED_API;
  const headers: Record<string, string> = ciHeaders({
    ...(opts.repo ? { "x-driftguard-ci-repo": opts.repo } : {}),
  });
  if (opts.apiKey) headers.authorization = `Bearer ${opts.apiKey}`;
  if (opts.trialSession) headers["x-driftguard-trial"] = opts.trialSession;

  const res = await fetch(`${api}/api/coverage/assert`, {
    method: "POST",
    headers,
    body: JSON.stringify({ files: opts.files, repo: opts.repo }),
    signal: hostedFetchSignal(),
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

export function formatCiUpgradeSummary(body: Record<string, unknown>): string {
  const upgrade = body.upgrade as Record<string, string> | undefined;
  const missing = body.missing as Array<{ url: string; watchType: string }> | undefined;
  const lines = [
    "### DriftGuard CI",
    "",
    String(body.message ?? "Coverage check complete."),
    "",
  ];
  if (missing?.length) {
    lines.push("**Unmonitored endpoints:**", "");
    for (const m of missing.slice(0, 8)) {
      lines.push(`- \`${m.watchType}\` ${m.url}`);
    }
    if (missing.length > 8) lines.push(`- … and ${missing.length - 8} more`);
    lines.push("");
  }
  if (upgrade) {
    lines.push(
      "**Upgrade (one click):**",
      "",
      `- [CI trial setup — copy DRIFTGUARD_TRIAL_SESSION](${upgrade.ciSetup || upgrade.start})`,
      `- [Open console & import watches](${upgrade.console})`,
      `- [Start free trial (1 endpoint, Pro features)](${upgrade.start})`,
      `- [View pricing](${upgrade.pricing})`,
      "",
    );
  }
  const trialGate = body.trialGate as Record<string, string> | undefined;
  if (trialGate?.envVar) {
    lines.push("**Trial CI secret:**", "", "```", trialGate.envVar, "```", "");
  }
  return lines.join("\n");
}
