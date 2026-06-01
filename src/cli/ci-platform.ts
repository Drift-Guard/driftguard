/** Repo slug for console deep links — GitHub Actions or GitLab CI. */
export function ciRepo(): string | undefined {
  return (
    process.env.DRIFTGUARD_CI_REPO ??
    process.env.GITHUB_REPOSITORY ??
    process.env.CI_PROJECT_PATH ??
    undefined
  );
}

export function ciRunId(): string | undefined {
  return process.env.GITHUB_RUN_ID ?? process.env.CI_PIPELINE_ID ?? process.env.CI_JOB_ID;
}

/** GitHub Step Summary or GitLab Job Summary (16+). */
export function ciSummaryPath(): string | undefined {
  return process.env.GITHUB_STEP_SUMMARY ?? process.env.CI_JOB_SUMMARY;
}

export async function appendCiSummary(markdown: string): Promise<void> {
  const path = ciSummaryPath();
  if (path) {
    const fs = await import("node:fs/promises");
    await fs.appendFile(path, markdown + "\n");
    return;
  }
  console.error("\n" + markdown.replace(/^### /gm, "").replace(/\*\*/g, ""));
}
