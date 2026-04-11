/**
 * Centralized localStorage key registry
 *
 * ALL localStorage keys used across the app MUST be defined here.
 * This prevents key collisions, makes auditing easy, and allows
 * quick search for any storage usage.
 */

// ============================================================
// PREFIX — keeps keys namespaced per app
// ============================================================

const PREFIX = 'real-y2mate';

// ============================================================
// STORAGE KEYS
// ============================================================

export const STORAGE_KEYS = {
  /** User's selected format/quality preferences (JSON) */
  FORMAT_PREFERENCES: `${PREFIX}_format_preferences`,

  /** Geo-restricted features cache with 7-day TTL (JSON) */
  ALLOWED_FEATURES: `${PREFIX}_allowed_features`,

  /** Raw license key string for background revalidation */
  LICENSE_KEY: `${PREFIX}:license_key`,

  /** Encoded license cache with integrity hash */
  LICENSE_CACHE: `${PREFIX}:license_cache`,

  /** Total download count for widget level tracking */
  DOWNLOAD_COUNT: `${PREFIX}_download_count`,

  /** Whether user has clicked the Download tab in playlist view */
  PLAYLIST_TAB_CLICKED: 'hasClickedPlaylistTab',

  /** Whether user has seen the convert-button hand guide */
  PLAYLIST_CONVERT_GUIDE_SHOWN: 'hasShownPlaylistConvertGuide',
} as const;

// ============================================================
// DYNAMIC KEY BUILDERS — for keys that include a variable part
// ============================================================

/**
 * Daily feature-start usage counter key
 * @example getStartUsageKey('download_4k') → 'download_4k_daily'
 */
export function getStartUsageKey(featureKey: string): string {
  return `${featureKey}_daily`;
}

/**
 * Daily feature-item usage counter key
 * @example getItemUsageKey('download_4k') → 'download_4k_items_daily'
 */
export function getItemUsageKey(featureKey: string): string {
  return `${featureKey}_items_daily`;
}
