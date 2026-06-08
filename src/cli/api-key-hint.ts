/** Redacted export hint — never echo the full API key to stdout/logs. */
export function formatLoginExportHint(key: string): string {
  const suffix = key.length > 4 ? key.slice(-4) : "****";
  return `Export: export DRIFTGUARD_API_KEY=<your-key>  # yours ends with …${suffix}`;
}
