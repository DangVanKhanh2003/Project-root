/**
 * Centralized localStorage key registry
 *
 * ALL localStorage keys used across the app MUST be defined here.
 * This prevents key collisions, makes auditing easy, and allows
 * quick search for any storage usage.
 */

const PREFIX = 'ezconv';

export const STORAGE_KEYS = {
  /** Theme preference (light/dark) */
  THEME: `${PREFIX}-theme`,

  /** Base64-encoded license cache */
  LICENSE_TOKEN: `${PREFIX}:license_token`,

  /** Legacy license key (migration path) */
  LICENSE_KEY: `${PREFIX}:license_key`,

  /** Format/quality preferences with filename style and metadata flags */
  FORMAT_PREFERENCES: `Ezconv_format_preferences`,

  /** Whether user has clicked the Download tab in playlist view */
  PLAYLIST_TAB_CLICKED: 'hasClickedPlaylistTab',
} as const;

/**
 * Daily feature usage counter key
 * @example getDailyUsageKey('download_batch') → 'ezconv:download_batch_daily'
 */
export function getDailyUsageKey(featureKey: string): string {
  return `${PREFIX}:${featureKey}_daily`;
}
