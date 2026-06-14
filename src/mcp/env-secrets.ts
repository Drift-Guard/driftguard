/** Hosted API key from process env — not a hardcoded credential (Sonar S2068). */

export function readHostedApiKey(env: { DRIFTGUARD_API_KEY?: string } = process.env): string | undefined {
  const key = env.DRIFTGUARD_API_KEY?.trim(); // NOSONAR S2068 — runtime env binding
  return key || undefined;
}
