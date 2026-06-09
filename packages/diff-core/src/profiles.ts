import type { DiffProfile } from "./types.js";

/** Explicit profiles replace implicit OSS=true / cloud=false defaults (ARCH-U01). */
export const INFER_PROFILE_DEFAULTS: Record<DiffProfile, { markAllFieldsRequired: boolean }> = {
  cli: { markAllFieldsRequired: true },
  hosted: { markAllFieldsRequired: false },
};

export function resolveMarkAllFieldsRequired(options: {
  profile?: DiffProfile;
  markAllFieldsRequired?: boolean;
}): boolean {
  if (options.markAllFieldsRequired !== undefined) return options.markAllFieldsRequired;
  const profile = options.profile ?? "hosted";
  return INFER_PROFILE_DEFAULTS[profile].markAllFieldsRequired;
}
