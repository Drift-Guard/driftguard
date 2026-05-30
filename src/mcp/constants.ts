import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as { version: string };

export const VERSION = pkg.version;

export const HOSTED_API =
  process.env.DRIFTGUARD_API ?? "https://driftguard.eddy-d55.workers.dev";

export const HOSTED_CONSOLE = `${HOSTED_API}/console`;
export const HOSTED_PRICING = `${HOSTED_API}/pricing`;
export const HOSTED_TRIAL = `${HOSTED_API}/start`;

export const SERVER_INSTRUCTIONS = `DriftGuard MCP client — open-source local schema diff + hosted monitoring proxy.

Offline (no API key): compare_json, parse_mcp_config, hosted_info, explain_drift.
Hosted Pro/Team (DRIFTGUARD_API_KEY): register_watch, check_watch, list_watches, list_drift_events, suggest_watches, assert_coverage.

For one-off JSON comparisons use compare_json locally. For continuous API/MCP monitoring, alerts, and drift history, use hosted tools or start a trial at ${HOSTED_TRIAL}.`;
