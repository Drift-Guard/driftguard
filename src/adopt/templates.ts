import { VERSION } from "../mcp/constants.js";
import { BUNDLE_LOCKFILE_DEFAULT } from "../manifest/paths.js";
import type { RepoKind } from "./discover.js";

export function manifestYaml(input: {
  kind: RepoKind;
  adoptionLevel: 1 | 2;
  scanRoots: string[];
}): string {
  const roots =
    input.scanRoots.length > 0 ? input.scanRoots : ["mcp.json", ".cursor/mcp.json"];
  return `version: 1
kind: ${input.kind}
adoptionLevel: ${input.adoptionLevel}
scanRoots:
${roots.map((r) => `  - ${r}`).join("\n")}
lockfiles:
  dir: .driftguard/mcp
  primary: driftguard-lock.json
  failOn: breaking
  staleAfterDays: 30
hosted:
  required: false
  minWatchCoverage: 1
`;
}

export function gatesYamlLevel2(): string {
  return `version: 1
gates:
  agents_lint:
    enabled: true
  toolchange:
    enabled: true
    advisory: true
`;
}

export function harnessLockLevel2(fixtureId: string): string {
  return `version: 1
fixtures:
  - id: ${fixtureId}
    version: "1.0.0"
    ref: driftguard/fixtures-mcp@1.0.0
manifests:
  mcp_lock:
    - path: ${BUNDLE_LOCKFILE_DEFAULT}
`;
}

export function workflowManifestYaml(scanRoots: string[], level: 1 | 2): string {
  const scanPaths = (scanRoots.length > 0 ? scanRoots : ["mcp.json", ".cursor/mcp.json"]).join(
    ",",
  );
  const harnessJob =
    level === 2
      ? `
  harness-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Drift-Guard/driftguard/.github/actions/drift-harness-lint@v${VERSION}
        with:
          bundle: .driftguard
`
      : "";

  return `name: DriftGuard Contract Manifest

on:
  pull_request:
  push:
    branches: [main]

jobs:
  mcp-lockfile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Drift-Guard/driftguard/.github/actions/mcp-lockfile@v${VERSION}
${harnessJob}
  coverage-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Drift-Guard/driftguard/.github/actions/drift-coverage-preview@v${VERSION}
        with:
          scan-paths: ${scanPaths}
`;
}
