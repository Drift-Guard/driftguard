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

console.log(`Synced server.json → ${version}`);
