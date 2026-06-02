import { diffOpenApiSpecs, normalizeOpenApiSpec, buildOpenApiChangelog } from "../core/openapi.js";
import { loadOpenApiSpecFile } from "./openapi-load.js";

export function parseOpenApiChangelogArgs(argv: string[]): {
  basePath: string;
  targetPath: string;
  format: "markdown" | "json";
} {
  const formatFlag = argv.find((a) => a.startsWith("--format="));
  const format = formatFlag?.split("=")[1] === "json" ? "json" : "markdown";
  const paths = argv.filter((a) => !a.startsWith("--"));
  const [basePath, targetPath] = paths;
  if (!basePath || !targetPath) {
    throw new Error(
      "Usage: driftguard openapi-changelog <base-spec> <target-spec> [--format markdown|json]",
    );
  }
  return { basePath, targetPath, format };
}

export function runOpenApiChangelog(argv: string[]): number {
  let opts;
  try {
    opts = parseOpenApiChangelogArgs(argv);
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

    if (opts.format === "json") {
      console.log(JSON.stringify(changelog, null, 2));
    } else {
      console.log(changelog.markdown);
    }
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : "OpenAPI changelog failed");
    return 2;
  }
}
