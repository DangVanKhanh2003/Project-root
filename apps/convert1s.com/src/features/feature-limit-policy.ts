/**
 * Feature Limit Policy — convert1s.com
 * Single source of truth for all numeric limits.
 * Change values here to adjust quotas site-wide.
 *
 * Ported from: ytmp3.gg/src/script/constants/feature-limit-policy.js
 */

import { FEATURE_KEYS } from '@downloader/core';

// ============================================================
// CONFIGURABLE CONSTANTS — change here to adjust free quotas
// ============================================================

/** Default maximum starts per day for non-license users. */
export const DEFAULT_START_PER_DAY = 5;

// Multiple download limits
export const MULTIPLE_MAX_ITEMS_ALLOWED = 10;
export const MULTIPLE_MAX_ITEMS_FALLBACK = 5;
export const MULTIPLE_START_PER_DAY = DEFAULT_START_PER_DAY;

// Playlist limits
export const PLAYLIST_MAX_ITEMS_ALLOWED = 30;
export const PLAYLIST_MAX_ITEMS_FALLBACK = 15;
export const PLAYLIST_START_PER_DAY = DEFAULT_START_PER_DAY;

// Channel limits
export const CHANNEL_MAX_ITEMS_ALLOWED = 30;
export const CHANNEL_MAX_ITEMS_FALLBACK = 15;
export const CHANNEL_START_PER_DAY = DEFAULT_START_PER_DAY;

// High quality / cut limits (start-per-day only, no item tiers)
export const HIGH_QUALITY_4K_START_PER_DAY = 20;
export const HIGH_QUALITY_2K_START_PER_DAY = 20;
export const HIGH_QUALITY_320K_START_PER_DAY = 20;
export const CUT_VIDEO_START_PER_DAY = 200;

// ============================================================
// POLICY MAP
// ============================================================

export interface ResolvedLimits {
    startPerDay: number | null;
    maxItemsPerConvert: number | null;
    maxItemsPerDay: number | null;
}

interface TierPair {
    allowed: number;
    fallback: number;
}

interface FeaturePolicy {
    startPerDay: number;
    itemsPerConvert?: TierPair;
    itemsPerDay?: TierPair;
}

const FEATURE_LIMIT_POLICY: Readonly<Record<string, FeaturePolicy>> = {
    [FEATURE_KEYS.BATCH_DOWNLOAD]: {
        startPerDay: MULTIPLE_START_PER_DAY,
        itemsPerConvert: {
            allowed: MULTIPLE_MAX_ITEMS_ALLOWED,
            fallback: MULTIPLE_MAX_ITEMS_FALLBACK,
        },
    },
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: {
        startPerDay: PLAYLIST_START_PER_DAY,
        itemsPerConvert: {
            allowed: PLAYLIST_MAX_ITEMS_ALLOWED,
            fallback: PLAYLIST_MAX_ITEMS_FALLBACK,
        },
    },
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: {
        startPerDay: CHANNEL_START_PER_DAY,
        itemsPerConvert: {
            allowed: CHANNEL_MAX_ITEMS_ALLOWED,
            fallback: CHANNEL_MAX_ITEMS_FALLBACK,
        },
    },
    [FEATURE_KEYS.HIGH_QUALITY_4K]: {
        startPerDay: HIGH_QUALITY_4K_START_PER_DAY,
    },
    [FEATURE_KEYS.HIGH_QUALITY_2K]: {
        startPerDay: HIGH_QUALITY_2K_START_PER_DAY,
    },
    [FEATURE_KEYS.HIGH_QUALITY_320K]: {
        startPerDay: HIGH_QUALITY_320K_START_PER_DAY,
    },
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: {
        startPerDay: CUT_VIDEO_START_PER_DAY,
    },
};

// ============================================================
// PUBLIC API
// ============================================================

export function getFeatureLimitPolicy(featureKey: string): FeaturePolicy | null {
    return FEATURE_LIMIT_POLICY[featureKey] ?? null;
}

/**
 * Resolve concrete limits for a feature based on country tier and license.
 *
 * @param featureKey - e.g. 'download_multi', 'download_playlist'
 * @param options.countryAllowed - true if the country API says the feature is allowed
 * @param options.isLicense - true if user has a valid license key
 * @returns ResolvedLimits — all fields null means no limit (license holder)
 */
export function resolveFeatureLimits(
    featureKey: string,
    options: { countryAllowed?: boolean; isLicense?: boolean } = {},
): ResolvedLimits {
    const { countryAllowed = false, isLicense = false } = options;
    const policy = getFeatureLimitPolicy(featureKey);

    // No policy for this feature — no limits
    if (!policy) {
        return { startPerDay: null, maxItemsPerConvert: null, maxItemsPerDay: null };
    }

    // License holders bypass all limits
    if (isLicense) {
        return { startPerDay: null, maxItemsPerConvert: null, maxItemsPerDay: null };
    }

    const tierKey: 'allowed' | 'fallback' = countryAllowed ? 'allowed' : 'fallback';

    const maxItemsPerConvert = policy.itemsPerConvert
        ? policy.itemsPerConvert[tierKey]
        : null;

    const maxItemsPerDay = policy.itemsPerDay
        ? policy.itemsPerDay[tierKey]
        : null;

    return {
        startPerDay: policy.startPerDay ?? DEFAULT_START_PER_DAY,
        maxItemsPerConvert: typeof maxItemsPerConvert === 'number' ? maxItemsPerConvert : null,
        maxItemsPerDay: typeof maxItemsPerDay === 'number' ? maxItemsPerDay : null,
    };
}
