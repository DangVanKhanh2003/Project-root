/**
 * License Token — Cached License Management
 *
 * Stores license info permanently as obfuscated data in localStorage.
 * Revalidation with server is fire-and-forget async (background, never blocks).
 *
 * Storage keys:
 *   ytsss:license_key   → raw key string (for revalidation)
 *   ytsss:license_cache  → {base64}.{hash} (encoded license data)
 */

import { supporterService } from '../../api';
import type { CheckKeyResponse } from '@downloader/core';
import { STORAGE_KEYS } from '../../utils/storage-keys';

// ============================================================
// CONSTANTS
// ============================================================

const LICENSE_KEY_STORAGE_KEY = STORAGE_KEYS.LICENSE_KEY;
const LICENSE_CACHE_STORAGE_KEY = STORAGE_KEYS.LICENSE_CACHE;

/** Revalidate every 24 hours (fire-and-forget, never blocks) */
const REVALIDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Salt for integrity hash — just anti-casual-tampering, not crypto */
const INTEGRITY_SALT = 'ytsss_lk_2026';

// ============================================================
// TYPES
// ============================================================

export interface CachedLicense {
    planType: 'lifetime' | 'yearly' | 'monthly' | 'weekly';
    status: string;
    activatedAt: string;
    expiresAt: string | null;
    tierPurchased: number;
    userName?: string;
    userEmail?: string;
    /** Date.now() of last successful API validation */
    lastValidatedAt: number;
}

// ============================================================
// ENCODE / DECODE HELPERS
// ============================================================

function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

function encodeLicenseCache(data: CachedLicense): string {
    try {
        const json = JSON.stringify(data);
        const payload = btoa(unescape(encodeURIComponent(json)));
        const hash = simpleHash(json + INTEGRITY_SALT);
        return `${payload}.${hash}`;
    } catch {
        return '';
    }
}

function decodeLicenseCache(raw: string): CachedLicense | null {
    try {
        const dotIndex = raw.lastIndexOf('.');
        if (dotIndex === -1) return null;

        const payload = raw.substring(0, dotIndex);
        const hash = raw.substring(dotIndex + 1);

        const json = decodeURIComponent(escape(atob(payload)));
        const expectedHash = simpleHash(json + INTEGRITY_SALT);

        if (hash !== expectedHash) {
            console.warn('[LicenseToken] Integrity check failed — cache tampered');
            return null;
        }

        const data = JSON.parse(json) as CachedLicense;

        // Basic shape validation
        if (!data.planType || !data.status || typeof data.lastValidatedAt !== 'number') {
            return null;
        }

        return data;
    } catch {
        return null;
    }
}

// ============================================================
// STORAGE
// ============================================================

/**
 * Save API response as cached license data (permanent).
 */
export function saveLicenseCache(response: CheckKeyResponse): void {
    try {
        const normalizedStatus = typeof response.status === 'string'
            ? response.status.trim().toLowerCase()
            : 'active';

        const data: CachedLicense = {
            planType: (response.planType as CachedLicense['planType']) || 'lifetime',
            status: normalizedStatus || 'active',
            activatedAt: response.activatedAt || new Date().toISOString(),
            expiresAt: response.expiresAt ?? null,
            tierPurchased: response.tierPurchased ?? 0,
            userName: response.user?.name,
            userEmail: response.user?.email,
            lastValidatedAt: Date.now(),
        };

        const encoded = encodeLicenseCache(data);
        if (encoded) {
            localStorage.setItem(LICENSE_CACHE_STORAGE_KEY, encoded);
            console.log('✅ License cache saved');
        }
    } catch {
        // Silent fail
    }
}

/**
 * Get cached license data. Returns null if no cache or tampered.
 */
export function getLicenseCache(): CachedLicense | null {
    try {
        const raw = localStorage.getItem(LICENSE_CACHE_STORAGE_KEY);
        if (!raw) return null;
        return decodeLicenseCache(raw);
    } catch {
        return null;
    }
}

/**
 * Remove cached license data.
 */
export function removeLicenseCache(): void {
    try {
        localStorage.removeItem(LICENSE_CACHE_STORAGE_KEY);
        console.log('🗑️ License cache removed');
    } catch {
        // Silent fail
    }
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Get end-of-day timestamp for a given date (local time 23:59:59.999).
 */
function endOfDay(date: Date): number {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
}

/**
 * Check if cached license represents an active, non-expired plan.
 * Checks expiresAt in realtime — no API call.
 * If expiresAt is today, user still has access for the whole day.
 */
export function isPlanActive(cache: CachedLicense): boolean {
    // Status must be active
    if ((cache.status || '').trim().toLowerCase() !== 'active') return false;

    // Lifetime never expires
    if (cache.expiresAt === null) return true;

    // Check expiry — allow access for the entire expiry day
    const expiryDate = new Date(cache.expiresAt);
    if (isNaN(expiryDate.getTime())) return false;
    return endOfDay(expiryDate) >= Date.now();
}

/**
 * Check if we have a valid (active, non-expired) license.
 * Always trusts cache — never calls API.
 */
export function hasValidLicense(): boolean {
    const cache = getLicenseCache();
    if (!cache) return false;
    return isPlanActive(cache);
}

/**
 * Optimistic license check:
 * - If cache is valid: supporter
 * - If cache missing but key exists: treat as supporter and sync in background
 */
export function hasLicenseKeyOptimistic(): boolean {
    const cache = getLicenseCache();
    if (cache) {
        return isPlanActive(cache);
    }
    const savedKey = getSavedLicenseKey();
    if (savedKey) {
        revalidateLicense();
        return true;
    }
    return false;
}

/**
 * Ensure license state is synced in background when key exists but cache is missing.
 * Always non-blocking for user actions.
 */
export async function ensureLicenseCacheFromSavedKey(): Promise<boolean> {
    const supporter = hasLicenseKeyOptimistic();
    return Promise.resolve(supporter);
}

/**
 * Check if the cache needs a background revalidation.
 * True when lastValidatedAt is older than REVALIDATE_INTERVAL_MS.
 */
export function needsRevalidation(cache: CachedLicense): boolean {
    return (Date.now() - cache.lastValidatedAt) > REVALIDATE_INTERVAL_MS;
}

/**
 * Calculate days remaining from expiresAt (realtime).
 * Returns null for lifetime plans.
 */
export function getDaysRemaining(cache: CachedLicense): number | null {
    if (cache.expiresAt === null) return null;

    const expiryDate = new Date(cache.expiresAt);
    if (isNaN(expiryDate.getTime())) return 0;

    // Compare by calendar date — same day = 0 days remaining (still active)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expiryDayStart = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
    const diffDays = Math.floor((expiryDayStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));

    return Math.max(0, diffDays);
}

/**
 * Format plan display string.
 * e.g. "Lifetime", "Yearly • 364 days left", "Monthly • 12 days left"
 */
export function formatPlanDisplay(cache: CachedLicense): string {
    const planLabel = cache.planType.charAt(0).toUpperCase() + cache.planType.slice(1);

    if (cache.planType === 'lifetime') {
        return planLabel;
    }

    const days = getDaysRemaining(cache);
    if (days === null) return planLabel;
    if (!isPlanActive(cache)) return `${planLabel} • Expired`;
    if (days === 0) return `${planLabel} • Last day`;
    if (days === 1) return `${planLabel} • 1 day left`;
    return `${planLabel} • ${days} days left`;
}

// ============================================================
// BACKGROUND REVALIDATION
// ============================================================

/** Guard to prevent concurrent revalidation */
let isRevalidating = false;

/**
 * Fire-and-forget background revalidation.
 * Calls API with saved key, updates cache silently.
 * Never blocks — if key is invalid, cache is cleared (effect on next page load).
 */
export function revalidateLicense(): void {
    if (isRevalidating) return;

    const savedKey = getSavedLicenseKey();
    if (!savedKey) return;

    isRevalidating = true;

    supporterService.checkLicenseKey(savedKey)
        .then((response) => {
            if (response?.valid) {
                saveLicenseCache(response);
                console.log('[LicenseToken] Revalidation successful — cache updated');
            } else {
                // Key no longer valid — clear everything
                removeLicenseCache();
                removeSavedLicenseKey();
                console.log('[LicenseToken] Revalidation failed — key invalid, cache cleared');
            }
        })
        .catch((error) => {
            // Network error — do nothing, try again later
            console.warn('[LicenseToken] Revalidation network error — will retry later:', error);
        })
        .finally(() => {
            isRevalidating = false;
        });
}

/**
 * Initialize license on page load.
 * Reads cache, triggers background revalidation if needed.
 * Never blocks — always returns immediately.
 */
export function initLicenseOnPageLoad(): void {
    const cache = getLicenseCache();
    if (!cache) {
        if (getSavedLicenseKey()) {
            revalidateLicense();
        }
        return;
    }

    if (needsRevalidation(cache)) {
        revalidateLicense();
    }
}

// ============================================================
// KEY STORAGE HELPERS (re-exported for convenience)
// ============================================================

export function getSavedLicenseKey(): string | null {
    try {
        const key = localStorage.getItem(LICENSE_KEY_STORAGE_KEY);
        return typeof key === 'string' && key.trim() !== '' ? key : null;
    } catch {
        return null;
    }
}

export function saveLicenseKey(key: string): void {
    try {
        localStorage.setItem(LICENSE_KEY_STORAGE_KEY, key);
    } catch {
        // Silent fail
    }
}

export function removeSavedLicenseKey(): void {
    try {
        localStorage.removeItem(LICENSE_KEY_STORAGE_KEY);
    } catch {
        // Silent fail
    }
}
