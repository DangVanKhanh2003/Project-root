/**
 * License Token — Encoded Cache Layer
 *
 * Stores the full API response (from /api/check-key) as a base64-encoded JSON
 * string in localStorage. Replaces the old raw-key-only approach.
 *
 * Key behaviors:
 *   - Stores plan info (planType, expiresAt, status, etc.), not just the key
 *   - Base64-encoded (not plain object) to deter casual editing
 *   - hasValidLicense() always uses cache — never blocks on API
 *   - Background async refresh when cache is stale (>24h), non-blocking
 *   - Only expired plans get cleared
 */

import type { CheckKeyResponse } from '@downloader/core';

// ============================================================
// CONSTANTS
// ============================================================

const TOKEN_STORAGE_KEY = 'ezconv:license_token';
const OLD_LICENSE_KEY = 'ezconv:license_key';
const LICENSE_EVENT_NAME = 'ezconv:license-key-changed';

/** After this duration, a background refresh is triggered (non-blocking) */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================
// TYPES
// ============================================================

export interface LicenseInfo {
    key: string;
    planType: string;
    status: string;
    activatedAt: string;
    expiresAt: string | null;
    isExpired: boolean;
    daysRemaining: number | null;
    tierPurchased: number;
    user: { email: string; name: string } | null;
    fetchedAt: number;
}

export interface LicenseKeyChangeDetail {
    key: string | null;
}

declare global {
    interface DocumentEventMap {
        'ezconv:license-key-changed': CustomEvent<LicenseKeyChangeDetail>;
    }
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

function encodeToken(data: LicenseInfo): string {
    try {
        return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    } catch {
        return '';
    }
}

function decodeToken(encoded: string): LicenseInfo | null {
    try {
        const json = decodeURIComponent(escape(atob(encoded)));
        const parsed = JSON.parse(json);

        if (
            typeof parsed !== 'object' || parsed === null ||
            typeof parsed.key !== 'string' || !parsed.key
        ) {
            return null;
        }

        return {
            key: parsed.key,
            planType: typeof parsed.planType === 'string' ? parsed.planType : 'unknown',
            status: typeof parsed.status === 'string' ? parsed.status : 'unknown',
            activatedAt: typeof parsed.activatedAt === 'string' ? parsed.activatedAt : '',
            expiresAt: typeof parsed.expiresAt === 'string' ? parsed.expiresAt : null,
            isExpired: typeof parsed.isExpired === 'boolean' ? parsed.isExpired : false,
            daysRemaining: typeof parsed.daysRemaining === 'number' ? parsed.daysRemaining : null,
            tierPurchased: typeof parsed.tierPurchased === 'number' ? parsed.tierPurchased : 0,
            user: parsed.user && typeof parsed.user.email === 'string' && typeof parsed.user.name === 'string'
                ? { email: parsed.user.email, name: parsed.user.name }
                : null,
            fetchedAt: typeof parsed.fetchedAt === 'number' ? parsed.fetchedAt : 0,
        };
    } catch {
        return null;
    }
}

function readTokenFromStorage(): string | null {
    try {
        const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
        return raw && raw.length > 0 ? raw : null;
    } catch {
        return null;
    }
}

function writeTokenToStorage(encoded: string): boolean {
    try {
        localStorage.setItem(TOKEN_STORAGE_KEY, encoded);
        return true;
    } catch {
        return false;
    }
}

function removeTokenFromStorage(): void {
    try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
        // localStorage unavailable
    }
}

function dispatchLicenseChanged(key: string | null): void {
    if (typeof document === 'undefined') return;

    document.dispatchEvent(new CustomEvent(LICENSE_EVENT_NAME, {
        detail: { key },
    }));
}

/**
 * Check if the plan itself has expired based on expiresAt timestamp.
 * Lifetime plans (expiresAt === null) never expire.
 */
function isPlanExpired(info: LicenseInfo): boolean {
    if (info.isExpired) return true;
    if (!info.expiresAt) return false; // lifetime

    // Consider plan valid through the END of the expiry date
    const expiryDate = new Date(info.expiresAt);
    expiryDate.setHours(23, 59, 59, 999);
    return expiryDate.getTime() < Date.now();
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Compute days remaining from expiresAt. Returns null for lifetime plans.
 * Always computed live from current time, not from cached daysRemaining.
 */
export function computeDaysRemaining(expiresAt: string | null): number | null {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/**
 * Get decoded license info from the cached token.
 * Returns null if no token, invalid token, or plan expired.
 */
export function getLicenseInfo(): LicenseInfo | null {
    const encoded = readTokenFromStorage();
    if (!encoded) return null;

    const info = decodeToken(encoded);
    if (!info) return null;

    // If plan itself has expired, clear token
    if (isPlanExpired(info)) {
        removeTokenFromStorage();
        dispatchLicenseChanged(null);
        return null;
    }

    return info;
}

/**
 * Synchronous check: does the user have a valid license?
 * Always uses cache — never blocks on API.
 * Valid = token exists, can be decoded, and plan has not expired.
 */
export function hasValidLicense(): boolean {
    return getLicenseInfo() !== null;
}

/**
 * Check if the cached data is stale (older than STALE_THRESHOLD_MS).
 * When stale, a background refresh should be triggered — but the cache
 * is still considered valid and `hasValidLicense()` still returns true.
 */
export function isCacheStale(): boolean {
    const encoded = readTokenFromStorage();
    if (!encoded) return false;

    const info = decodeToken(encoded);
    if (!info) return false;

    return (Date.now() - info.fetchedAt) > STALE_THRESHOLD_MS;
}

/**
 * Get the raw license key stored inside the token (used for API calls).
 */
export function getStoredRawKey(): string | null {
    const encoded = readTokenFromStorage();
    if (!encoded) return null;

    const info = decodeToken(encoded);
    return info?.key ?? null;
}

/**
 * Save license info from a successful API response.
 * Creates the encoded token and stores it permanently.
 */
export function saveLicenseFromApi(key: string, response: CheckKeyResponse): void {
    if (!response.valid) return;

    const info: LicenseInfo = {
        key,
        planType: response.planType ?? 'unknown',
        status: response.status ?? 'active',
        activatedAt: response.activatedAt ?? '',
        expiresAt: response.expiresAt ?? null,
        isExpired: response.isExpired ?? false,
        daysRemaining: response.daysRemaining ?? null,
        tierPurchased: response.tierPurchased ?? 0,
        user: response.user ?? null,
        fetchedAt: Date.now(),
    };

    const encoded = encodeToken(info);
    if (!encoded) return;

    writeTokenToStorage(encoded);
    dispatchLicenseChanged(key);
}

/**
 * Clear the license token entirely.
 */
export function clearLicenseToken(): void {
    removeTokenFromStorage();

    // Also clean up legacy key if present
    try {
        localStorage.removeItem(OLD_LICENSE_KEY);
    } catch {
        // ignore
    }

    dispatchLicenseChanged(null);
}

/**
 * Check for old format key (ezconv:license_key) and return it for migration.
 * Does NOT remove the old key — caller should do that after successful revalidation.
 */
export function migrateOldKey(): string | null {
    // If new token already exists, no migration needed
    if (readTokenFromStorage()) return null;

    try {
        const oldKey = localStorage.getItem(OLD_LICENSE_KEY);
        if (oldKey && oldKey.trim().length > 0) {
            return oldKey.trim();
        }
    } catch {
        // ignore
    }

    return null;
}

/**
 * Remove the legacy key after successful migration.
 */
export function removeLegacyKey(): void {
    try {
        localStorage.removeItem(OLD_LICENSE_KEY);
    } catch {
        // ignore
    }
}

/**
 * Get the localStorage key name for the token (used by storage event listeners).
 */
export function getLicenseTokenStorageKey(): string {
    return TOKEN_STORAGE_KEY;
}
