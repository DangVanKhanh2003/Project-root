/**
 * Feature Access Constants
 * Defines feature keys and geo-restriction rules for the evaluateFeatureAccess system.
 */

export const FEATURE_KEYS = {
    BATCH_DOWNLOAD: 'download_multi',
    PLAYLIST_DOWNLOAD: 'download_playlist',
    CHANNEL_DOWNLOAD: 'download_channel',
} as const;

export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS];

/**
 * Aliases for legacy or misspelled feature keys returned by the API.
 */
export const FEATURE_KEY_ALIASES: Readonly<Record<string, string>> = {
    download_chanel: FEATURE_KEYS.CHANNEL_DOWNLOAD,
};

/**
 * Features that require geo-restriction check via API before local limit check.
 * NOTE: download_multi (batch), trim, single are NOT geo-restricted.
 */
export const GEO_RESTRICTED_FEATURES: ReadonlySet<string> = new Set([
    FEATURE_KEYS.PLAYLIST_DOWNLOAD,
    FEATURE_KEYS.CHANNEL_DOWNLOAD,
]);
