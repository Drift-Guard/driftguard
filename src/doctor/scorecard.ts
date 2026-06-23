import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateAgentsYamlText } from "../agents/validate.js";
import { lintAgentsAgainstLockfiles } from "../harness/lint-agents-lock.js";
import { validateGatesYamlText } from "../harness/validate-gates.js";
import { validateHarnessLockText, type HarnessLock } from "../harness/validate-lock.js";
import { DG_DOC, DG_LOCK, DG_MAN } from "../manifest/lint-codes.js";
import {
  BUNDLE_LOCKFILE_DEFAULT,
  LEGACY_LOCKFILE_PATH,
} from "../manifest/paths.js";
import { collectLockfilePaths, readLockfileAt } from "../manifest/resolve-lockfile.js";
import { validateManifestYamlText, type ContractManifest } from "../manifest/validate.js";

export type DoctorItemStatus = "ok" | "warn" | "error" | "skip" | "info";

export type DoctorItem = {
  id?: string;
  label: string;
  status: DoctorItemStatus;
  codes: string[];
  detail?: string;
};

export type DoctorSection = {
  id: string;
  status: DoctorItemStatus;
  items: DoctorItem[];
  reason?: string;
};

export type DoctorReport = {
  schemaVersion: 1;
  bundleDir: string;
  manifest?: { present: boolean; kind?: string; adoptionLevel?: number };
  sections: DoctorSection[];
  summary: { errors: number; warnings: number; infos: number; exitCode: number };
  nextCommands: string[];
};

function worstStatus(items: DoctorItem[]): DoctorItemStatus {
  if (items.some((i) => i.status === "error")) return "error";
  if (items.some((i) => i.status === "warn")) return "warn";
  if (items.some((i) => i.status === "info")) return "info";
  if (items.every((i) => i.status === "skip")) return "skip";
  return "ok";
}

function lockAgeDays(generatedAt: string): number {
  const ms = Date.now() - Date.parse(generatedAt);
  return Number.isFinite(ms) ? Math.floor(ms / (24 * 60 * 60 * 1000)) : 0;
}

function sectionManifest(
  repoRoot: string,
  bundleDir: string,
  manifest: ContractManifest | null,
): DoctorSection {
  const items: DoctorItem[] = [];
  if (!manifest) {
    items.push({
      label: "manifest.yaml",
      status: "info",
      codes: [DG_DOC.NO_MANIFEST],
      detail: "run driftguard adopt --level 1",
    });
    return { id: "manifest", status: "info", items };
  }

  for (const root of manifest.scanRoots) {
    if (!existsSync(join(repoRoot, root))) {
      items.push({
        label: root,
        status: "error",
        codes: [DG_MAN.SCAN_ROOT_MISSING],
        detail: "scanRoots path not found",
      });
    }
  }

  if (manifest.adoptionLevel >= 2 && !existsSync(join(bundleDir, "gates.yaml"))) {
    items.push({
      label: "gates.yaml",
      status: "error",
      codes: [DG_MAN.MISSING_GATES],
    });
  }
  if (manifest.adoptionLevel >= 3 && !existsSync(join(bundleDir, "agents.yaml"))) {
    items.push({
      label: "agents.yaml",
      status: "error",
      codes: [DG_MAN.MISSING_AGENTS],
    });
  }

  if (!items.length) {
    items.push({
      label: `adoptionLevel ${manifest.adoptionLevel}`,
      status: "ok",
      codes: [],
      detail: `kind=${manifest.kind}`,
    });
  }

  return { id: "manifest", status: worstStatus(items), items };
}

function sectionLockfiles(
  repoRoot: string,
  bundleDir: string,
  manifest: ContractManifest | null,
  harnessLock: HarnessLock | null,
): DoctorSection {
  const items: DoctorItem[] = [];
  const staleDays = manifest?.lockfiles?.staleAfterDays ?? 30;
  const paths = collectLockfilePaths(repoRoot, bundleDir, harnessLock);

  if (existsSync(join(repoRoot, LEGACY_LOCKFILE_PATH)) && !existsSync(join(repoRoot, BUNDLE_LOCKFILE_DEFAULT))) {
    items.push({
      label: LEGACY_LOCKFILE_PATH,
      status: "warn",
      codes: [DG_LOCK.DEPRECATED_ROOT],
    });
  }

  if (!paths.length) {
    items.push({
      label: "mcp lockfile",
      status: "error",
      codes: [DG_LOCK.MCP_LOCK_PATH],
      detail: "no lockfile found",
    });
    return { id: "mcp_lockfiles", status: "error", items };
  }

  for (const rel of paths) {
    const lockfile = readLockfileAt(repoRoot, rel);
    if (!lockfile) {
      items.push({
        label: rel,
        status: "error",
        codes: [DG_LOCK.MCP_LOCK_PATH],
      });
      continue;
    }
    const age = lockAgeDays(lockfile.generatedAt);
    const stale = staleDays > 0 && age > staleDays;
    items.push({
      label: rel,
      status: stale ? "warn" : "ok",
      codes: stale ? [DG_DOC.LOCK_STALE] : [],
      detail: `${lockfile.servers.length} server(s), ${age}d old`,
    });
    for (const server of lockfile.servers) {
      items.push({
        id: server.name,
        label: server.name,
        status: "ok",
        codes: [],
        detail: `${server.tools.length} tools`,
      });
    }
  }

  return { id: "mcp_lockfiles", status: worstStatus(items), items };
}

function sectionAgents(
  repoRoot: string,
  bundleDir: string,
  harnessLock: HarnessLock | null,
): DoctorSection {
  const agentsPath = join(bundleDir, "agents.yaml");
  if (!existsSync(agentsPath)) {
    return { id: "agents", status: "skip", items: [], reason: "no agents.yaml" };
  }
  const agents = validateAgentsYamlText(readFileSync(agentsPath, "utf8"));
  const items: DoctorItem[] = [];
  if (!agents.ok) {
    for (const err of agents.errors) {
      items.push({ label: "agents.yaml", status: "error", codes: [], detail: err });
    }
    return { id: "agents", status: "error", items };
  }
  const cross = lintAgentsAgainstLockfiles(repoRoot, bundleDir, harnessLock, agents.manifest);
  for (const err of cross) {
    const code = err.match(/^(DG-[A-Z]+-\d+)/)?.[1] ?? "";
    items.push({
      label: "binding",
      status: err.includes("[warn]") ? "warn" : "error",
      codes: code ? [code] : [],
      detail: err,
    });
  }
  if (!items.length) {
    for (const agent of agents.manifest.agents) {
      items.push({ id: agent.id, label: agent.id, status: "ok", codes: [] });
    }
  }
  return { id: "agents", status: worstStatus(items), items };
}

function sectionGates(bundleDir: string): DoctorSection {
  const gatesPath = join(bundleDir, "gates.yaml");
  if (!existsSync(gatesPath)) {
    return { id: "gates", status: "skip", items: [], reason: "no gates.yaml" };
  }
  const gates = validateGatesYamlText(readFileSync(gatesPath, "utf8"));
  if (!gates.ok) {
    return {
      id: "gates",
      status: "error",
      items: gates.errors.map((e) => ({ label: "gates.yaml", status: "error" as const, codes: [], detail: e })),
    };
  }
  const items: DoctorItem[] = Object.entries(gates.manifest.gates).map(([name, cfg]) => ({
    label: name,
    status: "ok" as const,
    codes: [],
    detail: cfg
      ? `enabled=${cfg.enabled}${cfg.advisory !== undefined ? ` advisory=${cfg.advisory}` : ""}`
      : undefined,
  }));
  return { id: "gates", status: "ok", items };
}

function sectionHosted(
  manifest: ContractManifest | null,
  hostedPreview?: { missingCount: number; discoveredCount: number },
): DoctorSection {
  const level = manifest?.adoptionLevel ?? 0;
  if (level < 3) {
    return { id: "hosted", status: "skip", items: [], reason: "adoptionLevel < 3" };
  }
  const items: DoctorItem[] = [];
  const apiKey = process.env.DRIFTGUARD_API_KEY?.trim();
  if (manifest?.hosted?.required && !apiKey) {
    items.push({
      label: "DRIFTGUARD_API_KEY",
      status: "error",
      codes: [DG_DOC.HOSTED_KEY_REQUIRED],
    });
  } else if (!apiKey) {
    items.push({
      label: "DRIFTGUARD_API_KEY",
      status: "warn",
      codes: [DG_DOC.WATCH_COVERAGE_LOW],
      detail: "set key for watch coverage check",
    });
  }

  if (hostedPreview && hostedPreview.discoveredCount > 0) {
    const covered = hostedPreview.discoveredCount - hostedPreview.missingCount;
    const ratio = covered / hostedPreview.discoveredCount;
    const min = manifest?.hosted?.minWatchCoverage ?? 1;
    if (ratio < min) {
      items.push({
        label: "watch coverage",
        status: "warn",
        codes: [DG_DOC.WATCH_COVERAGE_LOW],
        detail: `${covered}/${hostedPreview.discoveredCount} watched`,
      });
    } else {
      items.push({
        label: "watch coverage",
        status: "ok",
        codes: [],
        detail: `${covered}/${hostedPreview.discoveredCount} watched`,
      });
    }
  }

  if (!items.length) {
    items.push({ label: "hosted", status: "ok", codes: [] });
  }
  return { id: "hosted", status: worstStatus(items), items };
}

function sectionCi(repoRoot: string, manifest: ContractManifest | null): DoctorSection {
  const level = manifest?.adoptionLevel ?? 1;
  const candidates = [
    ".github/workflows/driftguard-manifest.yml",
    `.github/workflows/manifest-level-${level}.yml`,
    ".github/workflows/driftguard.yml",
  ];
  const found = candidates.find((p) => existsSync(join(repoRoot, p)));
  const items: DoctorItem[] = [
    found
      ? { label: found, status: "ok", codes: [] }
      : {
          label: "workflow",
          status: "error",
          codes: [DG_DOC.CI_WORKFLOW_MISSING],
          detail: "copy examples/workflows/manifest-level-N.yml",
        },
  ];
  return { id: "ci", status: worstStatus(items), items };
}

export function buildDoctorReport(
  repoRoot: string,
  bundleArg = ".driftguard",
  opts?: { hostedPreview?: { missingCount: number; discoveredCount: number } },
): DoctorReport {
  const bundleDir = join(repoRoot, bundleArg);
  const manifestPath = join(bundleDir, "manifest.yaml");
  let manifest: ContractManifest | null = null;
  if (existsSync(manifestPath)) {
    const parsed = validateManifestYamlText(readFileSync(manifestPath, "utf8"));
    if (parsed.ok) manifest = parsed.manifest;
  }

  let harnessLock = null;
  const lockPath = join(bundleDir, "harness.lock");
  if (existsSync(lockPath)) {
    const parsed = validateHarnessLockText(readFileSync(lockPath, "utf8"));
    if (parsed.ok) harnessLock = parsed.lock;
  }

  const sections = [
    sectionManifest(repoRoot, bundleDir, manifest),
    sectionLockfiles(repoRoot, bundleDir, manifest, harnessLock),
    sectionAgents(repoRoot, bundleDir, harnessLock),
    sectionGates(bundleDir),
    sectionHosted(manifest, opts?.hostedPreview),
    sectionCi(repoRoot, manifest),
  ];

  let errors = 0;
  let warnings = 0;
  let infos = 0;
  for (const section of sections) {
    for (const item of section.items) {
      if (item.status === "error") errors++;
      if (item.status === "warn") warnings++;
      if (item.status === "info") infos++;
    }
  }

  const nextCommands: string[] = [];
  if (!manifest) nextCommands.push("driftguard adopt --level 1");
  else {
    if (manifest.adoptionLevel < 2) nextCommands.push("driftguard adopt --level 2");
    if (manifest.adoptionLevel < 3) nextCommands.push("driftguard adopt --level 3");
    nextCommands.push("driftguard lint-harness .driftguard");
    if (sections.some((s) => s.items.some((i) => i.codes.includes(DG_DOC.LOCK_STALE)))) {
      nextCommands.push("driftguard lock --update");
    }
  }

  const exitCode = errors > 0 ? 1 : 0;

  return {
    schemaVersion: 1,
    bundleDir: bundleArg,
    manifest: manifest
      ? { present: true, kind: manifest.kind, adoptionLevel: manifest.adoptionLevel }
      : { present: false },
    sections,
    summary: { errors, warnings, infos, exitCode },
    nextCommands,
  };
}

export function formatDoctorReportText(report: DoctorReport): string {
  const lines: string[] = [
    `DriftGuard Contract Manifest — ${report.bundleDir}`,
  ];
  if (report.manifest?.present) {
    lines.push(`Level ${report.manifest.adoptionLevel} (${report.manifest.kind})`);
  } else {
    lines.push("No manifest — run driftguard adopt");
  }
  lines.push("");

  for (const section of report.sections) {
    if (section.status === "skip") continue;
    lines.push(`[${section.id}] ${section.status}`);
    for (const item of section.items) {
      const codes = item.codes.length ? ` ${item.codes.join(",")}` : "";
      const detail = item.detail ? ` — ${item.detail}` : "";
      lines.push(`  ${item.status === "ok" ? "✓" : item.status === "warn" ? "⚠" : item.status === "error" ? "✗" : "·"} ${item.label}${detail}${codes}`);
    }
    lines.push("");
  }

  lines.push(`Summary: ${report.summary.errors} error(s), ${report.summary.warnings} warning(s)`);
  if (report.nextCommands.length) {
    lines.push("Next:");
    for (const cmd of report.nextCommands) lines.push(`  ${cmd}`);
  }
  return lines.join("\n");
}
