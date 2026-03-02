import { FEATURE_ACCESS_REASONS } from '@downloader/core';
import { hasStoredLicenseKey } from './license-selector';

const DB_NAME = 'ezconv-supporter';
const DB_VERSION = 1;
const STORE_NAME = 'successful_converts';
const MAX_STORED_LOGS = 100;

export const BULK_DOWNLOAD_LIMIT = 10;
export const DAILY_BULK_DOWNLOAD_LIMIT = 20;
export const DAILY_PLAYLIST_DOWNLOAD_LIMIT = 5;
export const DAILY_CHANNEL_DOWNLOAD_LIMIT = 5;
export const DAILY_TRIM_DOWNLOAD_LIMIT = 20;

const DAILY_COUNTER_KEY_BY_MODE: Record<LimitedDailyMode | 'single' | 'trim', string> = {
    batch: 'ezconv:download_batch_daily',
    playlist: 'ezconv:download_playlist_daily',
    channel: 'ezconv:download_channel_daily',
    trim: 'ezconv:download_trim_daily',
    single: 'ezconv:download_single_daily'
};

const MEMORY_FALLBACK_LOGS: DownloadLogRecord[] = [];

export type DownloadMethod = 'single' | 'batch' | 'playlist' | 'channel' | 'trim' | 'unknown';
export type SupporterLevel = 1 | 2 | 3;
export type LimitedDailyMode = 'batch' | 'playlist' | 'channel' | 'trim';
export type LimitType = 'daily_mode_limit' | 'bulk_video_count';

export interface DownloadLogRecord {
    id?: number;
    type: 'success' | 'error';
    method: string;
    url: string;
    status: 'success' | 'error';
    timestamp: number;
    endpoint?: string;
    pageUrl?: string;
    requestData?: unknown;
    errorData?: unknown;
    userAgent?: string;
}

export interface DownloadErrorLogPayload {
    method: string;
    url: string;
    endpoint?: string;
    requestData?: unknown;
    errorData?: unknown;
    timestamp?: number;
}

interface DailyCounterRecord {
    date: string;
    count: number;
}

export interface LimitCheckContext {
    kind: 'single' | 'batch' | 'playlist' | 'channel' | 'trim';
    itemCount?: number;
    now?: number;
}

export interface LimitCheckResult {
    allowed: boolean;
    type: LimitType | null;
    mode: LimitedDailyMode | null;
    reason: string | null;
    limit: number | null;
    currentCount: number | null;
    resetAt: number | null;
    remainingSeconds: number | null;
}

export interface SupporterUsageSummary {
    hasLicense: boolean;
    totalSuccessfulDownloads: number;
    playlistDownloadsToday: number;
    channelDownloadsToday: number;
    batchDownloadsToday: number;
    trimDownloadsToday: number;
    level: SupporterLevel;
}

const DAILY_LIMITS_BY_MODE: Record<LimitedDailyMode, number> = {
    batch: DAILY_BULK_DOWNLOAD_LIMIT,
    playlist: DAILY_PLAYLIST_DOWNLOAD_LIMIT,
    channel: DAILY_CHANNEL_DOWNLOAD_LIMIT,
    trim: DAILY_TRIM_DOWNLOAD_LIMIT
};

function openDatabase(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') {
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (db.objectStoreNames.contains(STORE_NAME)) return;

            const store = db.createObjectStore(STORE_NAME, {
                keyPath: 'id',
                autoIncrement: true
            });

            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('method', 'method', { unique: false });
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
    });
}

async function getAllLogs(): Promise<DownloadLogRecord[]> {
    const db = await openDatabase();
    if (!db) {
        return [...MEMORY_FALLBACK_LOGS];
    }

    return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const records = Array.isArray(request.result) ? request.result : [];
            resolve(records as DownloadLogRecord[]);
        };
        request.onerror = () => resolve([]);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => db.close();
        transaction.onabort = () => db.close();
    });
}

async function pruneStoredLogs(): Promise<void> {
    const db = await openDatabase();
    if (!db) {
        if (MEMORY_FALLBACK_LOGS.length > MAX_STORED_LOGS) {
            MEMORY_FALLBACK_LOGS.splice(0, MEMORY_FALLBACK_LOGS.length - MAX_STORED_LOGS);
        }
        return;
    }

    await new Promise<void>((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const records = (Array.isArray(request.result) ? request.result : []) as DownloadLogRecord[];
            const sortedRecords = records
                .filter((entry) => typeof entry?.id === 'number')
                .sort((a, b) => (a.timestamp - b.timestamp) || ((a.id ?? 0) - (b.id ?? 0)));

            const overflow = sortedRecords.length - MAX_STORED_LOGS;
            if (overflow <= 0) {
                resolve();
                return;
            }

            for (let index = 0; index < overflow; index += 1) {
                const id = sortedRecords[index]?.id;
                if (typeof id === 'number') {
                    store.delete(id);
                }
            }
        };

        request.onerror = () => resolve();
        transaction.oncomplete = () => {
            db.close();
            resolve();
        };
        transaction.onerror = () => {
            db.close();
            resolve();
        };
        transaction.onabort = () => {
            db.close();
            resolve();
        };
    });
}

function getStartOfDay(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

function getLocalDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function readDailyCounter(mode: LimitedDailyMode, now = Date.now()): DailyCounterRecord {
    const today = getLocalDateKey(now);
    const storageKey = DAILY_COUNTER_KEY_BY_MODE[mode];

    if (typeof localStorage === 'undefined') {
        return { date: today, count: 0 };
    }

    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
            return { date: today, count: 0 };
        }

        const parsed = JSON.parse(raw) as Partial<DailyCounterRecord> | null;
        if (!parsed || typeof parsed.date !== 'string' || typeof parsed.count !== 'number') {
            return { date: today, count: 0 };
        }

        if (parsed.date !== today) {
            return { date: today, count: 0 };
        }

        return {
            date: parsed.date,
            count: Math.max(0, Math.floor(parsed.count))
        };
    } catch {
        return { date: today, count: 0 };
    }
}

function writeDailyCounter(mode: LimitedDailyMode, counter: DailyCounterRecord): void {
    if (typeof localStorage === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(DAILY_COUNTER_KEY_BY_MODE[mode], JSON.stringify(counter));
    } catch {
        // localStorage unavailable
    }
}

function incrementDailyCounter(mode: LimitedDailyMode, now = Date.now()): DailyCounterRecord {
    const current = readDailyCounter(mode, now);
    const next = {
        date: current.date,
        count: current.count + 1
    };

    writeDailyCounter(mode, next);
    return next;
}

export function getMillisecondsUntilNextMidnight(now = Date.now()): number {
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    return Math.max(0, nextMidnight.getTime() - now);
}

export function getSecondsUntilNextMidnight(now = Date.now()): number {
    return Math.ceil(getMillisecondsUntilNextMidnight(now) / 1000);
}

export function getLevelFromDownloadCount(count: number): SupporterLevel {
    if (count <= 1) return 1;
    if (count <= 6) return 2;
    return 3;
}

export async function getTotalSuccessfulDownloads(): Promise<number> {
    const logs = await getAllLogs();
    return logs.filter((entry) => entry.type === 'success' && entry.status === 'success').length;
}

export async function getDownloadsTodayByMethod(
    method: LimitedDailyMode,
    now = Date.now()
): Promise<number> {
    return readDailyCounter(method, now).count;
}

export async function getSupporterUsageSummary(now = Date.now()): Promise<SupporterUsageSummary> {
    const [totalSuccessfulDownloads, playlistDownloadsToday, channelDownloadsToday, batchDownloadsToday, trimDownloadsToday] = await Promise.all([
        getTotalSuccessfulDownloads(),
        getDownloadsTodayByMethod('playlist', now),
        getDownloadsTodayByMethod('channel', now),
        getDownloadsTodayByMethod('batch', now),
        getDownloadsTodayByMethod('trim', now)
    ]);

    const hasLicense = hasStoredLicenseKey();

    return {
        hasLicense,
        totalSuccessfulDownloads,
        playlistDownloadsToday,
        channelDownloadsToday,
        batchDownloadsToday,
        trimDownloadsToday,
        level: getLevelFromDownloadCount(totalSuccessfulDownloads)
    };
}

export async function recordSuccessfulConvert(
    method: DownloadMethod,
    url: string,
    timestamp = Date.now()
): Promise<DownloadLogRecord> {
    const record: DownloadLogRecord = {
        type: 'success',
        method,
        url,
        status: 'success',
        timestamp,
        pageUrl: getCurrentPageUrl(),
        userAgent: getCurrentUserAgent()
    };

    if (method in DAILY_COUNTER_KEY_BY_MODE) {
        incrementDailyCounter(method as LimitedDailyMode, timestamp);
    }

    const db = await openDatabase();
    if (!db) {
        MEMORY_FALLBACK_LOGS.push(record);
        if (MEMORY_FALLBACK_LOGS.length > MAX_STORED_LOGS) {
            MEMORY_FALLBACK_LOGS.splice(0, MEMORY_FALLBACK_LOGS.length - MAX_STORED_LOGS);
        }
        return record;
    }

    await new Promise<void>((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(record);

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => db.close();
        transaction.onabort = () => db.close();
    });

    await pruneStoredLogs();
    return record;
}

export async function recordDownloadError(payload: DownloadErrorLogPayload): Promise<DownloadLogRecord> {
    const record: DownloadLogRecord = {
        type: 'error',
        method: payload.method,
        url: payload.url,
        status: 'error',
        timestamp: payload.timestamp ?? Date.now(),
        endpoint: payload.endpoint,
        pageUrl: getCurrentPageUrl(),
        requestData: payload.requestData,
        errorData: payload.errorData,
        userAgent: getCurrentUserAgent()
    };

    const db = await openDatabase();
    if (!db) {
        MEMORY_FALLBACK_LOGS.push(record);
        if (MEMORY_FALLBACK_LOGS.length > MAX_STORED_LOGS) {
            MEMORY_FALLBACK_LOGS.splice(0, MEMORY_FALLBACK_LOGS.length - MAX_STORED_LOGS);
        }
        return record;
    }

    await new Promise<void>((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(record);

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => db.close();
        transaction.onabort = () => db.close();
    });

    await pruneStoredLogs();
    return record;
}

export async function checkLimit(context: LimitCheckContext): Promise<LimitCheckResult> {
    if (hasStoredLicenseKey()) {
        return {
            allowed: true,
            type: null,
            mode: null,
            reason: null,
            limit: null,
            currentCount: null,
            resetAt: null,
            remainingSeconds: null
        };
    }

    const now = context.now ?? Date.now();

    // 1. Check Bulk Video Count Limit (Max videos per paste)
    if (context.kind === 'batch' && typeof context.itemCount === 'number') {
        if (context.itemCount > BULK_DOWNLOAD_LIMIT) {
            return {
                allowed: false,
                type: 'bulk_video_count',
                mode: 'batch',
                reason: FEATURE_ACCESS_REASONS.VIDEO_LIMIT_EXCEEDED,
                limit: BULK_DOWNLOAD_LIMIT,
                currentCount: context.itemCount,
                resetAt: null,
                remainingSeconds: null
            };
        }
    }

    // 2. Check Daily Limits
    if (context.kind in DAILY_LIMITS_BY_MODE) {
        const mode = context.kind as LimitedDailyMode;
        const modeLimit = DAILY_LIMITS_BY_MODE[mode];
        const currentCount = await getDownloadsTodayByMethod(mode, now);
        if (currentCount >= modeLimit) {
            const remainingMs = getMillisecondsUntilNextMidnight(now);

            return {
                allowed: false,
                type: 'daily_mode_limit',
                mode,
                reason: FEATURE_ACCESS_REASONS.DAILY_LIMIT_REACHED,
                limit: modeLimit,
                currentCount,
                resetAt: now + remainingMs,
                remainingSeconds: Math.ceil(remainingMs / 1000)
            };
        }
    }

    return {
        allowed: true,
        type: null,
        mode: null,
        reason: null,
        limit: null,
        currentCount: null,
        resetAt: null,
        remainingSeconds: null
    };
}

function getCurrentPageUrl(): string {
    if (typeof window === 'undefined' || !window.location) {
        return '';
    }

    return window.location.href;
}

function getCurrentUserAgent(): string {
    if (typeof navigator === 'undefined') {
        return '';
    }

    return navigator.userAgent || '';
}
