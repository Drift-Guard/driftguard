import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";

export function parseOpenApiText(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("OpenAPI spec is empty");
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  return parseYaml(trimmed);
}

export function loadOpenApiSpecFile(path: string): unknown {
  return parseOpenApiText(readFileSync(path, "utf8"));
}
