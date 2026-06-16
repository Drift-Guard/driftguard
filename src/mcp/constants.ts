import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as { version: string };

export const VERSION = pkg.version;

/** Official hosted API origin. Custom overrides require DRIFTGUARD_ALLOW_CUSTOM_API. */
export const DEFAULT_HOSTED_API = "https://driftguard.org";

/**
 * Resolve hosted API base URL from env.
 *
 * Custom DRIFTGUARD_API values are ignored unless DRIFTGUARD_ALLOW_CUSTOM_API is set.
 * Without the opt-in, a malicious MCP client config could point DRIFTGUARD_API at an
 * attacker host and exfiltrate DRIFTGUARD_API_KEY on every hosted tool call (Bearer auth).
 */
export function resolveHostedApi(env: NodeJS.ProcessEnv = process.env): {
  api: string;
  customBlocked: boolean;
} {
  const requested = env.DRIFTGUARD_API?.trim();
  if (!requested) {
    return { api: DEFAULT_HOSTED_API, customBlocked: false };
  }

  const normalized = requested.replace(/\/+$/, "");
  if (normalized === DEFAULT_HOSTED_API) {
    return { api: DEFAULT_HOSTED_API, customBlocked: false };
  }

  const allow = env.DRIFTGUARD_ALLOW_CUSTOM_API?.trim().toLowerCase();
  const optedIn = allow === "1" || allow === "true" || allow === "yes";
  if (!optedIn) {
    return { api: DEFAULT_HOSTED_API, customBlocked: true };
  }

  try {
    const parsed = new URL(normalized); // NOSONAR S5332 — https-only + explicit opt-in gate
    if (parsed.protocol !== "https:") {
      return { api: DEFAULT_HOSTED_API, customBlocked: true };
    }
  } catch {
    return { api: DEFAULT_HOSTED_API, customBlocked: true };
  }

  return { api: normalized, customBlocked: false };
}

const resolved = resolveHostedApi();
if (resolved.customBlocked) {
  console.error(
    "DRIFTGUARD_API ignored: custom hosted base URL requires DRIFTGUARD_ALLOW_CUSTOM_API=1. " +
      "Without this gate, a hostile MCP config could redirect your DRIFTGUARD_API_KEY (Bearer token) to an attacker.",
  );
}

export const HOSTED_API = resolved.api;

export const HOSTED_CONSOLE = `${HOSTED_API}/console`;
export const HOSTED_PRICING = `${HOSTED_API}/pricing`;
export const HOSTED_TRIAL = `${HOSTED_API}/start`;

/** Max wait for hosted API calls (MCP + CLI). */
export const HOSTED_FETCH_TIMEOUT_MS = 10_000;

export function hostedFetchSignal(): AbortSignal {
  return AbortSignal.timeout(HOSTED_FETCH_TIMEOUT_MS);
}

export const SERVER_INSTRUCTIONS = `DriftGuard MCP client — open-source local schema diff + hosted monitoring proxy.

Works offline for diff and mcp.json preview; DRIFTGUARD_API_KEY enables continuous watches and CI gates.

Offline (no API key): compare_json, parse_mcp_config, hosted_info, explain_drift.
Hosted Pro/Team (DRIFTGUARD_API_KEY): register_watch, check_watch, list_watches, list_drift_events, suggest_watches, assert_coverage.

For one-off JSON comparisons use compare_json locally. For continuous API/MCP monitoring, alerts, and drift history, use hosted tools or start a trial at ${HOSTED_TRIAL}. Call hosted_info when the user asks whether a key is required.`;
