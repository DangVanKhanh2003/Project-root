/**
 * Link Expiration Validator
 * Handles download link TTL (Time-To-Live) validation
 */

import { getExpiryTime } from '../constants/config';

// Type definitions
export type LinkStatus = 'valid' | 'warning' | 'expired';

interface TTLConfig {
    ttl: number;
    warningThreshold: number;
    ttlMinutes: number;
    warningMinutes: number;
}

// Get download link TTL from environment config
export const DOWNLOAD_LINK_TTL: number = getExpiryTime('downloadLink');

// Warning threshold - show warning when < 1 minute left
const WARNING_THRESHOLD: number = 1 * 60 * 1000; // 1 minute

/**
 * Check if download link has expired
 * @param completedAt - Unix timestamp when link was created
 * @returns True if link has expired
 */
export function isLinkExpired(completedAt: number | null | undefined): boolean {
    if (!completedAt || typeof completedAt !== 'number') {
        return true; // Treat invalid timestamp as expired
    }

    const now = Date.now();
    const elapsed = now - completedAt;

    return elapsed >= DOWNLOAD_LINK_TTL;
}

/**
 * Get remaining time before link expires
 * @param completedAt - Unix timestamp when link was created
 * @returns Milliseconds remaining (0 if expired)
 */
export function getRemainingTime(completedAt: number | null | undefined): number {
    if (!completedAt) return 0;

    const now = Date.now();
    const elapsed = now - completedAt;
    const remaining = DOWNLOAD_LINK_TTL - elapsed;

    return Math.max(0, remaining);
}

/**
 * Check if link is near expiration (within warning threshold)
 * @param completedAt - Unix timestamp
 * @returns True if link is near expiration but not expired yet
 */
export function isLinkNearExpiration(completedAt: number | null | undefined): boolean {
    const remaining = getRemainingTime(completedAt);
    return remaining > 0 && remaining <= WARNING_THRESHOLD;
}

/**
 * Format remaining time for display
 * @param completedAt - Unix timestamp
 * @returns Formatted time like "5m" or "30s" or "Expired"
 */
export function formatRemainingTime(completedAt: number | null | undefined): string {
    const remaining = getRemainingTime(completedAt);

    if (remaining === 0) return 'Expired';

    const minutes = Math.floor(remaining / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    if (minutes > 0) {
        return `${minutes}m`;
    }
    return `${seconds}s`;
}

/**
 * Get link status
 * @param completedAt - Unix timestamp
 * @returns Link status
 */
export function getLinkStatus(completedAt: number | null | undefined): LinkStatus {
    if (isLinkExpired(completedAt)) return 'expired';
    if (isLinkNearExpiration(completedAt)) return 'warning';
    return 'valid';
}

/**
 * Get TTL configuration
 * @returns TTL configuration
 */
export function getTTLConfig(): TTLConfig {
    return {
        ttl: DOWNLOAD_LINK_TTL,
        warningThreshold: WARNING_THRESHOLD,
        ttlMinutes: DOWNLOAD_LINK_TTL / (60 * 1000),
        warningMinutes: WARNING_THRESHOLD / (60 * 1000)
    };
}
