export const AI_ATTRIBUTION_MAX_LENGTH = 200;

/** null means human-written; a string names the AI source of the text. */
export type AiAttribution = string | null;

/**
 * Normalize an attribution value from untrusted input (API bodies, form
 * state). null clears attribution, strings are trimmed and capped, anything
 * else returns undefined so callers can treat the field as "not provided".
 */
export function normalizeAiAttribution(
  value: unknown,
  maxLength = AI_ATTRIBUTION_MAX_LENGTH,
): AiAttribution | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const attribution = value.trim();

  return attribution.length > 0 ? attribution.slice(0, maxLength) : null;
}
