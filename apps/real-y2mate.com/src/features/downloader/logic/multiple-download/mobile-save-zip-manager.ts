/**
 * Mobile Save & ZIP Session Manager (per-group)
 *
 * Manages persistent server-side sessions for mobile batch downloads.
 * Each group gets its own independent session so that "Download ZIP"
 * in one group only includes that group's files.
 *
 * Flow:
 *   Video completes -> route to group session -> saveInit() (first time) -> saveAddFile(taskId, url)
 *   ...more videos complete -> saveAddFile(taskId, url) each time...
 *   User clicks ZIP on group -> saveZip(taskId) -> poll status -> download via direct URL
 */

import { coreServices } from '../../../../api/index.js';
import { videoStore } from '../../state/video-store';
import { isMobileDevice } from '../../../../utils/index.js';
import type { VideoItem } from '../../state/multiple-download-types';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// --- Per-group Session State ---

interface GroupSession {
    taskId: string | null;
    isInitializing: boolean;
    initPromise: Promise<void> | null;
    zipping: boolean;
    frozen: boolean;
    pendingItemIds: Set<string>;
    successItemIds: Set<string>;
    failedItemIds: Set<string>;
    lastZippedItemIds: Set<string>;
    skippedWhileFrozen: Array<{ id: string; url: string; groupId?: string }>;
}

const sessions = new Map<string, GroupSession>();
const DEFAULT_GROUP = '__default__';

let unsubscribe: (() => void) | null = null;

function getSession(groupId?: string): GroupSession {
    const key = groupId || DEFAULT_GROUP;
    if (!sessions.has(key)) {
        sessions.set(key, {
            taskId: null,
            isInitializing: false,
            initPromise: null,
            zipping: false,
            frozen: false,
            pendingItemIds: new Set(),
            successItemIds: new Set(),
            failedItemIds: new Set(),
            lastZippedItemIds: new Set(),
            skippedWhileFrozen: [],
        });
    }
    return sessions.get(key)!;
}

// --- Auto-subscribe on Mobile ---

export function initMobileSaveZipListener(): void {
    if (!isMobileDevice()) return;
    if (unsubscribe) return;

    document.documentElement.classList.add('is-mobile-zip');
    console.log('[MobileSaveZip] Listener started');

    unsubscribe = videoStore.subscribe((eventName, data) => {
        if (eventName === 'item:updated' && data?.status === 'completed' && data?.downloadUrl) {
            onItemCompleted(data.id, data.downloadUrl, data.groupId);
        }
    });
}

export function wasItemAdded(itemId: string, groupId?: string): boolean {
    const s = getSession(groupId);
    return s.successItemIds.has(itemId) || s.lastZippedItemIds.has(itemId);
}

export function isZipping(): boolean {
    for (const s of sessions.values()) {
        if (s.zipping) return true;
    }
    return false;
}

export function getAddedCount(groupId?: string): number {
    const s = getSession(groupId);
    return s.successItemIds.size;
}

export function hasItemsProcessing(groupId?: string): boolean {
    const PROCESSING_STATUSES = new Set(['pending', 'analyzing', 'fetching_metadata', 'queued', 'downloading', 'converting']);
    const items: VideoItem[] = groupId
        ? videoStore.getItemsByGroup(groupId)
        : videoStore.getAllItems().filter(i => !i.groupId);
    const hasStoreProcessing = items.some(i => PROCESSING_STATUSES.has(i.status));
    const s = getSession(groupId);
    return hasStoreProcessing || s.pendingItemIds.size > 0;
}

async function onItemCompleted(itemId: string, downloadUrl: string, groupId?: string): Promise<void> {
    const s = getSession(groupId);

    if (s.frozen) {
        console.log(`[MobileSaveZip] Queued for next batch (frozen): ${itemId} group=${groupId || DEFAULT_GROUP}`);
        s.skippedWhileFrozen.push({ id: itemId, url: downloadUrl, groupId });
        return;
    }
    if (s.successItemIds.has(itemId) || s.pendingItemIds.has(itemId)) return;
    s.failedItemIds.delete(itemId);
    s.pendingItemIds.add(itemId);
    updateZipButtonCount(groupId);

    if (!s.taskId && !s.isInitializing) {
        s.isInitializing = true;
        console.log(`[MobileSaveZip] Init session for group=${groupId || DEFAULT_GROUP}...`);
        s.initPromise = ensureSession(s);
        try {
            await s.initPromise;
        } finally {
            s.isInitializing = false;
        }
        console.log(`[MobileSaveZip] Init done, group=${groupId || DEFAULT_GROUP}, taskId = ${s.taskId}`);
    }

    if (s.isInitializing && s.initPromise) {
        await s.initPromise;
    }

    if (!s.taskId) {
        console.error(`[MobileSaveZip] No taskId after init for group=${groupId || DEFAULT_GROUP}, cannot add file`);
        s.pendingItemIds.delete(itemId);
        s.failedItemIds.add(itemId);
        updateZipButtonCount(groupId);
        return;
    }

    try {
        console.log(`[MobileSaveZip] Adding file: ${itemId} to group=${groupId || DEFAULT_GROUP}`);
        const result = await coreServices.saveZip!.saveAddFile({ taskId: s.taskId, url: downloadUrl });
        s.pendingItemIds.delete(itemId);
        if (result.success) {
            s.successItemIds.add(itemId);
            console.log(`[MobileSaveZip] Added OK: ${itemId}, group=${groupId || DEFAULT_GROUP}, total added = ${s.successItemIds.size}`);
        } else {
            console.warn('[MobileSaveZip] Failed to add file:', itemId, result.error);
            s.failedItemIds.add(itemId);
        }
    } catch (err) {
        s.pendingItemIds.delete(itemId);
        console.warn('[MobileSaveZip] Failed to add file:', itemId, err);
        s.failedItemIds.add(itemId);
    }
    updateZipButtonCount(groupId);
}

async function ensureSession(s: GroupSession): Promise<void> {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const result = await coreServices.saveZip!.saveInit();
            if (result.success && result.taskId) {
                s.taskId = result.taskId;
                return;
            }
            console.error(`[MobileSaveZip] Init failed (attempt ${attempt}/3):`, result.error);
        } catch (err) {
            console.error(`[MobileSaveZip] Init error (attempt ${attempt}/3):`, err);
        }
        if (attempt < 3) await sleep(1000 * attempt);
    }
}

// --- ZIP Download (called when user clicks button) ---

export async function mobileSaveZipDownload(
    _urls: string[],
    btn: HTMLElement | null,
    _skipGlobalError = false,
    groupId?: string,
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    const s = getSession(groupId);
    console.log(`[MobileSaveZip] ZIP requested, group=${groupId || DEFAULT_GROUP}, success=${s.successItemIds.size}, pending=${s.pendingItemIds.size}, failed=${s.failedItemIds.size}, taskId=${s.taskId}`);

    if (s.failedItemIds.size > 0) {
        console.log(`[MobileSaveZip] Retrying ${s.failedItemIds.size} failed items...`);
        updateBtn(btn, 'Retrying uploads...');

        if (!s.taskId && !s.isInitializing) {
            s.isInitializing = true;
            s.initPromise = ensureSession(s);
            try { await s.initPromise; } finally { s.isInitializing = false; }
        }

        const failedIds = [...s.failedItemIds];
        for (const failedId of failedIds) {
            const item = videoStore.getItem(failedId);
            if (item?.status === 'completed' && item.downloadUrl) {
                s.failedItemIds.delete(failedId);
                onItemCompleted(failedId, item.downloadUrl, groupId);
            } else {
                s.failedItemIds.delete(failedId);
            }
        }
        await sleep(3000);
    }

    if (s.successItemIds.size === 0 && s.failedItemIds.size === 0 && s.pendingItemIds.size === 0) {
        console.log('[MobileSaveZip] No tracked items, scanning store for completed items...');
        const items: VideoItem[] = groupId
            ? videoStore.getItemsByGroup(groupId)
            : videoStore.getAllItems().filter(i => !i.groupId);
        const completedItems = items.filter(i =>
            i.status === 'completed' && i.downloadUrl && !s.lastZippedItemIds.has(i.id)
        );
        if (completedItems.length > 0) {
            updateBtn(btn, 'Uploading files...');
            for (const item of completedItems) {
                onItemCompleted(item.id, item.downloadUrl!, groupId);
            }
            await sleep(3000);
        }
    }

    if (s.pendingItemIds.size > 0) {
        console.log(`[MobileSaveZip] Waiting for ${s.pendingItemIds.size} pending uploads...`);
        updateBtn(btn, 'Uploading files...');
        const maxWait = 30000;
        const start = Date.now();
        while (s.pendingItemIds.size > 0 && Date.now() - start < maxWait) {
            await sleep(500);
        }
    }

    if (s.successItemIds.size === 0) {
        return { success: false, error: 'No files uploaded yet. Please wait for items to finish processing.' };
    }

    const timestamp = Date.now();
    const zipName = `real_y2mate_com_${timestamp}.zip`;

    if (btn) {
        (btn as HTMLButtonElement).disabled = true;
    }

    try {
        s.zipping = true;
        s.frozen = true;
        s.lastZippedItemIds = new Set(s.successItemIds);
        console.log(`[MobileSaveZip] Snapshot lastZippedItemIds size = ${s.lastZippedItemIds.size}`);

        updateBtn(btn, 'Creating ZIP...');
        await coreServices.saveZip!.saveZip({ taskId: s.taskId!, zipName });

        const statusResult = await pollUntilDone(s.taskId!, btn);

        if (statusResult.status === 'done' && statusResult.zipUrl) {
            updateBtn(btn, 'Downloading...');
            window.location.href = statusResult.zipUrl;

            for (const itemId of s.lastZippedItemIds) {
                videoStore.removeItem(itemId);
            }

            resetSession(groupId);

            s.zipping = false;
            if (btn) (btn as HTMLButtonElement).disabled = false;
            updateZipButtonCount(groupId);

            console.log(`[MobileSaveZip] ZIP success for group=${groupId || DEFAULT_GROUP}, lastZippedItemIds size = ${s.lastZippedItemIds.size}`);
            return { success: true, downloadUrl: statusResult.zipUrl };
        } else {
            throw new Error(statusResult.error || 'ZIP creation failed');
        }
    } catch (error: any) {
        const errorMsg = error.message || 'Failed to create ZIP file';
        return { success: false, error: errorMsg };
    } finally {
        s.zipping = false;
        if (btn) (btn as HTMLButtonElement).disabled = false;
    }
}

// --- Helpers ---

const ANIMATED_DOTS = '<span class="automation-dots"><span>.</span><span>.</span><span>.</span></span>';

function updateBtn(btn: HTMLElement | null, text: string): void {
    if (!btn) return;
    const textEl = btn.querySelector('.zip-btn-text');
    const target = textEl || btn;
    if (text.endsWith('...')) {
        target.innerHTML = text.slice(0, -3) + ANIMATED_DOTS;
    } else {
        target.textContent = text;
    }
}

function updateZipButtonCount(groupId?: string): void {
    if (groupId) {
        const s = getSession(groupId);
        if (s.zipping) return;
        const count = s.successItemIds.size;

        const groupEl = document.querySelector(`.playlist-group[data-group-id="${groupId}"]`);
        if (groupEl) {
            const btn = groupEl.querySelector('[data-action="download-zip-group"]');
            if (btn) {
                const textEl = btn.querySelector('.zip-btn-text');
                const processing = hasItemsProcessing(groupId);
                if (textEl) {
                    if (processing) {
                        textEl.innerHTML = `Download ZIP (${count})${ANIMATED_DOTS}`;
                    } else {
                        textEl.textContent = `Download ZIP (${count})`;
                    }
                }
                btn.classList.remove('is-disabled');
                btn.setAttribute('aria-disabled', 'false');
                btn.removeAttribute('data-tooltip');
                (btn as HTMLButtonElement).disabled = false;
            }
        }
    }

    updateHeaderZipButton();
}

export function updateHeaderZipButton(): void {
    for (const s of sessions.values()) {
        if (s.zipping) return;
    }

    let totalCount = 0;
    for (const s of sessions.values()) {
        totalCount += s.successItemIds.size;
    }
    const anyProcessing = hasItemsProcessing();

    const headerBtn = document.querySelector('#multiDownloadActionBtn');
    if (headerBtn) {
        const textEl = headerBtn.querySelector('.zip-btn-text');
        if (textEl) {
            if (anyProcessing) {
                textEl.innerHTML = `Download ZIP (${totalCount})${ANIMATED_DOTS}`;
            } else {
                textEl.textContent = `Download ZIP (${totalCount})`;
            }
        }
        (headerBtn as HTMLButtonElement).disabled = false;
        headerBtn.classList.remove('is-disabled');
        headerBtn.setAttribute('aria-disabled', 'false');
        headerBtn.removeAttribute('data-tooltip');
    }
}

function resetSession(groupId?: string): void {
    const s = getSession(groupId);
    console.log(`[MobileSaveZip] Reset session for group=${groupId || DEFAULT_GROUP}`);
    s.taskId = null;
    s.frozen = false;
    s.pendingItemIds.clear();
    s.successItemIds.clear();
    s.failedItemIds.clear();

    updateZipButtonCount(groupId);

    const itemsToRetry: Array<{ id: string; url: string; groupId?: string }> = [...s.skippedWhileFrozen];
    s.skippedWhileFrozen.length = 0;

    const groupItems: VideoItem[] = groupId
        ? videoStore.getItemsByGroup(groupId)
        : videoStore.getAllItems().filter(i => !i.groupId);
    for (const item of groupItems) {
        if (item.status === 'completed' && item.downloadUrl && !s.lastZippedItemIds.has(item.id)) {
            const alreadyQueued = itemsToRetry.some(q => q.id === item.id);
            if (!alreadyQueued) {
                itemsToRetry.push({ id: item.id, url: item.downloadUrl, groupId });
            }
        }
    }

    if (itemsToRetry.length > 0) {
        console.log(`[MobileSaveZip] Re-adding ${itemsToRetry.length} items to new session for group=${groupId || DEFAULT_GROUP}`);
        for (const { id, url, groupId: gId } of itemsToRetry) {
            onItemCompleted(id, url, gId);
        }
    }
}

async function pollUntilDone(
    pollTaskId: string,
    btn: HTMLElement | null,
): Promise<{ status: string; zipUrl?: string; error?: string }> {
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
        await sleep(POLL_INTERVAL_MS);
        const result = await coreServices.saveZip!.saveStatus(pollTaskId);

        if (result.status === 'done') return { status: 'done', zipUrl: result.zipUrl! };
        if (result.status === 'failed') throw new Error(result.error || 'ZIP creation failed on server');

        const { downloaded, total, status } = result;
        if (total > 0) {
            updateBtn(btn, status === 'zipping'
                ? `Zipping ${downloaded}/${total}...`
                : `Downloading ${downloaded}/${total}...`);
        } else if (status === 'zipping') {
            updateBtn(btn, 'Zipping files...');
        }
    }

    throw new Error('ZIP creation timed out');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
