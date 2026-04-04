/**
 * Mobile Save & ZIP Session Manager (per-group)
 *
 * Manages persistent server-side sessions for mobile batch downloads.
 * Each group gets its own independent session so that "Download ZIP"
 * in one group only includes that group's files.
 *
 * Flow:
 *   Video completes → route to group session → saveInit() (first time) → saveAddFile(taskId, url)
 *   ...more videos complete → saveAddFile(taskId, url) each time...
 *   User clicks ZIP on group → saveZip(taskId) → poll status → download via direct URL
 *
 * Applied to ALL mobile devices (Android + iOS), not just iOS.
 */

import { coreServices } from '../../../../api/index.js';
import { videoStore } from '../../state/video-store';
import { isMobileDevice } from '../../../../utils/index.js';
import type { VideoItem } from '../../state/multiple-download-types';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ─── Per-group Session State ────────────────────────────────

interface GroupSession {
    taskId: string | null;
    isInitializing: boolean;
    initPromise: Promise<void> | null;
    zipping: boolean;
    frozen: boolean;
    pendingItemIds: Set<string>;
    successItemIds: Set<string>;
    failedItemIds: Set<string>; // Items that failed saveAddFile (for retry)
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

// ─── Auto-subscribe on Mobile ───────────────────────────────

/**
 * Start listening for completed items. Call once on page load (mobile only).
 */
export function initMobileSaveZipListener(): void {
    if (!isMobileDevice()) return;
    if (unsubscribe) return; // already listening

    document.documentElement.classList.add('is-mobile-zip');
    console.log('[MobileSaveZip] Listener started');

    unsubscribe = videoStore.subscribe((eventName, data) => {
        if (eventName === 'item:updated' && data?.status === 'completed' && data?.downloadUrl) {
            onItemCompleted(data.id, data.downloadUrl, data.groupId);
        }
    });
}

/**
 * Check if an item was successfully added to its group's server session.
 */
export function wasItemAdded(itemId: string, groupId?: string): boolean {
    const s = getSession(groupId);
    return s.successItemIds.has(itemId) || s.lastZippedItemIds.has(itemId);
}

/**
 * Whether a ZIP operation is currently in progress for any group.
 */
export function isZipping(): boolean {
    for (const s of sessions.values()) {
        if (s.zipping) return true;
    }
    return false;
}

/**
 * Number of items successfully added to a group's server session.
 */
export function getAddedCount(groupId?: string): number {
    const s = getSession(groupId);
    return s.successItemIds.size;
}

/**
 * Whether there are still items being processed (converting, downloading, uploading, etc.).
 * Dots show from first processing item until ALL items are done (completed/error/cancelled/ready).
 */
export function hasItemsProcessing(groupId?: string): boolean {
    const PROCESSING_STATUSES = new Set(['pending', 'analyzing', 'fetching_metadata', 'queued', 'downloading', 'converting']);
    const items: VideoItem[] = groupId
        ? videoStore.getItemsByGroup(groupId)
        : videoStore.getAllItems().filter(i => !i.groupId);
    const hasStoreProcessing = items.some(i => PROCESSING_STATUSES.has(i.status));
    // Also check pending API uploads (saveAddFile in progress)
    const s = getSession(groupId);
    return hasStoreProcessing || s.pendingItemIds.size > 0;
}

/**
 * Called when an item transitions to 'completed' with a downloadUrl.
 */
async function onItemCompleted(itemId: string, downloadUrl: string, groupId?: string): Promise<void> {
    const s = getSession(groupId);

    if (s.frozen) {
        console.log(`[MobileSaveZip] Queued for next batch (frozen): ${itemId} group=${groupId || DEFAULT_GROUP}`);
        s.skippedWhileFrozen.push({ id: itemId, url: downloadUrl, groupId });
        return;
    }
    if (s.successItemIds.has(itemId) || s.pendingItemIds.has(itemId)) return;
    s.failedItemIds.delete(itemId); // Clear previous failure if retrying
    s.pendingItemIds.add(itemId);
    // Optimistic: update button count immediately (includes pending)
    updateZipButtonCount(groupId);

    // If no session yet, init first
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

    // If init is in progress (another item triggered it), wait
    if (s.isInitializing && s.initPromise) {
        await s.initPromise;
    }

    if (!s.taskId) {
        console.error(`[MobileSaveZip] No taskId after init for group=${groupId || DEFAULT_GROUP}, cannot add file`);
        s.pendingItemIds.delete(itemId);
        s.failedItemIds.add(itemId); // Track so retry can pick it up
        updateZipButtonCount(groupId);
        return;
    }

    // Add file to server
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
    // Retry init up to 3 times (iOS Safari drops requests when backgrounded)
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
        if (attempt < 3) await sleep(1000 * attempt); // backoff: 1s, 2s
    }
}

// ─── ZIP Download (called when user clicks button) ───────────

/**
 * Trigger ZIP creation + poll + download for a specific group.
 *
 * @param _urls - Not used (kept for API compat with desktop flow)
 * @param btn - Button element for status text updates
 * @param skipGlobalError - Whether to suppress global error messages
 * @param groupId - Group to zip (undefined = default/batch group)
 * @returns Result with success status and optional download URL
 */
export async function mobileSaveZipDownload(
    _urls: string[],
    btn: HTMLElement | null,
    _skipGlobalError = false,
    groupId?: string,
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    const s = getSession(groupId);
    console.log(`[MobileSaveZip] ZIP requested, group=${groupId || DEFAULT_GROUP}, success=${s.successItemIds.size}, pending=${s.pendingItemIds.size}, failed=${s.failedItemIds.size}, taskId=${s.taskId}`);

    // Retry failed items before giving up
    if (s.failedItemIds.size > 0) {
        console.log(`[MobileSaveZip] Retrying ${s.failedItemIds.size} failed items...`);
        updateBtn(btn, 'Retrying uploads...');

        // If session init failed previously, re-init
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
        // Wait for retries to complete
        await sleep(3000);
    }

    // Also pick up any completed items not tracked at all (edge case: init failed on first attempt)
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
            // Wait for uploads
            await sleep(3000);
        }
    }

    // Wait for any pending uploads to finish
    if (s.pendingItemIds.size > 0) {
        console.log(`[MobileSaveZip] Waiting for ${s.pendingItemIds.size} pending uploads...`);
        updateBtn(btn, 'Uploading files...');
        const maxWait = 30000; // 30 seconds max
        const start = Date.now();
        while (s.pendingItemIds.size > 0 && Date.now() - start < maxWait) {
            await sleep(500);
        }
    }

    if (s.successItemIds.size === 0) {
        return { success: false, error: 'No files uploaded yet. Please wait for items to finish processing.' };
    }

    const timestamp = Date.now();
    const zipName = `u2snap_com_${timestamp}.zip`;

    if (btn) {
        (btn as HTMLButtonElement).disabled = true;
    }

    try {
        // Lock UI and freeze session — no more adds to this task
        s.zipping = true;
        s.frozen = true;

        // Snapshot success IDs before reset
        s.lastZippedItemIds = new Set(s.successItemIds);
        console.log(`[MobileSaveZip] Snapshot lastZippedItemIds size = ${s.lastZippedItemIds.size}`);

        // Request ZIP creation
        updateBtn(btn, 'Creating ZIP...');
        await coreServices.saveZip!.saveZip({ taskId: s.taskId!, zipName });

        // Poll until done
        const statusResult = await pollUntilDone(s.taskId!, btn);

        if (statusResult.status === 'done' && statusResult.zipUrl) {
            updateBtn(btn, 'Downloading...');
            window.location.href = statusResult.zipUrl;

            // Remove zipped items from store
            for (const itemId of s.lastZippedItemIds) {
                videoStore.removeItem(itemId);
            }

            // Reset session for next batch (lastZippedItemIds survives)
            resetSession(groupId);

            // Restore button immediately after triggering download
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

// ─── Helpers ─────────────────────────────────────────────────

const ANIMATED_DOTS = '<span class="automation-dots"><span>.</span><span>.</span><span>.</span></span>';

function updateBtn(btn: HTMLElement | null, text: string): void {
    if (!btn) return;
    const textEl = btn.querySelector('.btn-text');
    const target = textEl || btn;
    if (text.endsWith('...')) {
        target.innerHTML = text.slice(0, -3) + ANIMATED_DOTS;
    } else {
        target.textContent = text;
    }
}

/**
 * Update ZIP button(s) to show count of added items for a specific group.
 */
function updateZipButtonCount(groupId?: string): void {
    if (groupId) {
        const s = getSession(groupId);
        if (s.zipping) return;
        const count = s.successItemIds.size;

        const groupEl = document.querySelector(`.playlist-group[data-group-id="${groupId}"]`);
        if (groupEl) {
            const btn = groupEl.querySelector('[data-action="download-zip-group"]');
            if (btn) {
                const textEl = btn.querySelector('.btn-text');
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

    // Always update header button with total count across all groups
    updateHeaderZipButton();
}

/**
 * Update the header-level ZIP button with total count across all groups.
 * Exported so renderer can call after re-rendering batch header.
 */
export function updateHeaderZipButton(): void {
    // Don't update if any group is zipping
    for (const s of sessions.values()) {
        if (s.zipping) return;
    }

    let totalCount = 0;
    for (const s of sessions.values()) {
        totalCount += s.successItemIds.size;
    }
    // Check if any items in store are still processing (across all groups)
    const anyProcessing = hasItemsProcessing();

    const headerBtn = document.querySelector('#multiDownloadActionBtn');
    if (headerBtn) {
        const textEl = headerBtn.querySelector('.btn-text');
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
    // NOTE: lastZippedItemIds is NOT cleared — callers need it after reset

    // Update button to reflect cleared session (count = 0) immediately
    updateZipButtonCount(groupId);

    // Re-add items that were skipped while frozen + any completed items not yet added
    const itemsToRetry: Array<{ id: string; url: string; groupId?: string }> = [...s.skippedWhileFrozen];
    s.skippedWhileFrozen.length = 0;

    // Also scan store for completed items in this group not in lastZippedItemIds
    const groupItems: VideoItem[] = groupId
        ? videoStore.getItemsByGroup(groupId)
        : videoStore.getAllItems().filter(i => !i.groupId); // Batch: only ungrouped items
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

        // Show download progress: "Downloading 9/10..." or "Zipping 9/10..."
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
