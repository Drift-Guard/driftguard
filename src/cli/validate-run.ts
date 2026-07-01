import { readFileSync } from "node:fs";
import { validateAgainstProfile } from "../core/validate.js";
import { parseJsonString } from "../mcp/tool-input.js";
import type { ConsumerProfile } from "@drift-guard/diff-core";

function readFileArg(path: string, label: string): string {
  if (!path?.trim()) {
    throw new Error(`${label} path is required`);
  }
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new Error(`Could not read ${label} at ${path}`);
  }
}

function parseArgs(argv: string[]): {
  profilePath?: string;
  payloadPath?: string;
  mode: "block" | "warn";
  profileMode?: "cli" | "hosted";
} {
  let profilePath: string | undefined;
  let payloadPath: string | undefined;
  let mode: "block" | "warn" = "block";
  let profileMode: "cli" | "hosted" | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--profile") profilePath = argv[++i];
    else if (arg === "--payload") payloadPath = argv[++i];
    else if (arg === "--mode") {
      const m = argv[++i];
      if (m !== "block" && m !== "warn") throw new Error("--mode must be block or warn");
      mode = m;
    } else if (arg === "--profile-mode") {
      const p = argv[++i];
      if (p !== "cli" && p !== "hosted") throw new Error("--profile-mode must be cli or hosted");
      profileMode = p;
    }
  }
  return { profilePath, payloadPath, mode, profileMode };
}

export async function runValidate(argv: string[]): Promise<number> {
  const { profilePath, payloadPath, mode, profileMode } = parseArgs(argv);
  if (!profilePath || !payloadPath) {
    console.error("Usage: driftguard validate --profile ./profile.json --payload ./event.json [--mode block|warn] [--profile-mode cli|hosted]");
    return 1;
  }

  const profileParsed = parseJsonString(readFileArg(profilePath, "profile"), "profile JSON");
  if (!profileParsed.ok) {
    console.error(profileParsed.error);
    return 1;
  }
  const payloadParsed = parseJsonString(readFileArg(payloadPath, "payload"), "payload JSON");
  if (!payloadParsed.ok) {
    console.error(payloadParsed.error);
    return 1;
  }

  const result = validateAgainstProfile(
    payloadParsed.value,
    profileParsed.value as ConsumerProfile,
    { mode, profileMode },
  );
  console.log(JSON.stringify(result, null, 2));

  if (result.ok) return 0;
  if (mode === "warn") return 0;
  return 1;
}
