import { HOSTED_API, hostedFetchSignal, VERSION } from "../mcp/constants.js";

export type SuggestWatchesResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

export async function suggestWatchesCreate(opts: {
  apiKey: string;
  mcpJson: unknown;
  api?: string;
}): Promise<SuggestWatchesResult> {
  const api = opts.api ?? HOSTED_API;
  const res = await fetch(`${api}/api/watches/suggest`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.apiKey}`,
      "x-driftguard-client-version": VERSION,
    },
    body: JSON.stringify({ mcpJson: opts.mcpJson, create: true }),
    signal: hostedFetchSignal(),
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}
