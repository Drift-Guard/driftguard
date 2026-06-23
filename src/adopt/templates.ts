import { VERSION } from "../mcp/constants.js";
import { BUNDLE_LOCKFILE_DEFAULT } from "../manifest/paths.js";
import type { RepoKind } from "./discover.js";

export type AdoptionLevel = 1 | 2 | 3;

export function manifestYaml(input: {
  kind: RepoKind;
  adoptionLevel: AdoptionLevel;
  scanRoots: string[];
  hostedRequired?: boolean;
}): string {
  const roots =
    input.scanRoots.length > 0 ? input.scanRoots : ["mcp.json", ".cursor/mcp.json"];
  const hostedRequired = input.hostedRequired ?? input.adoptionLevel >= 3;
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
  required: ${hostedRequired}
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

export function agentsYamlLevel3(input: {
  mcpConfigPath: string;
  servers: Array<{ name: string; url: string }>;
  agentId?: string;
}): string {
  const agentId = input.agentId ?? "default-agent";
  const lockServers = input.servers.map((s) => s.name);
  const watches = input.servers.map((s) => `      - type: mcp\n        url: ${s.url}`).join("\n");
  return `version: 1
agents:
  - id: ${agentId}
    environment: staging
    policy: staging-strict
    mcp:
      configPath: ${input.mcpConfigPath}
      lockServers: [${lockServers.join(", ")}]
    watches:
${watches}
`;
}

export function workflowManifestYaml(scanRoots: string[], level: AdoptionLevel): string {
  const scanPaths = (scanRoots.length > 0 ? scanRoots : ["mcp.json", ".cursor/mcp.json"]).join(
    ",",
  );
  const harnessJob =
    level >= 2
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

  const agentsJob =
    level >= 3
      ? `
  agents-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Drift-Guard/driftguard/.github/actions/drift-agents-lint@v${VERSION}
        with:
          manifest: .driftguard/agents.yaml
`
      : "";

  const coverageGate =
    level >= 3
      ? `
  # Uncomment after DRIFTGUARD_API_KEY is configured:
  # coverage-gate:
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - uses: Drift-Guard/driftguard/.github/actions/drift-coverage@v${VERSION}
  #       with:
  #         api-key: \${{ secrets.DRIFTGUARD_API_KEY }}
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
${harnessJob}${agentsJob}
  coverage-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Drift-Guard/driftguard/.github/actions/drift-coverage-preview@v${VERSION}
        with:
          scan-paths: ${scanPaths}
${coverageGate}`;
}
