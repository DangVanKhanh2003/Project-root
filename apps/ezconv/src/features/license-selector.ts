/**
 * License Selector — Backward-Compatible Wrapper
 *
 * Thin delegation layer over license-token.ts.
 * Keeps the same export signatures so existing imports continue to work.
 */

import {
    hasValidLicense,
    getStoredRawKey,
    clearLicenseToken,
    getLicenseTokenStorageKey,
    type LicenseKeyChangeDetail,
} from './license-token';

export type { LicenseKeyChangeDetail };

declare global {
    interface DocumentEventMap {
        'ezconv:license-key-changed': CustomEvent<LicenseKeyChangeDetail>;
    }
}

export function getLicenseStorageKey(): string {
    return getLicenseTokenStorageKey();
}

/**
 * Check if user has a valid stored license.
 * Now checks the encoded token + TTL instead of just raw key existence.
 */
export function hasStoredLicenseKey(): boolean {
    return hasValidLicense();
}

/**
 * Get the raw license key from the stored token.
 * Returns null if no token or invalid.
 */
export function getStoredLicenseKey(): string | null {
    return getStoredRawKey();
}

/**
 * @deprecated Use saveLicenseFromApi() from license-token.ts instead.
 * Kept for backward compat — does nothing meaningful now.
 */
export function saveLicenseKey(_key: string): string | null {
    // No-op: saving is now done via saveLicenseFromApi() in license-token.ts
    // which requires the full API response
    return _key || null;
}

/**
 * Clear stored license token.
 */
export function clearStoredLicenseKey(): void {
    clearLicenseToken();
}
