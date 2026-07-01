import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { buildDoctorReport } from "./scorecard.js";
import { DG_DOC } from "../manifest/lint-codes.js";

function writeHealthyBundle(root: string, opts?: { workflow?: boolean }): void {
  writeFileSync(join(root, "mcp.json"), '{"mcpServers":{}}');
  const bundle = join(root, ".driftguard");
  mkdirSync(join(bundle, "mcp"), { recursive: true });
  writeFileSync(
    join(bundle, "manifest.yaml"),
    `version: 1
kind: agent-repo
adoptionLevel: 1
scanRoots:
  - mcp.json
lockfiles:
  dir: .driftguard/mcp
  primary: driftguard-lock.json
  failOn: breaking
  staleAfterDays: 30
`,
  );
  writeFileSync(
    join(bundle, "mcp/driftguard-lock.json"),
    JSON.stringify({
      lockfileVersion: 1,
      generator: "@drift-guard/driftguard",
      generatedAt: new Date().toISOString(),
      servers: [
        {
          name: "demo",
          transport: "streamable-http",
          url: "https://demo.example/mcp",
          tools: [{ name: "ping", inputSchema: { type: "object" } }],
        },
      ],
    }),
  );
  if (opts?.workflow !== false) {
    mkdirSync(join(root, ".github/workflows"), { recursive: true });
    writeFileSync(join(root, ".github/workflows/driftguard-manifest.yml"), "name: driftguard\n");
  }
}

describe("doctor scorecard", () => {
  it("reports info when no manifest", () => {
    const root = mkdtempSync(join(tmpdir(), "dg-doc-"));
    const report = buildDoctorReport(root);
    assert.equal(report.manifest?.present, false);
    const manifest = report.sections.find((s) => s.id === "manifest");
    assert.ok(manifest?.items.some((i) => i.codes.includes(DG_DOC.NO_MANIFEST)));
    assert.ok(report.nextCommands.includes("driftguard adopt --level 1"));
  });

  it("ok for healthy level-1 bundle", () => {
    const root = mkdtempSync(join(tmpdir(), "dg-doc-"));
    writeHealthyBundle(root);
    const report = buildDoctorReport(root);
    assert.equal(report.manifest?.present, true);
    assert.equal(report.summary.errors, 0);
    assert.ok(report.sections.some((s) => s.id === "mcp_lockfiles" && s.status === "ok"));
  });

  it("flags missing CI workflow", () => {
    const root = mkdtempSync(join(tmpdir(), "dg-doc-"));
    writeHealthyBundle(root, { workflow: false });
    const report = buildDoctorReport(root);
    const ci = report.sections.find((s) => s.id === "ci");
    assert.ok(ci?.items.some((i) => i.codes.includes(DG_DOC.CI_WORKFLOW_MISSING)));
    assert.ok(report.summary.errors >= 1);
  });
});
