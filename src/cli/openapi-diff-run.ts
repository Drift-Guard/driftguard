import { diffOpenApiSpecs, normalizeOpenApiSpec, buildOpenApiChangelog } from "../core/openapi.js";
import { enrichChangesWithAgentActions } from "../core/agent-action.js";
import { loadOpenApiSpecFile } from "./openapi-load.js";

export function parseOpenApiDiffArgs(argv: string[]): {
  basePath: string;
  targetPath: string;
  json: boolean;
  failOnBreaking: boolean;
  remote: boolean;
} {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const paths = argv.filter((a) => !a.startsWith("--"));
  const [basePath, targetPath] = paths;
  if (!basePath || !targetPath) {
    throw new Error(
      "Usage: driftguard openapi-diff <base-spec> <target-spec> [--json] [--fail-on-breaking] [--remote]",
    );
  }
  return {
    basePath,
    targetPath,
    json: flags.has("--json"),
    failOnBreaking: flags.has("--fail-on-breaking"),
    remote: flags.has("--remote"),
  };
}

const HOSTED_API = process.env.DRIFTGUARD_API_URL || "https://driftguard.org";

async function postRemoteCompare(
  before: unknown,
  after: unknown,
  labels: { base: string; target: string },
): Promise<{ runId: string; url: string }> {
  const key = process.env.DRIFTGUARD_API_KEY;
  if (!key) throw new Error("--remote requires DRIFTGUARD_API_KEY");
  const res = await fetch(`${HOSTED_API}/api/openapi/diff/remote`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      before,
      after,
      baseLabel: labels.base,
      targetLabel: labels.target,
      source: "cli",
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return { runId: body.runId, url: body.url };
}

export async function runOpenApiDiff(argv: string[]): Promise<number> {
  let opts;
  try {
    opts = parseOpenApiDiffArgs(argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 2;
  }

  try {
    const beforeRaw = loadOpenApiSpecFile(opts.basePath);
    const afterRaw = loadOpenApiSpecFile(opts.targetPath);
    const before = normalizeOpenApiSpec(beforeRaw);
    const after = normalizeOpenApiSpec(afterRaw);

    if (opts.remote) {
      const remote = await postRemoteCompare(beforeRaw, afterRaw, {
        base: opts.basePath,
        target: opts.targetPath,
      });
      console.log(`Saved compare run ${remote.runId}`);
      console.log(remote.url);
    }

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
