import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    isLinkExpired,
    getRemainingTime,
    isLinkNearExpiration,
    formatRemainingTime,
    getLinkStatus,
    getTTLConfig,
    DOWNLOAD_LINK_TTL
} from '@/utils/link-validator';

describe('link-validator', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-23T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const NOW = new Date('2026-03-23T12:00:00Z').getTime();

    describe('isLinkExpired', () => {
        it('returns true for null completedAt', () => {
            expect(isLinkExpired(null)).toBe(true);
        });

        it('returns true for undefined completedAt', () => {
            expect(isLinkExpired(undefined)).toBe(true);
        });

        it('returns true for 0 completedAt', () => {
            expect(isLinkExpired(0)).toBe(true);
        });

        it('returns true for non-number completedAt', () => {
            // @ts-expect-error testing invalid input
            expect(isLinkExpired('not a number')).toBe(true);
        });

        it('returns false for recently completed item', () => {
            const completedAt = NOW - (5 * 60 * 1000); // 5 minutes ago
            expect(isLinkExpired(completedAt)).toBe(false);
        });

        it('returns true for item completed beyond TTL', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL - 1; // 1ms past TTL
            expect(isLinkExpired(completedAt)).toBe(true);
        });

        it('returns true for item completed exactly at TTL boundary', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL; // exactly at TTL
            expect(isLinkExpired(completedAt)).toBe(true);
        });

        it('returns false for item 1ms before TTL', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL + 1;
            expect(isLinkExpired(completedAt)).toBe(false);
        });
    });

    describe('getRemainingTime', () => {
        it('returns 0 for null completedAt', () => {
            expect(getRemainingTime(null)).toBe(0);
        });

        it('returns 0 for expired link', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL - 1000;
            expect(getRemainingTime(completedAt)).toBe(0);
        });

        it('returns correct remaining time for valid link', () => {
            const fiveMinAgo = NOW - (5 * 60 * 1000);
            const expected = DOWNLOAD_LINK_TTL - (5 * 60 * 1000);
            expect(getRemainingTime(fiveMinAgo)).toBe(expected);
        });

        it('returns 0 for exactly expired link', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL;
            expect(getRemainingTime(completedAt)).toBe(0);
        });
    });

    describe('isLinkNearExpiration', () => {
        it('returns false for link with plenty of time left', () => {
            const completedAt = NOW - (5 * 60 * 1000); // 5 min ago
            expect(isLinkNearExpiration(completedAt)).toBe(false);
        });

        it('returns true for link with less than 1 minute left', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL + (30 * 1000); // 30s left
            expect(isLinkNearExpiration(completedAt)).toBe(true);
        });

        it('returns false for expired link', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL - 1000;
            expect(isLinkNearExpiration(completedAt)).toBe(false);
        });

        it('returns false for null completedAt', () => {
            expect(isLinkNearExpiration(null)).toBe(false);
        });
    });

    describe('getLinkStatus', () => {
        it('returns "valid" for fresh link', () => {
            const completedAt = NOW - (5 * 60 * 1000);
            expect(getLinkStatus(completedAt)).toBe('valid');
        });

        it('returns "warning" for link near expiration', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL + (30 * 1000); // 30s left
            expect(getLinkStatus(completedAt)).toBe('warning');
        });

        it('returns "expired" for expired link', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL - 1000;
            expect(getLinkStatus(completedAt)).toBe('expired');
        });

        it('returns "expired" for null completedAt', () => {
            expect(getLinkStatus(null)).toBe('expired');
        });

        it('returns "expired" for undefined completedAt', () => {
            expect(getLinkStatus(undefined)).toBe('expired');
        });
    });

    describe('formatRemainingTime', () => {
        it('returns "Expired" for expired link', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL - 1000;
            expect(formatRemainingTime(completedAt)).toBe('Expired');
        });

        it('returns minutes format for > 1 minute remaining', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL + (5 * 60 * 1000); // 5 min left
            expect(formatRemainingTime(completedAt)).toBe('5m');
        });

        it('returns seconds format for < 1 minute remaining', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL + (30 * 1000); // 30s left
            expect(formatRemainingTime(completedAt)).toBe('30s');
        });

        it('returns "Expired" for null completedAt', () => {
            expect(formatRemainingTime(null)).toBe('Expired');
        });
    });

    describe('getTTLConfig', () => {
        it('returns valid config object', () => {
            const config = getTTLConfig();
            expect(config.ttl).toBe(DOWNLOAD_LINK_TTL);
            expect(config.warningThreshold).toBe(60 * 1000); // 1 minute
            expect(config.ttlMinutes).toBe(DOWNLOAD_LINK_TTL / (60 * 1000));
            expect(config.warningMinutes).toBe(1);
        });
    });

    describe('DOWNLOAD_LINK_TTL', () => {
        it('is a positive number', () => {
            expect(DOWNLOAD_LINK_TTL).toBeGreaterThan(0);
        });

        it('equals expected default value (25 minutes)', () => {
            expect(DOWNLOAD_LINK_TTL).toBe(25 * 60 * 1000);
        });
    });
});
