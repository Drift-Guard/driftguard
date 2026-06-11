#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = new URL("..", import.meta.url).pathname;

const { validateAgentsYamlText } = await import(
  pathToFileURL(join(repoRoot, "dist/agents/validate.js")).href
);

function collectYamlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectYamlFiles(full));
      continue;
    }
    if (entry === "agents.yaml" || entry.endsWith(".agents.yaml")) {
      files.push(full);
    }
  }
  return files;
}

const targets =
  process.argv.length > 2
    ? process.argv.slice(2)
    : [join(repoRoot, "examples/a2a/agents.yaml")];

let failed = false;
for (const target of targets) {
  const paths = target.endsWith(".yaml") ? [target] : collectYamlFiles(target);
  for (const file of paths) {
    const yaml = readFileSync(file, "utf8");
    const result = validateAgentsYamlText(yaml);
    const label = relative(repoRoot, file);
    if (result.ok) {
      console.log(`OK  ${label}`);
    } else {
      failed = true;
      console.error(`FAIL ${label}`);
      for (const err of result.errors) console.error(`  - ${err}`);
    }
  }
}

if (failed) process.exit(1);
