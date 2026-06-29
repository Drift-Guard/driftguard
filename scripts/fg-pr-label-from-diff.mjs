#!/usr/bin/env node
/**
 * Map changed file paths (stdin, one per line) to fg-test/* PR labels.
 * FG_LABEL_REPO=oss|cloud (default oss)
 */
import { readFileSync } from "node:fs";

const repo = process.env.FG_LABEL_REPO === "cloud" ? "cloud" : "oss";

/** @type {Array<{ test: (p: string) => boolean; labels: string[] }>} */
const OSS_RULES = [
  { test: (p) => /^packages\/fuseguard\//.test(p), labels: ["fg-test/oss-pytest", "fg-test/oss-ci-local"] },
  { test: (p) => /^extensions\/fuseguard-vscode\//.test(p), labels: ["fg-test/oss-ci-local"] },
  { test: (p) => /^docs\/schemas\/fuse\//.test(p) || /trip_log\.schema\.json$/.test(p), labels: ["fg-test/oss-schema"] },
  { test: (p) => /^docs\//.test(p), labels: ["fg-test/oss-ip-audit"] },
  { test: (p) => /^\.github\/actions\/drift-fuse-/.test(p), labels: ["fg-test/oss-action-smoke"] },
  { test: (p) => /^\.github\/workflows\/fuse/.test(p), labels: ["fg-test/oss-action-smoke", "fg-test/oss-ci-local"] },
  { test: (p) => /^packages\//.test(p) || /^src\//.test(p) || /^\.github\//.test(p), labels: ["fg-test/oss-ci-local"] },
];

/** @type {Array<{ test: (p: string) => boolean; labels: string[] }>} */
const CLOUD_RULES = [
  { test: (p) => /^src\/services\/fuseguard\//.test(p), labels: ["fg-test/cloud-unit", "fg-test/cloud-integration"] },
  { test: (p) => /^src\/routes\/fuse/.test(p) || /^src\/routes\/fuseguard/.test(p), labels: ["fg-test/cloud-integration"] },
  { test: (p) => /^migrations\/.*fuse/i.test(p), labels: ["fg-test/cloud-integration", "fg-test/cloud-integration-full"] },
  { test: (p) => /^tests\/integration\/fuse/.test(p), labels: ["fg-test/cloud-integration"] },
  { test: (p) => /^tests\/e2e\/admin-fuse/.test(p), labels: ["fg-test/cloud-e2e-ops", "fg-test/cloud-integration"] },
  { test: (p) => /^tests\/e2e\/fuse/.test(p), labels: ["fg-test/cloud-e2e", "fg-test/cloud-integration"] },
  { test: (p) => /^web\/admin-fuse/.test(p), labels: ["fg-test/cloud-e2e-ops"] },
  { test: (p) => /^web\/console-fuse/.test(p), labels: ["fg-test/cloud-e2e"] },
  { test: (p) => /^web\/features\/fuseguard\//.test(p), labels: ["fg-test/cloud-docs"] },
  { test: (p) => /^docs\//.test(p), labels: ["fg-test/cloud-docs"] },
  { test: (p) => /^src\/services\/.*preflight/.test(p), labels: ["fg-test/preflight-regression"] },
  { test: (p) => /^scripts\/smoke-fuse/.test(p) || /^scripts\/test-soak-fuse/.test(p), labels: ["fg-test/soak"] },
  { test: (p) => /^src\//.test(p), labels: ["fg-test/cloud-typecheck", "fg-test/cloud-unit"] },
];

const rules = repo === "cloud" ? CLOUD_RULES : OSS_RULES;
const fallback = repo === "cloud" ? "fg-test/cloud-typecheck" : "fg-test/oss-ci-local";

const input =
  process.argv[2] === "--files" && process.argv[3]
    ? process.argv[3].split("\n")
  : readFileSync(0, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

const labels = new Set();
for (const path of input) {
  for (const rule of rules) {
    if (rule.test(path)) {
      for (const label of rule.labels) labels.add(label);
    }
  }
}
if (labels.size === 0) labels.add(fallback);

for (const label of [...labels].sort()) {
  console.log(label);
}
