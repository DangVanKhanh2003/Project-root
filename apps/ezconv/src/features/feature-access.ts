/**
 * Feature Access — 2-layer evaluation (ytmp3.gg model)
 *
 * Layer 1: Country/API check → determines quota tier (allowed vs fallback)
 *          NEVER hard-blocks. If API fails → fallback tier.
 * Layer 2: Local daily start limit check
 *
 * Returns resolved limits so callers can enforce item quotas at convert time.
 */

import { hasValidLicense } from './license-token';
import { checkStartLimit, resolveFeatureLimits, type ResolvedLimits } from './download-limit';
import { supporterService } from '../api';
import {
    GEO_RESTRICTED_FEATURES,
    FEATURE_KEY_ALIASES,
    FEATURE_ACCESS_REASONS,
    type FeatureAccessReason,
} from '@downloader/core';

// ============================================================
// TYPES
// ============================================================

export type { FeatureAccessReason };

export interface FeatureAccessResult {
    allowed: boolean;
    reason: FeatureAccessReason;
    countryAllowed: boolean;
    source: 'license' | 'api' | 'fallback' | 'unrestricted';
    country?: string;
    limitsResolved: ResolvedLimits;
}

// ============================================================
// CACHE STATE
// ============================================================

const API_CACHE_TTL_MS = 5 * 60 * 1000;
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
// GEO API FETCH
// ============================================================

async function fetchAllowedFeatures(): Promise<AllowedFeaturesState> {
    const now = Date.now();

    if (cachedApiResult && now - cachedApiTimestamp < API_CACHE_TTL_MS) {
        return cachedApiResult;
    }

    if (inflightApiPromise) {
        return inflightApiPromise;
    }

    inflightApiPromise = (async () => {
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
            try {
                const data = await supporterService.fetchAllowedFeatures();

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
// COUNTRY CONTEXT — determines tier, never hard-blocks
// ============================================================

interface CountryContext {
    countryAllowed: boolean;
    source: 'api' | 'fallback' | 'unrestricted';
    country: string;
}

async function resolveCountryContext(normalizedFeature: string): Promise<CountryContext> {
    if (!GEO_RESTRICTED_FEATURES.has(normalizedFeature)) {
        return { countryAllowed: true, source: 'unrestricted', country: '' };
    }

    try {
        const apiState = await fetchAllowedFeatures();
        return {
            countryAllowed: apiState.allowedFeatures.has(normalizedFeature),
            source: 'api',
            country: apiState.country,
        };
    } catch (error) {
        console.warn('[feature-access] API unavailable, using fallback limits:', error);
        return { countryAllowed: false, source: 'fallback', country: '' };
    }
}

// ============================================================
// COUNTRY CACHE ACCESS (for priority-extract-router)
// ============================================================

/**
 * Get cached country code from in-memory API cache.
 * Returns null if cache is missing or expired.
 * Does NOT trigger API call — purely reads from memory.
 */
export function getCachedCountry(): string | null {
    if (!cachedApiResult) return null;
    if (Date.now() - cachedApiTimestamp > API_CACHE_TTL_MS) return null;
    return cachedApiResult.country || null;
}

/**
 * Pre-warm the allowed-features cache (country + features).
 * Call this on page load so country data is available for routing decisions.
 * Non-blocking — fires in background, does not throw.
 */
export function initAllowedFeatures(): void {
    fetchAllowedFeatures().catch(() => {
        // Silently ignore — fallback tier will be used
    });
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Evaluate feature access:
 *   1. License → bypass all
 *   2. Country check → pick tier (allowed or fallback)
 *   3. Start limit check → allowed startPerDay times per day
 *
 * Returns limitsResolved so caller can enforce item quotas at download time.
 */
export async function evaluateFeatureAccess(featureKey: string): Promise<FeatureAccessResult> {
    const normalizedFeature = normalizeFeature(featureKey);

    // 1. License bypass
    if (hasValidLicense()) {
        return {
            allowed: true,
            reason: FEATURE_ACCESS_REASONS.ALLOWED,
            countryAllowed: true,
            source: 'license',
            limitsResolved: resolveFeatureLimits(normalizedFeature, { countryAllowed: true, isLicense: true }),
        };
    }

    // 2. Country context → tier selection (never blocks)
    const { countryAllowed, source, country } = await resolveCountryContext(normalizedFeature);
    const limitsResolved = resolveFeatureLimits(normalizedFeature, { countryAllowed });

    // 3. Start limit check
    if (typeof limitsResolved.startPerDay === 'number') {
        const startResult = checkStartLimit(normalizedFeature, limitsResolved.startPerDay);
        if (!startResult.allowed) {
            return {
                allowed: false,
                reason: FEATURE_ACCESS_REASONS.LIMIT_REACHED,
                countryAllowed,
                source,
                country,
                limitsResolved,
            };
        }
    }

    return {
        allowed: true,
        reason: FEATURE_ACCESS_REASONS.ALLOWED,
        countryAllowed,
        source,
        country,
        limitsResolved,
    };
}

/**
 * Resolve feature limit tier without applying start/day gate.
 * Use this for convert-time item quota checks.
 */
export async function getFeatureLimitContext(featureKey: string): Promise<Omit<FeatureAccessResult, 'allowed' | 'reason'>> {
    const normalizedFeature = normalizeFeature(featureKey);

    if (hasValidLicense()) {
        return {
            countryAllowed: true,
            source: 'license',
            limitsResolved: resolveFeatureLimits(normalizedFeature, { countryAllowed: true, isLicense: true }),
        };
    }

    const { countryAllowed, source, country } = await resolveCountryContext(normalizedFeature);
    return {
        countryAllowed,
        source,
        country,
        limitsResolved: resolveFeatureLimits(normalizedFeature, { countryAllowed }),
    };
}

/**
 * Check if a feature is allowed (boolean sugar).
 */
export async function isFeatureAllowed(featureKey: string): Promise<boolean> {
    const result = await evaluateFeatureAccess(featureKey);
    return result.allowed;
}
