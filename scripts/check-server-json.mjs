#!/usr/bin/env node
/** DISC-202 — validate server.json matches package.json before MCP Registry publish. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const server = JSON.parse(fs.readFileSync(path.join(root, "server.json"), "utf8"));
const errors = [];

if (server.version !== pkg.version) {
  errors.push(`server.json version ${server.version} !== package.json ${pkg.version}`);
}
const npmPkg = server.packages?.[0];
if (!npmPkg) {
  errors.push("server.json packages[0] missing");
} else {
  if (npmPkg.registryType !== "npm") errors.push("packages[0].registryType must be npm");
  if (npmPkg.identifier !== pkg.name) {
    errors.push(`packages[0].identifier ${npmPkg.identifier} !== ${pkg.name}`);
  }
  if (npmPkg.version !== pkg.version) {
    errors.push(`packages[0].version ${npmPkg.version} !== ${pkg.version}`);
  }
  if (npmPkg.transport?.type !== "stdio") {
    errors.push("packages[0].transport.type must be stdio");
  }
}
if (!server.name?.includes("driftguard")) {
  errors.push("server.json name should identify driftguard MCP server");
}

if (errors.length) {
  console.error("check-server-json failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log(`server.json OK (@${pkg.version})`);
