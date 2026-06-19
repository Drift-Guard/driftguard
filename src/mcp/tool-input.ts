import { HOSTED_PRICING, HOSTED_TRIAL } from "./constants.js";

export function missingApiKeyMessage(): string {
  return (
    `Hosted tool requires DRIFTGUARD_API_KEY (Pro/Team). ` +
    `Works offline without a key: compare_json, parse_mcp_config, hosted_info, validate_payload. ` +
    `Start a trial: ${HOSTED_TRIAL} · Pricing: ${HOSTED_PRICING}`
  );
}

/** Format hosted API error responses with trial/pricing funnel links when absent. */
export function hostedApiErrorMessage(
  body: unknown,
  status: number,
): string {
  const parsed = (body && typeof body === "object" ? body : {}) as {
    error?: string;
    trialUrl?: string;
    pricingUrl?: string;
  };
  const trial = parsed.trialUrl ?? HOSTED_TRIAL;
  const pricing = parsed.pricingUrl ?? HOSTED_PRICING;
  const base = parsed.error ?? `HTTP ${status}`;
  if (/driftguard\.org\/(start|pricing)/.test(base)) return base;
  return `${base} · Start a trial: ${trial} · Pricing: ${pricing}`;
}

export function parseJsonString(
  raw: string,
  label: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) }; // NOSONAR S5144 — offline CLI/MCP; caller validates label
  } catch {
    return { ok: false, error: `Invalid ${label} — must be valid JSON.` };
  }
}
