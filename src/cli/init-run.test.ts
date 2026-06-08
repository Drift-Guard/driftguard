import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { runInit } from "./init-run.js";

describe("runInit", () => {
  let tmpDir: string;
  let prevCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dg-init-"));
    prevCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(prevCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes .driftguard.yml with detected package name", () => {
    fs.writeFileSync("package.json", JSON.stringify({ name: "@acme/billing-api" }));
    const code = runInit(["--yes"]);
    assert.equal(code, 0);
    const yaml = fs.readFileSync(".driftguard.yml", "utf8");
    assert.match(yaml, /serviceName: billing-api/);
    assert.match(yaml, /failOnBreaking: true/);
  });

  it("returns 2 when config exists without --yes", () => {
    fs.writeFileSync(".driftguard.yml", "existing: true\n");
    assert.equal(runInit([]), 2);
  });
});
