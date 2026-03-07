/**
 * Feature Access Orchestrator — ytmp4.gg
 * 3-layer check: License → Geo (API) → Daily Limit
 *
 * Ported from: ytmp3.gg/src/temp/allowed-features.js
 */

import { supporterService } from '../api';
import { hasLicenseKey, checkLimit } from './download-limit';
import {
    FEATURE_KEY_ALIASES,
    FEATURE_ACCESS_REASONS,
    type FeatureAccessReason,
} from '@downloader/core';

// ============================================================
// CONFIGURATION
// ============================================================

const API_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ALLOWED_FEATURES_MAX_ATTEMPTS = 2;

/**
 * ytmp4.gg geo-restricted features.
 * NOTE: Defined locally — do NOT import GEO_RESTRICTED_FEATURES from @downloader/core.
 * ytmp4.gg includes download_multi (ezconv does NOT).
 */
const GEO_RESTRICTED_FEATURES = new Set([
    'download_playlist',
    'download_multi',    // ← ytmp4.gg specific
    'download_channel',
]);

// ============================================================
// CACHE STATE
// ============================================================

interface AllowedState {
    country: string;
    allowedFeatures: Set<string>;
}

let cachedApiResult: AllowedState | null = null;
let cachedApiTimestamp = 0;
let inflightApiPromise: Promise<AllowedState> | null = null;

// ============================================================
// INTERNAL HELPERS
// ============================================================

function normalizeFeature(feature: string): string {
    return (FEATURE_KEY_ALIASES as Record<string, string>)[feature] ?? feature;
}

async function fetchAllowedFeatures(): Promise<AllowedState> {
    const now = Date.now();
    if (cachedApiResult && now - cachedApiTimestamp < API_CACHE_TTL_MS) {
        return cachedApiResult;
    }

    if (inflightApiPromise) {
        return inflightApiPromise;
    }

    inflightApiPromise = (async () => {
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= ALLOWED_FEATURES_MAX_ATTEMPTS; attempt++) {
            try {
                // fetchAllowedFeatures() returns AllowedFeaturesResponse directly
                const response = await supporterService.fetchAllowedFeatures();

                const normalizedFeatures = new Set<string>(
                    Array.isArray(response?.allowed_features)
                        ? response.allowed_features.map((f) => normalizeFeature(String(f)))
                        : []
                );

                const allowedState: AllowedState = {
                    country: typeof response?.country === 'string' ? response.country : '',
                    allowedFeatures: normalizedFeatures,
                };

                cachedApiResult = allowedState;
                cachedApiTimestamp = Date.now();
                return allowedState;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError ?? new Error('allowed-features request failed');
    })().finally(() => {
        inflightApiPromise = null;
    });

    return inflightApiPromise;
}

// ============================================================
// PUBLIC API
// ============================================================

export type { FeatureAccessReason };

export interface FeatureAccessResult {
    allowed: boolean;
    reason: FeatureAccessReason;
    country?: string;
}

/**
 * Full 3-layer access check.
 * Layer 1: License key bypass
 * Layer 2: Geo / API allowlist
 * Layer 3: Daily limit
 */
export async function evaluateFeatureAccess(feature: string): Promise<FeatureAccessResult> {
    const normalizedFeature = normalizeFeature(feature);

    // Layer 1: License key holders bypass everything
    if (hasLicenseKey()) {
        return { allowed: true, reason: FEATURE_ACCESS_REASONS.ALLOWED };
    }

    // Layer 2: Geo check (only for geo-restricted features)
    if (GEO_RESTRICTED_FEATURES.has(normalizedFeature)) {
        try {
            const apiState = await fetchAllowedFeatures();
            if (!apiState.allowedFeatures.has(normalizedFeature)) {
                return {
                    allowed: false,
                    reason: FEATURE_ACCESS_REASONS.GEO_RESTRICTED,
                    country: apiState.country,
                };
            }
        } catch (error) {
            console.warn('[allowed-features] API unavailable after retry, showing supporter upsell:', error);
            return { allowed: false, reason: FEATURE_ACCESS_REASONS.API_UNAVAILABLE };
        }
    }

    // Layer 3: Daily limit
    const localResult = checkLimit(normalizedFeature);
    if (!localResult.allowed) {
        return { allowed: false, reason: FEATURE_ACCESS_REASONS.LIMIT_REACHED };
    }

    return { allowed: true, reason: FEATURE_ACCESS_REASONS.ALLOWED };
}

/**
 * Returns true if the feature is allowed.
 */
export async function isFeatureAllowed(feature: string): Promise<boolean> {
    const result = await evaluateFeatureAccess(feature);
    return result.allowed;
}

/**
 * Returns true if ANY of the given features is allowed.
 */
export async function isAnyFeatureAllowed(features: string[]): Promise<boolean> {
    if (!Array.isArray(features) || features.length === 0) return false;

    for (const feature of features) {
        const result = await evaluateFeatureAccess(feature);
        if (result.allowed) return true;
    }

    return false;
}
