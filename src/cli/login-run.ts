#!/usr/bin/env node
/** OSS — verify API key against hosted /api/me */
const API = process.env.DRIFTGUARD_API_URL || "https://driftguard.org";

export async function runLogin(argv: string[]): Promise<number> {
  const keyFlag = argv.find((a) => a.startsWith("--api-key="));
  const key = keyFlag?.split("=")[1] || process.env.DRIFTGUARD_API_KEY;
  if (!key) {
    console.error("Usage: driftguard login --api-key dg_…");
    return 2;
  }
  try {
    const res = await fetch(`${API}/api/me`, {
      headers: { authorization: `Bearer ${key}` },
    });
    const body = await res.json();
    if (!res.ok) {
      console.error(body.error || `HTTP ${res.status}`);
      return 1;
    }
    console.log(`Authenticated as ${body.email || body.customerId || "customer"} (${body.plan || "pro"})`);
    console.log(`Export: export DRIFTGUARD_API_KEY=${key}`);
    return 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 2;
  }
}
