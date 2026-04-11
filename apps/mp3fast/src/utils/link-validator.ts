/**
 * Link Expiration Validator
 * Handles download link TTL (Time-To-Live) validation
 */

import { getExpiryTime } from '../environment';

export type LinkStatus = 'valid' | 'warning' | 'expired';

interface TTLConfig {
    ttl: number;
    warningThreshold: number;
    ttlMinutes: number;
    warningMinutes: number;
}

export const DOWNLOAD_LINK_TTL: number = getExpiryTime('downloadLink');
const WARNING_THRESHOLD: number = 1 * 60 * 1000;

export function isLinkExpired(completedAt: number | null | undefined): boolean {
    if (!completedAt || typeof completedAt !== 'number') {
        return true;
    }

    const now = Date.now();
    const elapsed = now - completedAt;

    return elapsed >= DOWNLOAD_LINK_TTL;
}

export function getRemainingTime(completedAt: number | null | undefined): number {
    if (!completedAt) return 0;

    const now = Date.now();
    const elapsed = now - completedAt;
    const remaining = DOWNLOAD_LINK_TTL - elapsed;

    return Math.max(0, remaining);
}

export function isLinkNearExpiration(completedAt: number | null | undefined): boolean {
    const remaining = getRemainingTime(completedAt);
    return remaining > 0 && remaining <= WARNING_THRESHOLD;
}

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

export function getLinkStatus(completedAt: number | null | undefined): LinkStatus {
    if (isLinkExpired(completedAt)) return 'expired';
    if (isLinkNearExpiration(completedAt)) return 'warning';
    return 'valid';
}

export function getTTLConfig(): TTLConfig {
    return {
        ttl: DOWNLOAD_LINK_TTL,
        warningThreshold: WARNING_THRESHOLD,
        ttlMinutes: DOWNLOAD_LINK_TTL / (60 * 1000),
        warningMinutes: WARNING_THRESHOLD / (60 * 1000)
    };
}
