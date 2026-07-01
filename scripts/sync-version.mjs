#!/usr/bin/env node
/** Sync versioned artifacts from package.json (run before release). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;

const serverJsonPath = path.join(root, "server.json");
const serverJson = JSON.parse(fs.readFileSync(serverJsonPath, "utf8"));
serverJson.version = version;
if (serverJson.packages?.[0]) {
  serverJson.packages[0].version = version;
  serverJson.packages[0].identifier = pkg.name;
}
fs.writeFileSync(serverJsonPath, JSON.stringify(serverJson, null, 2) + "\n");

const cliPkgPath = path.join(root, "packages/cli/package.json");
if (fs.existsSync(cliPkgPath)) {
  const cliPkg = JSON.parse(fs.readFileSync(cliPkgPath, "utf8"));
  cliPkg.version = version;
  if (cliPkg.dependencies?.["@drift-guard/driftguard"]) {
    cliPkg.dependencies["@drift-guard/driftguard"] = `^${version}`;
  }
  fs.writeFileSync(cliPkgPath, JSON.stringify(cliPkg, null, 2) + "\n");
  console.log(`Synced packages/cli/package.json → ${version}`);
}

console.log(`Synced server.json → ${version}`);
