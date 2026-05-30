/** Local mcp.json / URL preview — no network, no catalog matching. */

export type LocalWatchPreview = {
  name: string;
  url: string;
  watchType: "api" | "mcp";
  source: "url" | "mcp.json";
};

function slugName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "endpoint";
  }
}

function parseMcpServers(mcpJson: unknown): LocalWatchPreview[] {
  if (!mcpJson || typeof mcpJson !== "object") return [];
  const root = mcpJson as Record<string, unknown>;
  const servers =
    (root.mcpServers as Record<string, { url?: string }> | undefined) ??
    (root.servers as Record<string, { url?: string }> | undefined);
  if (!servers || typeof servers !== "object") return [];

  return Object.entries(servers)
    .filter(([, cfg]) => cfg && typeof cfg.url === "string" && cfg.url.trim())
    .map(([key, cfg]) => ({
      name: slugName(key) || "mcp-server",
      url: cfg!.url!.trim(),
      watchType: "mcp" as const,
      source: "mcp.json" as const,
    }));
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

export function parseLocalWatchPreviews(input: {
  text?: string;
  urls?: string[];
  mcpJson?: unknown;
}): LocalWatchPreview[] {
  const out: LocalWatchPreview[] = [];
  const seen = new Set<string>();

  function add(item: LocalWatchPreview) {
    const key = `${item.watchType}:${item.url}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  }

  for (const url of input.urls ?? []) {
    const trimmed = url.trim();
    if (!trimmed.startsWith("http")) continue;
    add({
      name: slugName(hostLabel(trimmed)) || "watch",
      url: trimmed,
      watchType: "api",
      source: "url",
    });
  }

  if (input.text) {
    const matches = input.text.match(URL_RE) ?? [];
    for (const url of matches) {
      add({
        name: slugName(hostLabel(url)) || "watch",
        url,
        watchType: url.includes("/mcp") ? "mcp" : "api",
        source: "url",
      });
    }
  }

  for (const item of parseMcpServers(input.mcpJson)) {
    add(item);
  }

  return out;
}
