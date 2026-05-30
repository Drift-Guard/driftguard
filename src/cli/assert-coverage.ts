import { HOSTED_API, VERSION } from "../mcp/constants.js";

export type CoverageFile = { path: string; content: string };

export type CoverageAssertResult = {
  ok: boolean;
  status: number;
  suggestionCount?: number;
  missingCount: number;
  body: unknown;
};

export async function assertCoverage(opts: {
  apiKey: string;
  files: CoverageFile[];
  api?: string;
}): Promise<CoverageAssertResult> {
  const api = opts.api ?? HOSTED_API;
  const res = await fetch(`${api}/api/coverage/assert`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.apiKey}`,
      "x-driftguard-client-version": VERSION,
    },
    body: JSON.stringify({ files: opts.files }),
  });
  const body = await res.json();
  const missing = (body as { missing?: unknown[] }).missing;
  const missingCount = Array.isArray(missing) ? missing.length : 0;
  return {
    ok: res.ok,
    status: res.status,
    suggestionCount: (body as { suggestionCount?: number }).suggestionCount,
    missingCount,
    body,
  };
}
