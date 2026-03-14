/**
 * Feature Access Orchestrator — ytmp4.gg
 * 3-layer check: License → Geo (API) → Daily Limit
 *
 * Geo result is cached in localStorage (7 days) and in-memory for the session.
 * At page init, call initAllowedFeatures() to pre-warm the cache.
 */

import { supporterService } from '../api';
import { hasLicenseKey, checkStartLimit } from './download-limit';
import { ensureLicenseCacheFromSavedKey } from './license/license-token';
import { resolveFeatureLimits, type ResolvedLimits } from './feature-limit-policy';
import {
    FEATURE_KEY_ALIASES,
    FEATURE_ACCESS_REASONS,
    type FeatureAccessReason,
} from '@downloader/core';
import { STORAGE_KEYS } from '../utils/storage-keys';

// ============================================================
// CONFIGURATION
// ============================================================

const LS_CACHE_KEY = STORAGE_KEYS.ALLOWED_FEATURES;
const LS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
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

interface StoredAllowedState {
    country: string;
    allowedFeatures: string[];
    timestamp: number;
}

let inflightApiPromise: Promise<AllowedState> | null = null;

// ============================================================
// LOCALSTORAGE CACHE
// ============================================================

function readLocalStorageCache(): AllowedState | null {
    try {
        const raw = localStorage.getItem(LS_CACHE_KEY);
        if (!raw) return null;
        const parsed: StoredAllowedState = JSON.parse(raw);
        if (Date.now() - parsed.timestamp > LS_CACHE_TTL_MS) return null;
        return {
            country: parsed.country,
            allowedFeatures: new Set(parsed.allowedFeatures),
        };
    } catch {
        return null;
    }
}

function writeLocalStorageCache(state: AllowedState): void {
    try {
        const data: StoredAllowedState = {
            country: state.country,
            allowedFeatures: Array.from(state.allowedFeatures),
            timestamp: Date.now(),
        };
        localStorage.setItem(LS_CACHE_KEY, JSON.stringify(data));
    } catch { }
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

function normalizeFeature(feature: string): string {
    return (FEATURE_KEY_ALIASES as Record<string, string>)[feature] ?? feature;
}

/**
 * Fetch from API, save to localStorage + memory cache.
 * Deduplicates concurrent calls.
 */
async function fetchAndCacheAllowedFeatures(): Promise<AllowedState> {
    if (inflightApiPromise) return inflightApiPromise;

    inflightApiPromise = (async () => {
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= ALLOWED_FEATURES_MAX_ATTEMPTS; attempt++) {
            try {
                const response = await supporterService.fetchAllowedFeatures();

                const normalizedFeatures = new Set<string>(
                    Array.isArray(response?.allowed_features)
                        ? response.allowed_features.map((f) => normalizeFeature(String(f)))
                        : []
                );

                const state: AllowedState = {
                    country: typeof response?.country === 'string' ? response.country : '',
                    allowedFeatures: normalizedFeatures,
                };

                writeLocalStorageCache(state);
                return state;
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

/**
 * Get country context synchronously.
 * Priority: memory cache → localStorage cache → fallback (+ trigger background fetch).
 */
function getCountryContextSync(normalizedFeature: string): {
    countryAllowed: boolean;
    source: 'api' | 'fallback' | 'unrestricted';
    country: string;
} {
    if (!GEO_RESTRICTED_FEATURES.has(normalizedFeature)) {
        return { countryAllowed: true, source: 'unrestricted', country: '' };
    }

    // localStorage cache
    const lsCache = readLocalStorageCache();
    if (lsCache) {
        return {
            countryAllowed: lsCache.allowedFeatures.has(normalizedFeature),
            source: 'api',
            country: lsCache.country,
        };
    }

    // No cache — trigger background fetch, return fallback immediately
    fetchAndCacheAllowedFeatures().catch(() => {});
    return { countryAllowed: false, source: 'fallback', country: '' };
}

// ============================================================
// PUBLIC API
// ============================================================

export type { FeatureAccessReason };

export interface FeatureAccessResult {
    allowed: boolean;
    reason: FeatureAccessReason;
    countryAllowed?: boolean;
    source?: 'license' | 'api' | 'fallback' | 'unrestricted';
    country?: string;
    limitsResolved?: ResolvedLimits;
}

/**
 * Pre-warm the allowed features cache at page init.
 * Checks localStorage first; if expired or missing, fetches from API.
 */
export function initAllowedFeatures(): void {
    if (readLocalStorageCache()) return;
    fetchAndCacheAllowedFeatures().catch(() => {});
}

/**
 * Ensure geo cache is ready for restricted features before a user-triggered check.
 * Uses localStorage cache when available; otherwise waits for API once.
 */
async function ensureCountryContextReady(normalizedFeature: string): Promise<void> {
    if (!GEO_RESTRICTED_FEATURES.has(normalizedFeature)) return;
    if (readLocalStorageCache()) return;
    try {
        await fetchAndCacheAllowedFeatures();
    } catch {
        // Keep graceful fallback behavior when API fails.
    }
}

/**
 * Full access check with country-tier-aware limits.
 *
 * Layer 1: License key → bypass all
 * Layer 2: Geo/API → use memory/localStorage cache, fallback if unavailable
 * Layer 3: Daily start limit → gate per-day starts
 */
export function evaluateFeatureAccess(feature: string): FeatureAccessResult {
    const normalizedFeature = normalizeFeature(feature);

    // Layer 1: License key holders bypass everything
    if (hasLicenseKey()) {
        return {
            allowed: true,
            reason: FEATURE_ACCESS_REASONS.ALLOWED,
            countryAllowed: true,
            source: 'license',
            limitsResolved: resolveFeatureLimits(normalizedFeature, { countryAllowed: true, isLicense: true }),
        };
    }

    // Layer 2: Geo check — sync, uses cache or fallback
    const { countryAllowed, source, country } = getCountryContextSync(normalizedFeature);
    const limitsResolved = resolveFeatureLimits(normalizedFeature, { countryAllowed });

    // Layer 3: Daily start limit (if policy defines startPerDay)
    if (typeof limitsResolved.startPerDay === 'number') {
        const startLimit = checkStartLimit(normalizedFeature, limitsResolved.startPerDay);
        if (!startLimit.allowed) {
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
 * Async variant for submit-time checks:
 * wait for geo cache warmup once (if missing), then evaluate.
 */
export async function evaluateFeatureAccessAsync(feature: string): Promise<FeatureAccessResult> {
    const normalizedFeature = normalizeFeature(feature);
    await ensureLicenseCacheFromSavedKey();
    await ensureCountryContextReady(normalizedFeature);
    return evaluateFeatureAccess(normalizedFeature);
}

/**
 * Resolve feature limit tier without applying start/day gate.
 * Use this for convert-time item checks.
 */
export function getFeatureLimitContext(feature: string): {
    countryAllowed: boolean;
    source: 'license' | 'api' | 'fallback' | 'unrestricted';
    country: string;
    limitsResolved: ResolvedLimits;
} {
    const normalizedFeature = normalizeFeature(feature);

    if (hasLicenseKey()) {
        return {
            countryAllowed: true,
            source: 'license',
            country: '',
            limitsResolved: resolveFeatureLimits(normalizedFeature, { countryAllowed: true, isLicense: true }),
        };
    }

    const { countryAllowed, source, country } = getCountryContextSync(normalizedFeature);
    return {
        countryAllowed,
        source,
        country,
        limitsResolved: resolveFeatureLimits(normalizedFeature, { countryAllowed }),
    };
}

/**
 * Async variant for submit/convert-time item quota checks.
 */
export async function getFeatureLimitContextAsync(feature: string): Promise<{
    countryAllowed: boolean;
    source: 'license' | 'api' | 'fallback' | 'unrestricted';
    country: string;
    limitsResolved: ResolvedLimits;
}> {
    const normalizedFeature = normalizeFeature(feature);
    await ensureLicenseCacheFromSavedKey();
    await ensureCountryContextReady(normalizedFeature);
    return getFeatureLimitContext(normalizedFeature);
}

/**
 * Returns true if the feature is allowed.
 */
export function isFeatureAllowed(feature: string): boolean {
    return evaluateFeatureAccess(feature).allowed;
}

/**
 * Returns true if ANY of the given features is allowed.
 */
export function isAnyFeatureAllowed(features: string[]): boolean {
    if (!Array.isArray(features) || features.length === 0) return false;
    return features.some(f => evaluateFeatureAccess(f).allowed);
}
