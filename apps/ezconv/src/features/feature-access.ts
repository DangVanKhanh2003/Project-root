/**
 * Feature Access — Wrapper Layer (Approach A)
 *
 * Single entry point for checking whether a feature is allowed.
 * Evaluates in order:
 *   1. Supporter bypass (license key)
 *   2. Geo-restriction API (cached, only for GEO_RESTRICTED_FEATURES)
 *   3. Local offline limit (checkLimit)
 *
 * API calls are delegated to src/api/allowed-features.ts (API layer).
 * This module handles caching, retry, and orchestration only.
 *
 * Reference: ytmp3.gg allowed-features.js
 */

import { hasStoredLicenseKey } from './license-selector';
import { checkLimit, type LimitCheckContext, type LimitCheckResult, type LimitType, type LimitedDailyMode } from './download-limit';
import { fetchAllowedFeaturesApi } from '../api/allowed-features';
import {
    GEO_RESTRICTED_FEATURES,
    FEATURE_KEY_ALIASES,
} from '../constants/feature-access-constants';

// ============================================================
// TYPES
// ============================================================

export type FeatureAccessReason =
    | 'allowed'
    | 'not_allowed'
    | 'api_unavailable'
    | 'limit_reached'
    | 'video_limit_exceeded';

export interface FeatureAccessResult {
    allowed: boolean;
    reason: FeatureAccessReason;
    /** Carried from LimitCheckResult when reason is limit-related */
    limitType?: LimitType | null;
    limitMode?: LimitedDailyMode | null;
    limit?: number | null;
    currentCount?: number | null;
    resetAt?: number | null;
    remainingSeconds?: number | null;
}

// ============================================================
// CACHE STATE
// ============================================================

const API_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FETCH_ATTEMPTS = 2;

interface AllowedFeaturesState {
    country: string;
    allowedFeatures: Set<string>;
}

let cachedApiResult: AllowedFeaturesState | null = null;
let cachedApiTimestamp = 0;
let inflightApiPromise: Promise<AllowedFeaturesState> | null = null;

// ============================================================
// HELPERS
// ============================================================

function normalizeFeature(feature: string): string {
    return FEATURE_KEY_ALIASES[feature] || feature;
}

// ============================================================
// GEO API FETCH (CACHE + DEDUP + RETRY)
// ============================================================

/**
 * Fetch allowed features with caching, retry, and inflight deduplication.
 * Delegates the actual HTTP call to the API layer (allowed-features.ts).
 */
async function fetchAllowedFeatures(): Promise<AllowedFeaturesState> {
    const now = Date.now();

    // Return cached result if still valid
    if (cachedApiResult && now - cachedApiTimestamp < API_CACHE_TTL_MS) {
        return cachedApiResult;
    }

    // Deduplicate concurrent calls
    if (inflightApiPromise) {
        return inflightApiPromise;
    }

    inflightApiPromise = (async () => {
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
            try {
                const data = await fetchAllowedFeaturesApi();

                const normalizedFeatures = new Set<string>(
                    data.allowed_features.map((f) => normalizeFeature(f))
                );

                const allowedState: AllowedFeaturesState = {
                    country: data.country,
                    allowedFeatures: normalizedFeatures,
                };

                cachedApiResult = allowedState;
                cachedApiTimestamp = Date.now();
                return allowedState;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error('allowed-features request failed');
    })().finally(() => {
        inflightApiPromise = null;
    });

    return inflightApiPromise;
}

// ============================================================
// MAP LimitCheckResult → FeatureAccessResult
// ============================================================

function mapLimitResult(limitResult: LimitCheckResult): FeatureAccessResult {
    if (limitResult.allowed) {
        return { allowed: true, reason: 'allowed' };
    }

    return {
        allowed: false,
        reason: limitResult.type === 'bulk_video_count' ? 'video_limit_exceeded' : 'limit_reached',
        limitType: limitResult.type,
        limitMode: limitResult.mode,
        limit: limitResult.limit,
        currentCount: limitResult.currentCount,
        resetAt: limitResult.resetAt,
        remainingSeconds: limitResult.remainingSeconds,
    };
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Evaluate feature access with 2 layers:
 *   Layer 1: Country/API allow-list (only for GEO_RESTRICTED_FEATURES)
 *   Layer 2: Existing local limit check
 *
 * @param kind - The download mode kind (e.g. 'playlist', 'channel')
 * @param context - Optional extra context for checkLimit (e.g. itemCount for batch)
 */
export async function evaluateFeatureAccess(
    featureKey: string,
    limitContext: LimitCheckContext
): Promise<FeatureAccessResult> {
    const normalizedFeature = normalizeFeature(featureKey);

    // 1. Supporter bypass
    if (hasStoredLicenseKey()) {
        return { allowed: true, reason: 'allowed' };
    }

    // 2. Geo-restriction check (only for features in GEO_RESTRICTED_FEATURES)
    if (GEO_RESTRICTED_FEATURES.has(normalizedFeature)) {
        try {
            const apiState = await fetchAllowedFeatures();
            if (!apiState.allowedFeatures.has(normalizedFeature)) {
                return {
                    allowed: false,
                    reason: 'not_allowed',
                };
            }
        } catch (error) {
            console.warn('[feature-access] API unavailable after retry:', error);
            return {
                allowed: false,
                reason: 'api_unavailable',
            };
        }
    }

    // 3. Local offline limit check
    const limitResult = await checkLimit(limitContext);
    return mapLimitResult(limitResult);
}

/**
 * Check if a feature is allowed (boolean sugar).
 */
export async function isFeatureAllowed(
    featureKey: string,
    limitContext: LimitCheckContext
): Promise<boolean> {
    const result = await evaluateFeatureAccess(featureKey, limitContext);
    return result.allowed;
}
