/**
 * Centralized localStorage key registry
 *
 * ALL localStorage keys used across the app MUST be defined here.
 * This prevents key collisions, makes auditing easy, and allows
 * quick search for any storage usage.
 */

const PREFIX = 'y2mate';

export const STORAGE_KEYS = {
  /** User's selected format/quality preferences (JSON) */
  FORMAT_PREFERENCES: `${PREFIX}_format_preferences`,

  /** Auto-submit checkbox state */
  AUTO_SUBMIT: `${PREFIX}_auto_submit`,

  /** Allowed features + country cache (JSON, from geo API) */
  ALLOWED_FEATURES: `${PREFIX}_allowed_features`,
} as const;
