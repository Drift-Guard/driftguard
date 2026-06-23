import { join } from "node:path";
import { buildCiFilesJson } from "./ci-files.js";
import { coveragePreview } from "./coverage-api.js";
import { readHostedApiKey } from "../mcp/env-secrets.js";
import { buildDoctorReport, formatDoctorReportText } from "../doctor/scorecard.js";

export function doctorUsage(): string {
  return `Usage: driftguard doctor [bundleDir] [--json] [--check-hosted]

Scorecard for Contract Manifest health (.driftguard/ by default).`;
}

export async function runDoctor(argv: string[], cwd = process.cwd()): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(doctorUsage());
    return 0;
  }

  const json = argv.includes("--json");
  const checkHosted = argv.includes("--check-hosted");
  const positional = argv.filter((a) => !a.startsWith("--"));
  const bundleArg = positional[0]?.trim() || ".driftguard";

  let hostedPreview: { missingCount: number; discoveredCount: number } | undefined;
  if (checkHosted && readHostedApiKey()) {
    try {
      const filesJson = buildCiFilesJson(undefined, cwd);
      const files = JSON.parse(filesJson) as Array<{ path: string; content: string }>;
      const result = await coveragePreview({ files });
      const body = result.body as {
        missingCount?: number;
        discovered?: unknown[];
      };
      const discoveredCount = Array.isArray(body.discovered) ? body.discovered.length : files.length;
      hostedPreview = {
        missingCount: Number(body.missingCount ?? 0),
        discoveredCount,
      };
    } catch {
      /* optional hosted slice */
    }
  }

  const report = buildDoctorReport(cwd, bundleArg, { hostedPreview });
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatDoctorReportText(report));
  }
  return report.summary.exitCode;
}
