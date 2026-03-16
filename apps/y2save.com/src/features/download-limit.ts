/**
 * Download Daily Limit Engine — y2save.com
 * Tracks daily usage per feature. License key holders bypass all limits.
 *
 * Ported from: ytmp3.gg/src/script/libs/downloader-lib-standalone/download-limit.js
 */

// ============================================================
// CONFIGURABLE CONSTANTS — change here to adjust free quotas
// ============================================================

import { FEATURE_KEYS, FEATURE_ACCESS_REASONS, type FeatureAccessReason } from '@downloader/core';
import { hasLicenseKeyOptimistic } from './license/license-token';
import { MULTIPLE_MAX_ITEMS_ALLOWED } from './feature-limit-policy';
import { getStartUsageKey, getItemUsageKey } from '../utils/storage-keys';

/** Default maximum uses per day for non-license users (fallback for any unlisted feature). */
export const MAX_PER_DAY = 1;

/**
 * Per-feature daily limits. Overrides MAX_PER_DAY for specific features.
 * Features not listed here fall back to MAX_PER_DAY.
 */
const FEATURE_DAILY_LIMITS: Readonly<Record<string, number>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 20,
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 20,
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 20,
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 10,
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 20,
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 200,
};

/**
 * Backward-compatible export.
 * Multiple per-convert limit now comes from centralized policy.
 */
export const MAX_MULTI_DOWNLOAD_VIDEOS = MULTIPLE_MAX_ITEMS_ALLOWED;

// ============================================================
// STORAGE KEYS
// ============================================================

const LICENSE_KEY_STORAGE_KEY = 'y2save:license_key';

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

function getStartUsageStorageKey(featureKey: string): string {
    return getStartUsageKey(featureKey);
}

function getItemUsageStorageKey(featureKey: string): string {
    return getItemUsageKey(featureKey);
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
    return hasLicenseKeyOptimistic();
}

/**
 * Get today's usage count for a feature.
 * @param featureKey - e.g. 'download_playlist' | 'download_4k'
 */
export function getUsageToday(featureKey: string): number {
    const today = getTodayString();
    const usage = readUsage(getStartUsageStorageKey(featureKey));
    return usage.date === today ? usage.count : 0;
}

/**
 * Check if user is allowed to use a feature. Does NOT increment count.
 * @param featureKey - e.g. 'download_playlist' | 'download_4k' | 'download_320kbps'
 */
export function checkLimit(featureKey: string, maxPerDayOverride?: number): {
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
    const usage = readUsage(getStartUsageStorageKey(featureKey));
    const count = usage.date === today ? usage.count : 0;
    const limit = typeof maxPerDayOverride === 'number' && Number.isFinite(maxPerDayOverride)
        ? Math.max(0, Math.floor(maxPerDayOverride))
        : (FEATURE_DAILY_LIMITS[featureKey] ?? MAX_PER_DAY);

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
    const storageKey = getStartUsageStorageKey(featureKey);
    const usage = readUsage(storageKey);
    const count = usage.date === today ? usage.count : 0;
    const limit = FEATURE_DAILY_LIMITS[featureKey] ?? MAX_PER_DAY;
    writeUsage(storageKey, { date: today, count: count + 1 });
    console.log(`[DailyLimit:${featureKey}] recorded (${count + 1}/${limit})`);
}

// ============================================================
// START LIMIT (alias for daily start gate)
// ============================================================

/**
 * Check if user can start this feature in current day.
 */
export function checkStartLimit(featureKey: string, startPerDay: number) {
    return checkLimit(featureKey, startPerDay);
}

/**
 * Record one successful start usage.
 */
export function recordStartUsage(featureKey: string): void {
    recordUsage(featureKey);
}

// ============================================================
// DAILY ITEM QUOTA (separate tracking for per-day item count)
// ============================================================

/**
 * Get consumed item count for a feature in current day.
 */
export function getDailyItemsUsed(featureKey: string): number {
    const today = getTodayString();
    const usage = readUsage(getItemUsageStorageKey(featureKey));
    return usage.date === today ? usage.count : 0;
}

/**
 * Get daily item quota snapshot for a feature.
 */
export function getDailyItemUsage(featureKey: string, maxPerDay: number): {
    usedToday: number;
    maxPerDay: number;
    remainingToday: number;
} {
    const usedToday = getDailyItemsUsed(featureKey);
    const safeMaxPerDay = typeof maxPerDay === 'number' && Number.isFinite(maxPerDay)
        ? Math.max(0, Math.floor(maxPerDay))
        : 0;

    return {
        usedToday,
        maxPerDay: safeMaxPerDay,
        remainingToday: Math.max(0, safeMaxPerDay - usedToday),
    };
}

/**
 * Check if adding N items exceeds daily item quota.
 */
export function checkDailyItemQuota(featureKey: string, maxItemsPerDay: number, incomingItems = 1): {
    allowed: boolean;
    reason?: string;
    requestedItems: number;
    usedToday: number;
    maxPerDay: number;
    remainingToday: number;
} {
    const requestedItems = Number.isFinite(incomingItems)
        ? Math.max(1, Math.floor(incomingItems))
        : 1;

    if (hasLicenseKey()) {
        return {
            allowed: true,
            reason: 'license',
            requestedItems,
            usedToday: 0,
            maxPerDay: 0,
            remainingToday: 0,
        };
    }

    const usage = getDailyItemUsage(featureKey, maxItemsPerDay);
    const allowed = usage.usedToday + requestedItems <= usage.maxPerDay;

    return {
        allowed,
        reason: allowed ? undefined : 'limit_reached',
        requestedItems,
        usedToday: usage.usedToday,
        maxPerDay: usage.maxPerDay,
        remainingToday: usage.remainingToday,
    };
}

/**
 * Record consumed items for a feature in current day.
 */
export function recordDailyItemsUsage(featureKey: string, consumedItems = 1): void {
    if (hasLicenseKey()) return;

    const amount = Number.isFinite(consumedItems)
        ? Math.max(0, Math.floor(consumedItems))
        : 0;

    if (amount <= 0) return;

    const today = getTodayString();
    const storageKey = getItemUsageStorageKey(featureKey);
    const usage = readUsage(storageKey);
    const count = usage.date === today ? usage.count : 0;

    writeUsage(storageKey, { date: today, count: count + amount });
    console.log(`[DailyItemLimit:${featureKey}] recorded (${count + amount})`);
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
