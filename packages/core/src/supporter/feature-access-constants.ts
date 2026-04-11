/**
 * Feature Access Constants
 * Defines feature keys and geo-restriction rules for the evaluateFeatureAccess system.
 * Shared across all downloader apps.
 */

export const FEATURE_KEYS = {
    BATCH_DOWNLOAD: 'download_multi',
    PLAYLIST_DOWNLOAD: 'download_playlist',
    CHANNEL_DOWNLOAD: 'download_channel',
    HIGH_QUALITY_4K: 'download_4k',
    HIGH_QUALITY_2K: 'download_2k',
    HIGH_QUALITY_320K: 'download_320kbps',
    CUT_VIDEO_YOUTUBE: 'cut_video_youtube',
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
 * NOTE: download_4k, download_320kbps, download_multi are NOT geo-restricted.
 */
export const GEO_RESTRICTED_FEATURES: ReadonlySet<string> = new Set([
    FEATURE_KEYS.PLAYLIST_DOWNLOAD,
    FEATURE_KEYS.CHANNEL_DOWNLOAD,
]);

/**
 * Shared reasons for feature access limits/checks across apps
 */
export const FEATURE_ACCESS_REASONS = {
    ALLOWED: 'allowed',
    NOT_ALLOWED: 'not_allowed',
    GEO_RESTRICTED: 'geo_restricted',
    LIMIT_REACHED: 'limit_reached',
    VIDEO_LIMIT_EXCEEDED: 'video_limit_exceeded',
    API_UNAVAILABLE: 'api_unavailable',
    DAILY_LIMIT_REACHED: 'daily_limit_reached',
    LICENSE_FOUND: 'license',
} as const;

export type FeatureAccessReason = typeof FEATURE_ACCESS_REASONS[keyof typeof FEATURE_ACCESS_REASONS];
