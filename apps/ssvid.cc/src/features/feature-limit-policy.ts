/**
 * Feature Limit Policy — ssvid.cc
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
export const DEFAULT_START_PER_DAY = 1;

// High quality / cut limits (start-per-day)
export const HIGH_QUALITY_4K_START_PER_DAY = 1000;
export const HIGH_QUALITY_2K_START_PER_DAY = 1000;
export const HIGH_QUALITY_320K_START_PER_DAY = 1000;
export const CUT_VIDEO_START_PER_DAY = 20;

// Multiple download limits
export const MULTIPLE_MAX_ITEMS_ALLOWED = 100;
export const MULTIPLE_START_PER_DAY = 20;

// Playlist limits
export const PLAYLIST_START_PER_DAY = 20;

// ============================================================
// POLICY MAP
// ============================================================

interface FeaturePolicy {
    startPerDay: number;
}

const FEATURE_LIMIT_POLICY: Readonly<Record<string, FeaturePolicy>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: {
        startPerDay: HIGH_QUALITY_4K_START_PER_DAY,
    },
    [FEATURE_KEYS.HIGH_QUALITY_2K]: {
        startPerDay: HIGH_QUALITY_2K_START_PER_DAY,
    },
    [FEATURE_KEYS.HIGH_QUALITY_320K]: {
        startPerDay: HIGH_QUALITY_320K_START_PER_DAY,
    },
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: {
        startPerDay: PLAYLIST_START_PER_DAY,
    },
    [FEATURE_KEYS.BATCH_DOWNLOAD]: {
        startPerDay: MULTIPLE_START_PER_DAY,
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
