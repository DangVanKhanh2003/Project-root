/**
 * Link Expiration Validator
 * Handles download link TTL (Time-To-Live) validation
 */

import { getExpiryTime } from '../environment.js';

// Get download link TTL from environment config
export const DOWNLOAD_LINK_TTL = getExpiryTime('downloadLink');

// Warning threshold - show warning when < 1 minute left
const WARNING_THRESHOLD = 1 * 60 * 1000; // 1 minute

/**
 * Check if download link has expired
 * @param {number} completedAt - Unix timestamp when link was created
 * @returns {boolean} True if link has expired
 */
export function isLinkExpired(completedAt) {
    if (!completedAt || typeof completedAt !== 'number') {
        return true; // Treat invalid timestamp as expired
    }

    const now = Date.now();
    const elapsed = now - completedAt;

    return elapsed >= DOWNLOAD_LINK_TTL;
}

/**
 * Get remaining time before link expires
 * @param {number} completedAt - Unix timestamp when link was created
 * @returns {number} Milliseconds remaining (0 if expired)
 */
export function getRemainingTime(completedAt) {
    if (!completedAt) return 0;

    const now = Date.now();
    const elapsed = now - completedAt;
    const remaining = DOWNLOAD_LINK_TTL - elapsed;

    return Math.max(0, remaining);
}

/**
 * Check if link is near expiration (within warning threshold)
 * @param {number} completedAt - Unix timestamp
 * @returns {boolean} True if link is near expiration but not expired yet
 */
export function isLinkNearExpiration(completedAt) {
    const remaining = getRemainingTime(completedAt);
    return remaining > 0 && remaining <= WARNING_THRESHOLD;
}

/**
 * Format remaining time for display
 * @param {number} completedAt - Unix timestamp
 * @returns {string} Formatted time like "5m" or "30s" or "Expired"
 */
export function formatRemainingTime(completedAt) {
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
 * @param {number} completedAt - Unix timestamp
 * @returns {'valid'|'warning'|'expired'} Link status
 */
export function getLinkStatus(completedAt) {
    if (isLinkExpired(completedAt)) return 'expired';
    if (isLinkNearExpiration(completedAt)) return 'warning';
    return 'valid';
}

/**
 * Get TTL configuration
 * @returns {object} TTL configuration
 */
export function getTTLConfig() {
    return {
        ttl: DOWNLOAD_LINK_TTL,
        warningThreshold: WARNING_THRESHOLD,
        ttlMinutes: DOWNLOAD_LINK_TTL / (60 * 1000),
        warningMinutes: WARNING_THRESHOLD / (60 * 1000)
    };
}
