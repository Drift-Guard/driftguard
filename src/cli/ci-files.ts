import fs from "node:fs";

const DEFAULT_SCAN_PATHS = "mcp.json,.cursor/mcp.json,package.json";

export function buildCiFilesJson(pathsInput?: string): string {
  const paths = (pathsInput ?? process.env.DRIFTGUARD_SCAN_PATHS ?? DEFAULT_SCAN_PATHS)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const files = paths
    .filter((p) => fs.existsSync(p))
    .map((path) => ({ path, content: fs.readFileSync(path, "utf8") }));
  return JSON.stringify(files);
}

/** Prefer explicit files-json; otherwise scan repo paths (GitHub Actions + GitLab CI). */
export function readFilesJsonForCi(directJson?: string): string {
  const raw = (directJson?.trim() || process.env.DRIFTGUARD_FILES_JSON?.trim()) ?? "";
  if (raw && raw !== "[]") return raw;

  const built = buildCiFilesJson();
  const parsed = JSON.parse(built) as unknown[];
  if (!parsed.length) {
    throw new Error(
      "No scannable files found. Set DRIFTGUARD_FILES_JSON or DRIFTGUARD_SCAN_PATHS (default: mcp.json,.cursor/mcp.json,package.json).",
    );
  }
  return built;
}
