import { diffOpenApiSpecs, normalizeOpenApiSpec, buildOpenApiChangelog } from "../core/openapi.js";
import { enrichChangesWithAgentActions } from "../core/agent-action.js";
import { loadOpenApiSpecFile } from "./openapi-load.js";

export function parseOpenApiDiffArgs(argv: string[]): {
  basePath: string;
  targetPath: string;
  json: boolean;
  failOnBreaking: boolean;
} {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const paths = argv.filter((a) => !a.startsWith("--"));
  const [basePath, targetPath] = paths;
  if (!basePath || !targetPath) {
    throw new Error("Usage: driftguard openapi-diff <base-spec> <target-spec> [--json] [--fail-on-breaking]");
  }
  return {
    basePath,
    targetPath,
    json: flags.has("--json"),
    failOnBreaking: flags.has("--fail-on-breaking"),
  };
}

export function runOpenApiDiff(argv: string[]): number {
  let opts;
  try {
    opts = parseOpenApiDiffArgs(argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 2;
  }

  try {
    const before = normalizeOpenApiSpec(loadOpenApiSpecFile(opts.basePath));
    const after = normalizeOpenApiSpec(loadOpenApiSpecFile(opts.targetPath));
    const diff = diffOpenApiSpecs(before, after);
    const changelog = buildOpenApiChangelog(diff, {
      base: opts.basePath,
      target: opts.targetPath,
    });
    const payload = {
      ...diff,
      changes: enrichChangesWithAgentActions(diff.changes),
      changelog,
    };

    if (opts.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(changelog.markdown);
      if (diff.breakingCount > 0) {
        console.error("");
        console.error(`Breaking changes: ${diff.breakingCount}`);
        for (const change of diff.changes.filter((c) => c.severity === "breaking")) {
          console.error(`- ${change.message}`);
        }
      }
    }

    if (opts.failOnBreaking && diff.breakingCount > 0) return 1;
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : "OpenAPI diff failed");
    return 2;
  }
}
