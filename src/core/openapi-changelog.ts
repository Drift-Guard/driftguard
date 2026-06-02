import type { DiffResult, SchemaChange } from "./diff.js";

export interface OpenApiChangelog {
  summary: string;
  markdown: string;
  sections: {
    breaking: SchemaChange[];
    warning: SchemaChange[];
    info: SchemaChange[];
  };
}

export function buildOpenApiChangelog(
  result: DiffResult,
  labels: { base?: string; target?: string } = {},
): OpenApiChangelog {
  const sections = {
    breaking: result.changes.filter((c) => c.severity === "breaking"),
    warning: result.changes.filter((c) => c.severity === "warning"),
    info: result.changes.filter((c) => c.severity === "info"),
  };

  const summary = result.breakingCount > 0
    ? `${result.breakingCount} breaking · ${result.warningCount} warning · ${result.infoCount} info`
    : result.hasChanges
      ? `${result.warningCount} warning · ${result.infoCount} info — no breaking changes`
      : "No OpenAPI changes detected";

  const base = labels.base ?? "base";
  const target = labels.target ?? "target";
  const lines: string[] = [
    `# OpenAPI changelog (${base} → ${target})`,
    "",
    summary,
    "",
  ];

  for (const [title, items] of [
    ["Breaking", sections.breaking],
    ["Warning", sections.warning],
    ["Info", sections.info],
  ] as const) {
    if (!items.length) continue;
    lines.push(`## ${title}`, "");
    for (const change of items) {
      lines.push(`- **${change.changeType}** \`${change.path}\` — ${change.message}`);
    }
    lines.push("");
  }

  return { summary, markdown: lines.join("\n").trim(), sections };
}
