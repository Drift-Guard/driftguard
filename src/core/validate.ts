/**
 * OSS adapter — defaults profileMode to cli (ARCH-U01).
 * Canonical logic lives in @driftguard/diff-core.
 */
import {
  validateAgainstProfile as coreValidateAgainstProfile,
  type ConsumerProfile,
  type ValidateOptions,
  type ValidateResult,
} from "@driftguard/diff-core";

export type { ConsumerProfile, ValidateError, ValidateOptions, ValidateResult } from "@driftguard/diff-core";

const DEFAULT_EXPLAIN_URL = "https://developers.driftguard.org/api/explain-drift";

export function validateAgainstProfile(
  payload: unknown,
  profile: ConsumerProfile,
  options: ValidateOptions = {},
): ValidateResult {
  return coreValidateAgainstProfile(payload, profile, {
    profileMode: "cli",
    explainUrl: DEFAULT_EXPLAIN_URL,
    ...options,
  });
}
