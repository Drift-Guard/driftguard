import { HOSTED_PRICING, HOSTED_TRIAL } from "./constants.js";

export function missingApiKeyMessage(): string {
  return (
    `Hosted tool requires DRIFTGUARD_API_KEY (Pro/Team). ` +
    `Works offline without a key: compare_json, parse_mcp_config, hosted_info. ` +
    `Start a trial: ${HOSTED_TRIAL} · Pricing: ${HOSTED_PRICING}`
  );
}

export function parseJsonString(
  raw: string,
  label: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, error: `Invalid ${label} — must be valid JSON.` };
  }
}
