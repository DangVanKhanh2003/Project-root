/**
 * Feature Limit Policy — ezconv
 * Single source of truth for all numeric limits.
 * Change values here to adjust quotas site-wide.
 */

import { FEATURE_KEYS } from '@downloader/core';

// ============================================================
// CONFIGURABLE CONSTANTS — change here to adjust free quotas
// ============================================================

/** Default maximum starts per day for non-license users. */
export const DEFAULT_START_PER_DAY = 1;

// Daily limits by download mode
export const DAILY_BULK_DOWNLOAD_LIMIT = 50;
export const DAILY_PLAYLIST_DOWNLOAD_LIMIT = 50;
export const DAILY_CHANNEL_DOWNLOAD_LIMIT = 50;
export const DAILY_TRIM_DOWNLOAD_LIMIT = 20;
export const DAILY_HIGH_QUALITY_4K_LIMIT = 50;
export const DAILY_HIGH_QUALITY_2K_LIMIT = 50;
export const DAILY_HIGH_QUALITY_320K_LIMIT = 50;

// Bulk download — max videos per single paste
export const BULK_DOWNLOAD_LIMIT = 10;

// 2-tier item quotas (country-allowed vs fallback)
export const PLAYLIST_MAX_ITEMS_PER_DAY_ALLOWED = 100;
export const PLAYLIST_MAX_ITEMS_PER_DAY_FALLBACK = 50;
export const CHANNEL_MAX_ITEMS_PER_DAY_ALLOWED = 100;
export const CHANNEL_MAX_ITEMS_PER_DAY_FALLBACK = 50;

// ============================================================
// POLICY MAP
// ============================================================

interface TierPair { allowed: number; fallback: number; }
interface FeaturePolicy { startPerDay: number; itemsPerDay: TierPair; }

const FEATURE_LIMIT_POLICY: Readonly<Record<string, FeaturePolicy>> = {
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: {
        startPerDay: DAILY_PLAYLIST_DOWNLOAD_LIMIT,
        itemsPerDay: { allowed: PLAYLIST_MAX_ITEMS_PER_DAY_ALLOWED, fallback: PLAYLIST_MAX_ITEMS_PER_DAY_FALLBACK },
    },
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: {
        startPerDay: DAILY_CHANNEL_DOWNLOAD_LIMIT,
        itemsPerDay: { allowed: CHANNEL_MAX_ITEMS_PER_DAY_ALLOWED, fallback: CHANNEL_MAX_ITEMS_PER_DAY_FALLBACK },
    },
};

// ============================================================
// PUBLIC API
// ============================================================

export function getFeatureLimitPolicy(featureKey: string): FeaturePolicy | null {
    return FEATURE_LIMIT_POLICY[featureKey] ?? null;
}

export interface ResolvedLimits {
    startPerDay: number | null;
    maxItemsPerDay: number | null;
}

export function resolveFeatureLimits(
    featureKey: string,
    options: { countryAllowed?: boolean; isLicense?: boolean } = {}
): ResolvedLimits {
    const { countryAllowed = false, isLicense = false } = options;
    const policy = FEATURE_LIMIT_POLICY[featureKey];

    if (!policy) return { startPerDay: null, maxItemsPerDay: null };
    if (isLicense) return { startPerDay: null, maxItemsPerDay: null };

    const tierKey = countryAllowed ? 'allowed' : 'fallback';
    return {
        startPerDay: policy.startPerDay,
        maxItemsPerDay: policy.itemsPerDay[tierKey],
    };
}
