import fs from "node:fs";

const DEFAULT_SCAN_PATHS = "mcp.json,.cursor/mcp.json,package.json";

const SENSITIVE_ENV_KEY = /^(api[_-]?key|token|secret|password|authorization|bearer|auth|credential)/i;

function isMcpConfigPath(filePath: string): boolean {
  const base = filePath.split("/").pop() ?? filePath;
  return base === "mcp.json" || filePath.endsWith(".cursor/mcp.json");
}

function redactEnvObject(env: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string" && SENSITIVE_ENV_KEY.test(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    out[key] = value;
  }
  return out;
}

function redactMcpServers(servers: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, cfg] of Object.entries(servers)) {
    if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
      out[name] = cfg;
      continue;
    }
    const entry = { ...(cfg as Record<string, unknown>) };
    if (entry.env && typeof entry.env === "object" && !Array.isArray(entry.env)) {
      entry.env = redactEnvObject(entry.env as Record<string, unknown>);
    }
    out[name] = entry;
  }
  return out;
}

/** Strip env secrets from MCP config files before CI coverage upload (SEC-U03). */
export function redactCiFileContent(filePath: string, content: string): string {
  if (!isMcpConfigPath(filePath)) return content;
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return content;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return content;

  const root = { ...(parsed as Record<string, unknown>) };
  if (root.mcpServers && typeof root.mcpServers === "object" && !Array.isArray(root.mcpServers)) {
    root.mcpServers = redactMcpServers(root.mcpServers as Record<string, unknown>);
  }
  return JSON.stringify(root);
}

export function buildCiFilesJson(pathsInput?: string): string {
  const paths = (pathsInput ?? process.env.DRIFTGUARD_SCAN_PATHS ?? DEFAULT_SCAN_PATHS)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const files = paths
    .filter((p) => fs.existsSync(p))
    .map((path) => ({
      path,
      content: redactCiFileContent(path, fs.readFileSync(path, "utf8")),
    }));
  return JSON.stringify(files);
}

/** Prefer explicit files-json; otherwise scan repo paths (GitHub Actions + GitLab CI). */
export function readFilesJsonForCi(directJson?: string): string {
  const raw = (directJson?.trim() || process.env.DRIFTGUARD_FILES_JSON?.trim()) ?? "";
  if (raw && raw !== "[]") {
    const parsed = JSON.parse(raw) as Array<{ path?: string; content?: string }>;
    if (Array.isArray(parsed)) {
      return JSON.stringify(
        parsed.map((file) => ({
          ...file,
          content:
            file.path && typeof file.content === "string"
              ? redactCiFileContent(file.path, file.content)
              : file.content,
        })),
      );
    }
    return raw;
  }

  const built = buildCiFilesJson();
  const parsed = JSON.parse(built) as unknown[];
  if (!parsed.length) {
    throw new Error(
      "No scannable files found. Set DRIFTGUARD_FILES_JSON or DRIFTGUARD_SCAN_PATHS (default: mcp.json,.cursor/mcp.json,package.json).",
    );
  }
  return built;
}
