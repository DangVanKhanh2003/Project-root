/**
 * Download Daily Limit Engine — ytmp4.gg
 * Tracks daily usage per feature. License key holders bypass all limits.
 *
 * Ported from: ytmp3.gg/src/script/libs/downloader-lib-standalone/download-limit.js
 */

// ============================================================
// CONFIGURABLE CONSTANTS — change here to adjust free quotas
// ============================================================

import { FEATURE_KEYS, FEATURE_ACCESS_REASONS, type FeatureAccessReason } from '@downloader/core';
import { hasValidLicense } from './license/license-token';

/** Default maximum uses per day for non-license users (fallback for any unlisted feature). */
export const MAX_PER_DAY = 1;

/**
 * Per-feature daily limits. Overrides MAX_PER_DAY for specific features.
 * Features not listed here fall back to MAX_PER_DAY.
 */
const FEATURE_DAILY_LIMITS: Readonly<Record<string, number>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 2,
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 2,
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 2,
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 2,
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 2,
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 20,
};

/** Maximum videos per single multi-download action for non-license users. */
export const MAX_MULTI_DOWNLOAD_VIDEOS = 10;

// ============================================================
// STORAGE KEYS
// ============================================================

const LICENSE_KEY_STORAGE_KEY = 'ytmp4:license_key';

interface DailyUsage {
    date: string;
    count: number;
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

function getTodayString(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`; // local date, e.g. "2026-02-19"
}

function readUsage(storageKey: string): DailyUsage {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return { date: '', count: 0 };
        const parsed = JSON.parse(raw);
        if (typeof parsed.date !== 'string' || typeof parsed.count !== 'number') {
            return { date: '', count: 0 };
        }
        return parsed as DailyUsage;
    } catch {
        return { date: '', count: 0 };
    }
}

function writeUsage(storageKey: string, usage: DailyUsage): void {
    try {
        localStorage.setItem(storageKey, JSON.stringify(usage));
    } catch {
        // Silent fail — localStorage may be unavailable
    }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Check if a valid license key is stored.
 */
export function hasLicenseKey(): boolean {
    return hasValidLicense();
}

/**
 * Get today's usage count for a feature.
 * @param featureKey - e.g. 'download_playlist' | 'download_4k'
 */
export function getUsageToday(featureKey: string): number {
    const today = getTodayString();
    const usage = readUsage(`${featureKey}_daily`);
    return usage.date === today ? usage.count : 0;
}

/**
 * Check if user is allowed to use a feature. Does NOT increment count.
 * @param featureKey - e.g. 'download_playlist' | 'download_4k' | 'download_320kbps'
 */
export function checkLimit(featureKey: string): {
    allowed: boolean;
    reason?: 'license' | 'limit_reached' | FeatureAccessReason;
    usedToday?: number;
    maxPerDay?: number;
} {
    if (hasLicenseKey()) {
        console.log(`[DailyLimit:${featureKey}] license key found → bypass`);
        return { allowed: true, reason: FEATURE_ACCESS_REASONS.LICENSE_FOUND };
    }

    const today = getTodayString();
    const usage = readUsage(`${featureKey}_daily`);
    const count = usage.date === today ? usage.count : 0;
    const limit = FEATURE_DAILY_LIMITS[featureKey] ?? MAX_PER_DAY;

    if (count < limit) {
        console.log(`[DailyLimit:${featureKey}] check OK (${count}/${limit})`);
        return { allowed: true, usedToday: count, maxPerDay: limit };
    }

    console.log(`[DailyLimit:${featureKey}] blocked (${count}/${limit})`);
    return { allowed: false, reason: FEATURE_ACCESS_REASONS.LIMIT_REACHED, usedToday: count, maxPerDay: limit };
}

/**
 * Record one successful usage for a feature.
 * Call this ONLY after the operation succeeds.
 * @param featureKey - e.g. 'download_playlist' | 'download_4k' | 'download_320kbps'
 */
export function recordUsage(featureKey: string): void {
    if (hasLicenseKey()) return; // no limit for license holders

    const today = getTodayString();
    const storageKey = `${featureKey}_daily`;
    const usage = readUsage(storageKey);
    const count = usage.date === today ? usage.count : 0;
    const limit = FEATURE_DAILY_LIMITS[featureKey] ?? MAX_PER_DAY;
    writeUsage(storageKey, { date: today, count: count + 1 });
    console.log(`[DailyLimit:${featureKey}] recorded (${count + 1}/${limit})`);
}

/**
 * Get seconds remaining until the next local midnight (00:00).
 * Used by the popup countdown timer.
 */
export function getSecondsUntilNextMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}
