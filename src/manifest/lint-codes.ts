/** Stable Contract Manifest lint codes — see docs/reference/manifest-lint-codes.md */

export type LintSeverity = "error" | "warn" | "info";

export function formatLintCode(
  code: string,
  message: string,
  severity: LintSeverity = "error",
): string {
  return `${code} [${severity}]: ${message}`;
}

export const DG_MAN = {
  MISSING_MANIFEST: "DG-MAN-001",
  MISSING_GATES: "DG-MAN-002",
  MISSING_AGENTS: "DG-MAN-003",
  SCAN_ROOT_MISSING: "DG-MAN-004",
  LOCK_DIR_MISSING: "DG-MAN-005",
  LEVEL_MISMATCH: "DG-MAN-006",
  TOOLCHANGE_UNPINNED: "DG-MAN-010",
} as const;

export const DG_LOCK = {
  MCP_LOCK_PATH: "DG-LOCK-001",
  PARSE_FAILED: "DG-LOCK-002",
  SERVER_NAME: "DG-LOCK-003",
  URL_UNCOVERED: "DG-LOCK-010",
  CHECK_WOULD_FAIL: "DG-LOCK-011",
  DEPRECATED_ROOT: "DG-LOCK-020",
  STALE: "DG-LOCK-030",
} as const;

export const DG_AGENT = {
  LOCK_SERVER_MISSING: "DG-AGENT-010",
  LOCK_SERVER_NOT_IN_CONFIG: "DG-AGENT-011",
  WATCH_WITHOUT_LOCK_SERVERS: "DG-AGENT-012",
  WATCH_URL_MISMATCH: "DG-AGENT-013",
  AGENT_UNREFERENCED: "DG-AGENT-014",
} as const;

export const DG_DOC = {
  NO_MANIFEST: "DG-DOC-001",
  HOSTED_KEY_REQUIRED: "DG-DOC-010",
  WATCH_COVERAGE_LOW: "DG-DOC-020",
  LOCK_STALE: "DG-DOC-030",
  CI_WORKFLOW_MISSING: "DG-DOC-040",
} as const;
