#!/usr/bin/env node
/**
 * OSS-2 — validate scoped npm publish readiness before tagging.
 * Run: npm run build && node scripts/npm-publish-prep.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function requireFile(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) errors.push(`missing file: ${rel}`);
}

function checkScopedPackage(pkgPath, opts) {
  const pkg = readJson(pkgPath);
  const label = pkgPath;

  if (!pkg.name?.startsWith("@drift-guard/")) {
    errors.push(`${label}: name must be scoped @drift-guard/* (got ${pkg.name ?? "none"})`);
  }
  if (pkg.publishConfig?.access !== "public") {
    errors.push(`${label}: publishConfig.access must be "public"`);
  }
  if (!pkg.version || !/^\d+\.\d+\.\d+/.test(pkg.version)) {
    errors.push(`${label}: semver version required`);
  }
  for (const binTarget of opts.binTargets ?? []) {
    requireFile(binTarget);
  }
  for (const file of opts.files ?? []) {
    requireFile(file);
  }
  return pkg;
}

const rootPkg = checkScopedPackage("package.json", {
  binTargets: ["dist/cli/check.js", "dist/mcp/server.js"],
  files: ["dist/cli/check.js", "dist/mcp/server.js", "server.json", "examples/mcp-client-config.json"],
});

const cliPkg = checkScopedPackage("packages/cli/package.json", {
  binTargets: ["packages/cli/bin/driftguard.js", "packages/cli/bin/driftguard-mcp.js"],
  files: ["packages/cli/bin/driftguard.js"],
});

if (cliPkg.dependencies?.["@drift-guard/driftguard"] !== `^${rootPkg.version}`) {
  errors.push(
    `packages/cli/package.json: @drift-guard/driftguard dep must be ^${rootPkg.version}`,
  );
}

const serverJson = readJson("server.json");
const registryPkg = serverJson.packages?.[0];
if (registryPkg?.identifier !== rootPkg.name) {
  errors.push(`server.json identifier must match root package name (${rootPkg.name})`);
}
if (registryPkg?.version !== rootPkg.version) {
  errors.push(`server.json version must match package.json (${rootPkg.version})`);
}

if (errors.length) {
  console.error("npm publish prep failed:\n");
  for (const err of errors) console.error(`  - ${err}`);
  console.error("\nFix issues, run npm run sync-version if needed, then retry.");
  process.exit(1);
}

console.log(`npm publish prep OK — ready to tag v${rootPkg.version}`);
console.log("  @drift-guard/driftguard (primary)");
console.log("  @drift-guard/cli (alias)");
console.log("\nNext: git tag v" + rootPkg.version + " && git push origin v" + rootPkg.version);
