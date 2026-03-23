/**
 * Stress & Edge Case Tests for Link Validator
 * Tests boundary conditions, concurrency simulation, and extreme inputs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    isLinkExpired,
    getRemainingTime,
    isLinkNearExpiration,
    formatRemainingTime,
    getLinkStatus,
    DOWNLOAD_LINK_TTL
} from './link-validator';

describe('link-validator stress tests', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-23T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const NOW = new Date('2026-03-23T12:00:00Z').getTime();
    const WARNING_THRESHOLD = 1 * 60 * 1000; // 1 minute

    describe('boundary precision tests', () => {
        it('1ms before TTL is not expired but in warning zone', () => {
            expect(isLinkExpired(NOW - DOWNLOAD_LINK_TTL + 1)).toBe(false);
            // 1ms remaining is within warning threshold (< 1 minute), so status is 'warning'
            expect(getLinkStatus(NOW - DOWNLOAD_LINK_TTL + 1)).toBe('warning');
        });

        it('exactly at TTL is expired', () => {
            expect(isLinkExpired(NOW - DOWNLOAD_LINK_TTL)).toBe(true);
            expect(getLinkStatus(NOW - DOWNLOAD_LINK_TTL)).toBe('expired');
        });

        it('1ms after TTL is expired', () => {
            expect(isLinkExpired(NOW - DOWNLOAD_LINK_TTL - 1)).toBe(true);
            expect(getLinkStatus(NOW - DOWNLOAD_LINK_TTL - 1)).toBe('expired');
        });

        it('warning boundary: 1ms before warning threshold is valid (not warning)', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL + WARNING_THRESHOLD + 1;
            expect(getLinkStatus(completedAt)).toBe('valid');
        });

        it('warning boundary: exactly at warning threshold is warning', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL + WARNING_THRESHOLD;
            expect(getLinkStatus(completedAt)).toBe('warning');
        });

        it('warning boundary: 1ms into warning zone is warning', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL + WARNING_THRESHOLD - 1;
            expect(getLinkStatus(completedAt)).toBe('warning');
        });

        it('warning boundary: 1ms remaining is warning', () => {
            const completedAt = NOW - DOWNLOAD_LINK_TTL + 1;
            expect(getLinkStatus(completedAt)).toBe('warning');
        });
    });

    describe('extreme input values', () => {
        it('handles completedAt = 0', () => {
            expect(isLinkExpired(0)).toBe(true);
            expect(getRemainingTime(0)).toBe(0);
            expect(getLinkStatus(0)).toBe('expired');
        });

        it('handles negative completedAt', () => {
            expect(isLinkExpired(-1000)).toBe(true);
            expect(getRemainingTime(-1000)).toBe(0);
        });

        it('handles very old completedAt (year 2000)', () => {
            const year2000 = new Date('2000-01-01').getTime();
            expect(isLinkExpired(year2000)).toBe(true);
            expect(getRemainingTime(year2000)).toBe(0);
        });

        it('handles future completedAt', () => {
            const future = NOW + 10 * 60 * 1000; // 10 minutes in the future
            expect(isLinkExpired(future)).toBe(false);
            expect(getRemainingTime(future)).toBeGreaterThan(DOWNLOAD_LINK_TTL);
        });

        it('handles completedAt = NOW (just completed)', () => {
            expect(isLinkExpired(NOW)).toBe(false);
            expect(getRemainingTime(NOW)).toBe(DOWNLOAD_LINK_TTL);
            expect(getLinkStatus(NOW)).toBe('valid');
        });

        it('handles Number.MAX_SAFE_INTEGER', () => {
            expect(isLinkExpired(Number.MAX_SAFE_INTEGER)).toBe(false);
        });

        it('handles NaN', () => {
            expect(isLinkExpired(NaN)).toBe(true);
        });

        it('handles Infinity', () => {
            // @ts-expect-error testing edge case
            expect(isLinkExpired(Infinity)).toBe(false);
        });

        it('handles -Infinity', () => {
            // @ts-expect-error testing edge case
            expect(isLinkExpired(-Infinity)).toBe(true);
        });
    });

    describe('time progression simulation', () => {
        it('link transitions from valid → warning → expired over time', () => {
            const completedAt = NOW;

            // T=0: just created
            expect(getLinkStatus(completedAt)).toBe('valid');
            expect(isLinkExpired(completedAt)).toBe(false);

            // T = TTL - 2min: still valid
            vi.setSystemTime(new Date(NOW + DOWNLOAD_LINK_TTL - 2 * 60 * 1000));
            expect(getLinkStatus(completedAt)).toBe('valid');

            // T = TTL - 30s: warning zone
            vi.setSystemTime(new Date(NOW + DOWNLOAD_LINK_TTL - 30 * 1000));
            expect(getLinkStatus(completedAt)).toBe('warning');
            expect(isLinkNearExpiration(completedAt)).toBe(true);

            // T = TTL: expired
            vi.setSystemTime(new Date(NOW + DOWNLOAD_LINK_TTL));
            expect(getLinkStatus(completedAt)).toBe('expired');
            expect(isLinkExpired(completedAt)).toBe(true);

            // T = TTL + 1 hour: still expired
            vi.setSystemTime(new Date(NOW + DOWNLOAD_LINK_TTL + 60 * 60 * 1000));
            expect(getLinkStatus(completedAt)).toBe('expired');
        });

        it('formatRemainingTime shows correct countdown', () => {
            const completedAt = NOW;

            // 10 minutes remaining
            vi.setSystemTime(new Date(NOW + DOWNLOAD_LINK_TTL - 10 * 60 * 1000));
            expect(formatRemainingTime(completedAt)).toBe('10m');

            // 1 minute remaining
            vi.setSystemTime(new Date(NOW + DOWNLOAD_LINK_TTL - 60 * 1000));
            expect(formatRemainingTime(completedAt)).toBe('1m');

            // 45 seconds remaining
            vi.setSystemTime(new Date(NOW + DOWNLOAD_LINK_TTL - 45 * 1000));
            expect(formatRemainingTime(completedAt)).toBe('45s');

            // 1 second remaining
            vi.setSystemTime(new Date(NOW + DOWNLOAD_LINK_TTL - 1000));
            expect(formatRemainingTime(completedAt)).toBe('1s');

            // Expired
            vi.setSystemTime(new Date(NOW + DOWNLOAD_LINK_TTL));
            expect(formatRemainingTime(completedAt)).toBe('Expired');
        });
    });

    describe('batch expiry check simulation', () => {
        it('correctly identifies expired items in a batch of 1000', () => {
            const items: { id: number; completedAt: number }[] = [];
            for (let i = 0; i < 1000; i++) {
                items.push({
                    id: i,
                    // Half expired (completed > TTL ago), half valid
                    completedAt: i < 500
                        ? NOW - DOWNLOAD_LINK_TTL - (i * 1000) // expired
                        : NOW - (i * 100) // valid (recent)
                });
            }

            const expired = items.filter(item => isLinkExpired(item.completedAt));
            const valid = items.filter(item => !isLinkExpired(item.completedAt));

            expect(expired.length).toBe(500);
            expect(valid.length).toBe(500);
        });

        it('correctly categorizes mixed-status batch of 10000', () => {
            const items: { completedAt: number | null }[] = [];
            let expectedExpired = 0;
            let expectedWarning = 0;
            let expectedValid = 0;

            for (let i = 0; i < 10000; i++) {
                const mod = i % 4;
                let completedAt: number | null;

                if (mod === 0) {
                    completedAt = null; // expired (null)
                    expectedExpired++;
                } else if (mod === 1) {
                    completedAt = NOW - DOWNLOAD_LINK_TTL - 1000; // expired
                    expectedExpired++;
                } else if (mod === 2) {
                    completedAt = NOW - DOWNLOAD_LINK_TTL + 30 * 1000; // warning (30s left)
                    expectedWarning++;
                } else {
                    completedAt = NOW - 5 * 60 * 1000; // valid (5 min ago)
                    expectedValid++;
                }
                items.push({ completedAt });
            }

            const statuses = items.map(item => getLinkStatus(item.completedAt));
            const actualExpired = statuses.filter(s => s === 'expired').length;
            const actualWarning = statuses.filter(s => s === 'warning').length;
            const actualValid = statuses.filter(s => s === 'valid').length;

            expect(actualExpired).toBe(expectedExpired);
            expect(actualWarning).toBe(expectedWarning);
            expect(actualValid).toBe(expectedValid);
            expect(actualExpired + actualWarning + actualValid).toBe(10000);
        });

        it('performance: checking 100k items completes in < 100ms', () => {
            const start = performance.now();
            for (let i = 0; i < 100000; i++) {
                isLinkExpired(NOW - i * 100);
            }
            const elapsed = performance.now() - start;
            expect(elapsed).toBeLessThan(100);
        });
    });

    describe('getRemainingTime precision', () => {
        it('remaining time + elapsed = TTL for valid links', () => {
            for (let minutesAgo = 0; minutesAgo < 20; minutesAgo++) {
                const completedAt = NOW - minutesAgo * 60 * 1000;
                const remaining = getRemainingTime(completedAt);
                const elapsed = NOW - completedAt;
                expect(remaining + elapsed).toBe(DOWNLOAD_LINK_TTL);
            }
        });

        it('remaining time is always >= 0', () => {
            const testValues = [null, undefined, 0, -1, NOW, NOW - DOWNLOAD_LINK_TTL * 2];
            for (const val of testValues) {
                expect(getRemainingTime(val)).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('type coercion edge cases', () => {
        it('handles string-like numbers', () => {
            // @ts-expect-error testing type coercion
            expect(isLinkExpired('not a number')).toBe(true);
        });

        it('handles boolean input', () => {
            // @ts-expect-error testing type coercion
            expect(isLinkExpired(true)).toBe(true);
            // @ts-expect-error testing type coercion
            expect(isLinkExpired(false)).toBe(true);
        });

        it('handles object input', () => {
            // @ts-expect-error testing type coercion
            expect(isLinkExpired({})).toBe(true);
        });

        it('handles array input', () => {
            // @ts-expect-error testing type coercion
            expect(isLinkExpired([NOW])).toBe(true);
        });
    });

    describe('DOWNLOAD_LINK_TTL constant', () => {
        it('is reasonable (between 1 minute and 24 hours)', () => {
            expect(DOWNLOAD_LINK_TTL).toBeGreaterThanOrEqual(60 * 1000);
            expect(DOWNLOAD_LINK_TTL).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
        });

        it('is an integer (no fractional milliseconds)', () => {
            expect(Number.isInteger(DOWNLOAD_LINK_TTL)).toBe(true);
        });
    });
});
