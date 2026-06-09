import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { buildCiFilesJson, readFilesJsonForCi } from "./ci-files.js";

describe("ci-files", () => {
  let tmpDir: string;
  let prevCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dg-ci-"));
    prevCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(prevCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.DRIFTGUARD_FILES_JSON;
    delete process.env.DRIFTGUARD_SCAN_PATHS;
  });

  it("buildCiFilesJson reads existing paths", () => {
    fs.writeFileSync("mcp.json", '{"mcpServers":{}}');
    const parsed = JSON.parse(buildCiFilesJson("mcp.json")) as Array<{ path: string }>;
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0]?.path, "mcp.json");
  });

  it("readFilesJsonForCi prefers explicit env json", () => {
    process.env.DRIFTGUARD_FILES_JSON = '[{"path":"x.json","content":"{}"}]';
    assert.equal(readFilesJsonForCi(), process.env.DRIFTGUARD_FILES_JSON);
  });

  it("readFilesJsonForCi scans when env empty", () => {
    fs.writeFileSync("package.json", "{}");
    const parsed = JSON.parse(readFilesJsonForCi()) as unknown[];
    assert.ok(parsed.length > 0);
  });

  it("readFilesJsonForCi throws when nothing to scan", () => {
    assert.throws(() => readFilesJsonForCi(), /No scannable files/);
  });

  it("SEC-U03: redacts mcp.json env secrets before upload", () => {
    fs.writeFileSync(
      "mcp.json",
      JSON.stringify({
        mcpServers: {
          stripe: { env: { API_KEY: "sk_live_secret", REGION: "us" } },
        },
      }),
    );
    const parsed = JSON.parse(buildCiFilesJson("mcp.json")) as Array<{ content: string }>;
    const content = parsed[0]?.content ?? "";
    assert.doesNotMatch(content, /sk_live_secret/);
    assert.match(content, /\[REDACTED\]/);
    assert.match(content, /"REGION":"us"/);
  });

  it("SEC-U03: redacts DRIFTGUARD_FILES_JSON mcp entries", () => {
    process.env.DRIFTGUARD_FILES_JSON = JSON.stringify([
      {
        path: ".cursor/mcp.json",
        content: JSON.stringify({ mcpServers: { x: { env: { token: "abc123" } } } }),
      },
    ]);
    const parsed = JSON.parse(readFilesJsonForCi()) as Array<{ content: string }>;
    assert.doesNotMatch(parsed[0]?.content ?? "", /abc123/);
    assert.match(parsed[0]?.content ?? "", /\[REDACTED\]/);
  });
});
