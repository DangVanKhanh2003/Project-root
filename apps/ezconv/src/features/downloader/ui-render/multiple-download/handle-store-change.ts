
import { VideoStoreEventName, VideoItem } from '../../state/multiple-download-types';
import { videoStore } from '../../state/video-store';
import { VideoItemRenderer } from './video-item-renderer';
import { RendererStrategy } from './renderer-strategy.interface';
import { isIOS } from '../../../../utils';
import { STORAGE_KEYS } from '../../../../utils/storage-keys';

export interface StoreChangeHandlerConfig {
    listContainer: HTMLElement;
    groupListContainer?: HTMLElement;
    batchListContainer?: HTMLElement;
    controlsContainer?: HTMLElement;
    strategy: RendererStrategy;
    /** Per-item strategy resolver. When provided, takes precedence over `strategy`. */
    getStrategy?: (item: VideoItem) => RendererStrategy;
    onCountsChanged?: () => void;
    getGlobalLockState?: () => boolean;
    getActiveLoadingId?: () => string | null;
}

const CONVERT_TAB_STATUSES = new Set(['pending', 'analyzing', 'fetching_metadata', 'ready', 'cancelled']);
const DOWNLOAD_TAB_STATUSES = new Set(['queued', 'downloading', 'converting', 'completed', 'expired', 'error']);
const SELECTABLE_STATUSES = new Set(['ready', 'expired', 'error', 'cancelled', 'completed']);
const DOWNLOADABLE_STATUSES = new Set(['ready', 'expired', 'error', 'cancelled']);

function isConvertTabStatus(status: string) {
    return CONVERT_TAB_STATUSES.has(status);
}

function isDownloadTabStatus(status: string) {
    return DOWNLOAD_TAB_STATUSES.has(status);
}

// Throttle progress updates to avoid flooding the main thread (O(N) layout shift)
const PROGRESS_THROTTLE_MS = 120;
const lastProgressTime = new Map<string, number>();
const pendingProgressItems = new Map<string, VideoItem>();
const pendingFlushTimers = new Map<string, number>();

// Cache tab padding after first measurement (constant CSS value, never changes)
let cachedTabPadding: number | null = null;
function getTabPadding(tabEl: HTMLElement): number {
    if (cachedTabPadding !== null) return cachedTabPadding;
    const style = window.getComputedStyle(tabEl);
    cachedTabPadding = parseFloat(style.paddingLeft) || 0;
    return cachedTabPadding;
}

export function createStoreChangeHandler(config: StoreChangeHandlerConfig) {
    const { listContainer, onCountsChanged } = config;
    const groupListContainer = config.groupListContainer ?? listContainer;
    const batchListContainer = config.batchListContainer ?? listContainer;
    const resolveStrategy = (item: VideoItem): RendererStrategy =>
        config.getStrategy ? config.getStrategy(item) : config.strategy;
    const getItemElement = (id: string): HTMLElement | null =>
        batchListContainer.querySelector(`.multi-video-item[data-id="${id}"]`) as HTMLElement
        || groupListContainer.querySelector(`.multi-video-item[data-id="${id}"]`) as HTMLElement;
    const getActiveTabForItem = (item: VideoItem): string | undefined => {
        if (!item.groupId) return undefined;
        const groupEl = groupListContainer.querySelector(`[data-group-id="${item.groupId}"]`) as HTMLElement | null;
        if (!groupEl) return 'convert';
        const hasTabs = groupEl.dataset.hasTabs === 'true';
        return hasTabs ? (groupEl.dataset.activeTab || 'convert') : 'all';
    };

    return function handleStoreChange(eventName: VideoStoreEventName, data: any): void {

        switch (eventName) {
            case 'item:added': {
                // data is the full VideoItem
                const item = data as VideoItem;
                const itemStrategy = resolveStrategy(item);

                // Insert into group container if groupId exists
                if (item.groupId) {
                    let groupEl = groupListContainer.querySelector(`[data-group-id="${item.groupId}"]`) as HTMLElement;
                    if (!groupEl) {
                        groupEl = createGroupElement(item.groupId, item.groupTitle || 'Playlist');
                        groupListContainer.prepend(groupEl); // Group add to TOP (newest first)
                    }
                    const el = VideoItemRenderer.createVideoItemElement(item, itemStrategy, {
                        isGlobalLocked: config.getGlobalLockState?.() || false,
                        activeTab: getActiveTabForItem(item)
                    });
                    const groupList = groupEl.querySelector('.group-items');
                    if (groupList) {
                        groupList.appendChild(el);
                    }
                    // afterRender must run AFTER DOM insertion so getComputedStyle works correctly
                    if (itemStrategy.afterRender) {
                        itemStrategy.afterRender(el, item);
                    }
                    const isLocked = config.getGlobalLockState?.() || false;
                    updateGroupCount(groupEl, isLocked, true, item.id);
                } else {
                    const el = VideoItemRenderer.createVideoItemElement(item, itemStrategy, {
                        isGlobalLocked: config.getGlobalLockState?.() || false
                    });
                    batchListContainer.appendChild(el);
                    // afterRender must run AFTER DOM insertion so getComputedStyle works correctly
                    if (itemStrategy.afterRender) {
                        itemStrategy.afterRender(el, item);
                    }
                }

                // Remove empty state if exists
                const emptyEl = listContainer.querySelector('.empty-list');
                if (emptyEl) emptyEl.remove();

                onCountsChanged?.();
                break;
            }

            case 'item:removed': {
                // data is the full VideoItem
                const item = data as VideoItem;
                const el = getItemElement(item.id);
                if (el) el.remove();

                // Update group count if item had a group
                if (item.groupId) {
                    const groupEl = groupListContainer.querySelector(`[data-group-id="${item.groupId}"]`) as HTMLElement;
                    if (groupEl) {
                        const isLocked = config.getGlobalLockState?.() || false;
                        updateGroupCount(groupEl, isLocked);
                        // Remove group if no video items remain
                        const groupItems = groupEl.querySelector('.group-items');
                        const groupMeta = videoStore.getGroupMeta(item.groupId);
                        const isGroupLoading = groupMeta?.isLoading === true;
                        if (groupItems && groupItems.querySelectorAll('.multi-video-item').length === 0 && !isGroupLoading) {
                            groupEl.remove();
                        }
                    }
                }

                // Show empty state if no items
                if (videoStore.getCount() === 0 && !listContainer.querySelector('.playlist-group')) {
                    listContainer.innerHTML = '<div class="empty-list">No videos added yet.</div>';
                }

                onCountsChanged?.();
                break;
            }

            case 'item:updated': {
                // Batch update: only the changed items (from batchSetQueued)
                if (Array.isArray(data)) {
                    const changedItems = data as VideoItem[];
                    const isGlobalLocked = config.getGlobalLockState?.() || false;
                    const activeLoadingId = config.getActiveLoadingId?.() || null;
                    const affectedGroupIds = new Set<string>();

                    for (const item of changedItems) {
                        const el = getItemElement(item.id);
                        if (el) {
                            VideoItemRenderer.updateVideoItemElement(el, item, resolveStrategy(item), {
                                isGlobalLocked,
                                currentDownloadingItemId: activeLoadingId || undefined,
                                activeTab: getActiveTabForItem(item)
                            });
                        }
                        if (item.groupId) affectedGroupIds.add(item.groupId);
                    }

                    // Only update affected groups, not all groups
                    for (const gid of affectedGroupIds) {
                        const groupEl = groupListContainer.querySelector(`[data-group-id="${gid}"]`) as HTMLElement;
                        if (groupEl) updateGroupCount(groupEl, isGlobalLocked);
                    }

                    onCountsChanged?.();
                    return;
                }

                // If data is null/undefined, it means a global UI update (e.g. lock release)
                if (!data) {
                    const items = videoStore.getAllItems();
                    const isGlobalLocked = config.getGlobalLockState?.() || false;
                    const activeLoadingId = config.getActiveLoadingId?.() || null;

                    // Update all individual items
                    for (const item of items) {
                        const el = getItemElement(item.id);
                        if (el) {
                            VideoItemRenderer.updateVideoItemElement(el, item, resolveStrategy(item), {
                                isGlobalLocked,
                                currentDownloadingItemId: activeLoadingId || undefined,
                                activeTab: getActiveTabForItem(item)
                            });
                        }
                    }

                    // Update all group headers
                    const groups = groupListContainer.querySelectorAll('.playlist-group');
                    groups.forEach(group => updateGroupCount(group as HTMLElement, isGlobalLocked));

                    onCountsChanged?.();
                    return;
                }

                // Normal single item update
                const item = data as VideoItem;
                const el = getItemElement(item.id);
                if (!el) return;

                const isGlobalLocked = config.getGlobalLockState?.() || false;
                const activeLoadingId = config.getActiveLoadingId?.() || null;

                VideoItemRenderer.updateVideoItemElement(el, item, resolveStrategy(item), {
                    isGlobalLocked,
                    currentDownloadingItemId: activeLoadingId || undefined,
                    activeTab: getActiveTabForItem(item)
                });

                // Update group count if in a group
                if (item.groupId) {
                    const groupEl = groupListContainer.querySelector(`[data-group-id="${item.groupId}"]`) as HTMLElement;
                    if (groupEl) {
                        updateGroupCount(groupEl, isGlobalLocked, true, item.id);
                    }
                }

                onCountsChanged?.();
                break;
            }
            case 'item:progress': {
                // data is the full VideoItem
                const item = data as VideoItem;

                // Force update if phase changed or reaching terminal progress - otherwise throttle
                const now = Date.now();
                const lastTime = lastProgressTime.get(item.id) || 0;
                const shouldForce = item.progress === 100 || (item.progressPhase && item.progressPhase !== (pendingProgressItems.get(item.id)?.progressPhase));

                if (!shouldForce && (now - lastTime < PROGRESS_THROTTLE_MS)) {
                    pendingProgressItems.set(item.id, item);
                    // Schedule a flush so the last throttled update is never lost
                    if (!pendingFlushTimers.has(item.id)) {
                        pendingFlushTimers.set(item.id, window.setTimeout(() => {
                            pendingFlushTimers.delete(item.id);
                            const pending = pendingProgressItems.get(item.id);
                            if (pending) {
                                pendingProgressItems.delete(item.id);
                                lastProgressTime.set(item.id, Date.now());
                                const pendingEl = getItemElement(item.id);
                                if (pendingEl) {
                                    VideoItemRenderer.updateProgressOnly(pendingEl, pending, resolveStrategy(pending));
                                }
                            }
                        }, PROGRESS_THROTTLE_MS));
                    }
                    return;
                }

                lastProgressTime.set(item.id, now);
                pendingProgressItems.delete(item.id);
                // Clear any pending flush timer since we're updating now
                const existingTimer = pendingFlushTimers.get(item.id);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                    pendingFlushTimers.delete(item.id);
                }

                const el = getItemElement(item.id);
                if (!el) return;

                VideoItemRenderer.updateProgressOnly(el, item, resolveStrategy(item));
                onCountsChanged?.();

                break;
            }

            case 'items:cleared': {
                batchListContainer.innerHTML = '<div class="empty-list">No videos added yet.</div>';
                if (groupListContainer !== batchListContainer) {
                    groupListContainer.innerHTML = '';
                }
                onCountsChanged?.();
                break;
            }

            case 'items:selection-changed': {
                const isLocked = config.getGlobalLockState?.() || false;

                if (typeof data === 'string') {
                    // Group-scoped: only sync checkboxes within this group
                    const groupId = data;
                    const groupEl = groupListContainer.querySelector(`[data-group-id="${groupId}"]`) as HTMLElement;
                    if (groupEl) {
                        const itemsMap = new Map(videoStore.getItemsByGroup(groupId).map(i => [i.id, i]));
                        groupEl.querySelectorAll<HTMLInputElement>('.item-checkbox').forEach(cb => {
                            const item = itemsMap.get(cb.dataset.id!);
                            if (item) cb.checked = item.isSelected;
                        });
                        updateGroupCount(groupEl, isLocked);
                    }
                    onCountsChanged?.();
                    break;
                }

                if (data) {
                    // Single item toggled (from toggleSelect) — only update that checkbox + its group
                    const item = data as VideoItem;
                    const checkbox = (batchListContainer.querySelector(`.item-checkbox[data-id="${item.id}"]`)
                        || groupListContainer.querySelector(`.item-checkbox[data-id="${item.id}"]`)) as HTMLInputElement;
                    if (checkbox) checkbox.checked = item.isSelected;

                    if (item.groupId) {
                        const groupEl = groupListContainer.querySelector(`[data-group-id="${item.groupId}"]`) as HTMLElement;
                        if (groupEl) updateGroupCount(groupEl, isLocked);
                    }
                } else {
                    // Bulk selection changed — sync all checkboxes in one pass
                    const itemsMap = new Map(videoStore.getAllItems().map(i => [i.id, i]));
                    const allCheckboxes = [
                        ...batchListContainer.querySelectorAll<HTMLInputElement>('.item-checkbox'),
                        ...groupListContainer.querySelectorAll<HTMLInputElement>('.item-checkbox')
                    ];
                    allCheckboxes.forEach(checkbox => {
                        const id = checkbox.dataset.id;
                        if (id) {
                            const item = itemsMap.get(id);
                            if (item) checkbox.checked = item.isSelected;
                        }
                    });

                    const groups = groupListContainer.querySelectorAll('.playlist-group');
                    groups.forEach(group => updateGroupCount(group as HTMLElement, isLocked));
                }

                onCountsChanged?.();
                break;
            }

            case 'items:settings-changed': {
                // Re-render settings area of each item
                const items = videoStore.getAllItems();
                for (const item of items) {
                    const el = getItemElement(item.id);
                    if (!el) continue;

                    const s = resolveStrategy(item);
                    const settingsEl = el.querySelector('.item-settings') as HTMLElement;
                    if (settingsEl) {
                        settingsEl.innerHTML = s.buildSettingsContent(item);
                        settingsEl.className = 'item-settings' + s.getSettingsClass(item);
                    }
                }
                break;
            }

            case 'group:updated': {
                const { groupId } = data as { groupId: string };
                const groupEl = groupListContainer.querySelector(`[data-group-id="${groupId}"]`) as HTMLElement;
                if (groupEl) {
                    const isLocked = config.getGlobalLockState?.() || false;
                    updateGroupCount(groupEl, isLocked);
                }
                break;
            }
        }
    };
}

function createGroupElement(groupId: string, groupTitle: string): HTMLElement {
    const hasTabs = groupTitle === 'Playlist' || groupTitle === 'Channel';
    const el = document.createElement('div');
    el.className = 'playlist-group';
    el.dataset.groupId = groupId;
    el.dataset.hasTabs = hasTabs ? 'true' : 'false';
    if (hasTabs) {
        el.dataset.activeTab = 'convert';
    }
    el.innerHTML = `
        <div class="group-header">
            <div class="group-header-top-row">
                <div class="group-header-title-area" data-action="toggle-group" data-group-id="${groupId}">
                    <p class="group-title"><span class="group-name">${groupTitle}</span></p>
                </div>
                ${hasTabs ? `
                    <div class="playlist-header-tabs">
                        <div class="tab-glider"></div>
                        <button type="button" class="playlist-tab active" data-action="playlist-tab" data-tab="convert" data-group-id="${groupId}">Convert <span class="tab-suffix">Tab</span> <span class="tab-count">(0)</span></button>
                        <button type="button" class="playlist-tab" data-action="playlist-tab" data-tab="download" data-group-id="${groupId}">Download <span class="tab-suffix">Tab</span> <span class="tab-count">(0)</span></button>
                        <div class="tab-hand-guide" style="display: none;" aria-hidden="true">
                            <img src="/hand-click.gif" alt="" width="48" height="48">
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="group-header-bottom-row">
                <label class="group-selection-label">
                    <input type="checkbox" class="group-checkbox" data-group-id="${groupId}" checked>
                    <span class="group-selection-text">0 selected</span>
                </label>
                <div class="group-actions">
                    ${hasTabs ? `<button class="btn-playlist-group-action is-disabled" aria-disabled="true" data-tooltip="Select items to convert" data-action="download-group" data-group-id="${groupId}">Convert selected (0)</button>` : ''}
                    <button class="btn-playlist-group-action btn-success is-disabled" aria-disabled="true" data-tooltip="Select items to download" data-action="download-zip-group" data-group-id="${groupId}" ${hasTabs ? 'style="display: none;"' : ''}>
                    <svg class="btn-icon-zip" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550.801 550.801" aria-hidden="true" width="16" height="16" style="margin-right: 8px; vertical-align: middle;">
                        <path fill="currentColor" d="M475.095,131.992c-0.032-2.526-0.833-5.021-2.568-6.993L366.324,3.694c-0.021-0.034-0.053-0.045-0.084-0.076c-0.633-0.707-1.36-1.29-2.141-1.804c-0.232-0.15-0.465-0.285-0.707-0.422c-0.686-0.366-1.393-0.67-2.131-0.892c-0.2-0.058-0.379-0.14-0.58-0.192C359.87,0.114,359.047,0,358.203,0H97.2C85.292,0,75.6,9.693,75.6,21.601v507.6c0,11.913,9.692,21.601,21.6,21.601H453.6c11.918,0,21.601-9.688,21.601-21.601V133.202C475.2,132.796,475.137,132.398,475.095,131.992z M243.599,523.494H141.75v-15.936l62.398-89.797v-0.785h-56.565v-24.484h95.051v17.106l-61.038,88.636v0.771h62.002V523.494z M292.021,523.494h-29.744V392.492h29.744V523.494z M399.705,463.44c-10.104,9.524-25.069,13.796-42.566,13.796c-3.893,0-7.383-0.19-10.104-0.58v46.849h-29.352V394.242c9.134-1.561,21.958-2.721,40.036-2.721c18.277,0,31.292,3.491,40.046,10.494c8.354,6.607,13.996,17.486,13.996,30.322C411.761,445.163,407.479,456.053,399.705,463.44z M97.2,366.752V21.601h129.167v-3.396h32.756v3.396h88.28v110.515c0,5.961,4.831,10.8,10.8,10.8H453.6l.011,223.836H97.2z"></path>
                    </svg><span class="zip-count">Download ZIP (0)</span></button>
                </div>
                <div class="checkbox-hand-guide" style="display: none;" aria-hidden="true">
                    <img src="/hand-click.gif" alt="" width="48" height="48">
                </div>
            </div>
        </div>
        <div class="group-items">
            <div class="group-empty" style="display: none;">No items in this tab</div>
        </div>
        <div class="group-load-more" style="visibility: hidden;">
            <button type="button" class="btn-load-more-group" data-action="load-more-group" data-group-id="${groupId}">Load more</button>
        </div>
    `;
    return el;
}

export function updateGroupCount(groupEl: HTMLElement, isLocked: boolean = false, forceVisibility = false, singleItemId?: string): void {
    const groupId = groupEl.dataset.groupId;
    if (!groupId) return;
    const hasTabs = groupEl.dataset.hasTabs === 'true';

    const items = videoStore.getItemsByGroup(groupId);
    const activeTab = hasTabs ? (groupEl.dataset.activeTab || 'convert') : 'all';

    // Update group title
    const groupMeta = videoStore.getGroupMeta(groupId);
    const isGroupLoading = groupMeta?.isLoading === true;
    const titleEl = groupEl.querySelector('.group-name') as HTMLElement;
    if (titleEl) {
        const name = groupMeta?.title || 'Playlist';
        titleEl.textContent = `${name} (${items.length} items)`;
    }

    // Update Load more button
    const loadMoreContainer = groupEl.querySelector('.group-load-more') as HTMLElement;
    const loadMoreBtn = loadMoreContainer?.querySelector('.btn-load-more-group') as HTMLButtonElement;
    if (loadMoreContainer && loadMoreBtn) {
        if (groupMeta?.nextPageToken && (!hasTabs || activeTab !== 'download')) {
            loadMoreContainer.style.visibility = '';
            loadMoreBtn.disabled = isGroupLoading;
            loadMoreBtn.textContent = isGroupLoading ? 'Loading...' : 'Load more';
        } else {
            loadMoreContainer.style.visibility = 'hidden';
        }
    }

    // FIX 1: Single-pass aggregation — replaces 8 separate .filter() scans
    let cCount = 0, dCount = 0;
    let selectedCompleted_noTab = 0, selectedCompleted_download = 0;
    let downloadable_convert = 0;
    let selected_convert = 0, selected_download = 0, selected_all = 0;
    let selectable_convert = 0, selectable_download = 0, selectable_all = 0;
    let selectable_convert_all = true, selectable_download_all = true, selectable_all_all = true;
    let selectable_convert_some = false, selectable_download_some = false, selectable_all_some = false;

    for (const i of items) {
        const isConvert = isConvertTabStatus(i.status);
        const isDownload = isDownloadTabStatus(i.status);
        const isSelectable = SELECTABLE_STATUSES.has(i.status);
        const isDownloadable = DOWNLOADABLE_STATUSES.has(i.status);

        if (isConvert) {
            cCount++;
            if (isSelectable) {
                selectable_convert++;
                if (i.isSelected) { selected_convert++; selectable_convert_some = true; }
                else selectable_convert_all = false;
            }
            if (isDownloadable && i.isSelected) downloadable_convert++;
        }
        if (isDownload) {
            dCount++;
            if (isSelectable) {
                selectable_download++;
                if (i.isSelected) { selected_download++; selectable_download_some = true; }
                else selectable_download_all = false;
            }
            if (i.status === 'completed' && i.isSelected) selectedCompleted_download++;
        }
        if (isSelectable) {
            selectable_all++;
            if (i.isSelected) { selected_all++; selectable_all_some = true; }
            else selectable_all_all = false;
        }
        if (i.status === 'completed' && i.isSelected) selectedCompleted_noTab++;
    }

    // FIX 3: Update tab counts via text node only (avoids innerHTML re-parse)
    const convertTab = groupEl.querySelector('.playlist-tab[data-tab="convert"]') as HTMLElement | null;
    const downloadTab = groupEl.querySelector('.playlist-tab[data-tab="download"]') as HTMLElement | null;

    if (hasTabs) {
        const cCountEl = convertTab?.querySelector('.tab-count');
        const dCountEl = downloadTab?.querySelector('.tab-count');
        if (cCountEl) cCountEl.textContent = `(${cCount})`;
        if (dCountEl) dCountEl.textContent = `(${dCount})`;
    }

    // Glider Optimization: Only update glider if tab changed or on force update
    const prevGliderTab = groupEl.dataset.prevGliderTab;
    const activeTabEl = activeTab === 'convert' ? convertTab : downloadTab;
    const glider = groupEl.querySelector('.tab-glider') as HTMLElement | null;
    if (hasTabs && glider && activeTabEl && activeTabEl.offsetWidth > 0 && (forceVisibility || prevGliderTab !== activeTab)) {
        groupEl.dataset.prevGliderTab = activeTab;
        const padLeft = getTabPadding(activeTabEl);
        const extraPadding = 6;
        const width = (activeTabEl.offsetWidth - padLeft * 2) + (extraPadding * 2);
        glider.style.width = `${width}px`;
        glider.style.transform = `translateX(${activeTabEl.offsetLeft + padLeft - extraPadding}px)`;
    }

    // FIX 4: Compute visibleCount from data; only run DOM visibility loop when tab actually changes
    const visibleCount = !hasTabs ? items.length : (activeTab === 'convert' ? cCount : dCount);
    const prevTab = groupEl.dataset.prevTab;
    if (forceVisibility || prevTab !== activeTab) {
        const tabChanged = prevTab !== activeTab;
        groupEl.dataset.prevTab = activeTab;

        if (tabChanged) {
            // Tab changed — must loop all items to set visibility
            const itemsMap = new Map(items.map(i => [i.id, i]));
            const itemElements = groupEl.querySelectorAll('.multi-video-item');
            itemElements.forEach(itemEl => {
                const id = (itemEl as HTMLElement).dataset.id;
                if (!id) return;
                const itemData = itemsMap.get(id);
                if (!itemData) return;
                const isVisible = !hasTabs || activeTab === 'all'
                    ? true
                    : activeTab === 'convert'
                        ? isConvertTabStatus(itemData.status)
                        : isDownloadTabStatus(itemData.status);
                (itemEl as HTMLElement).style.display = isVisible ? 'flex' : 'none';
            });
        } else if (singleItemId) {
            // Single item added/updated — only set visibility for that item
            const itemEl = groupEl.querySelector(`.multi-video-item[data-id="${singleItemId}"]`) as HTMLElement;
            if (itemEl) {
                const itemData = items.find(i => i.id === singleItemId);
                if (itemData) {
                    const isVisible = !hasTabs || activeTab === 'all'
                        ? true
                        : activeTab === 'convert'
                            ? isConvertTabStatus(itemData.status)
                            : isDownloadTabStatus(itemData.status);
                    itemEl.style.display = isVisible ? 'flex' : 'none';
                }
            }
        }
    }

    // Toggle Empty State
    const emptyState = groupEl.querySelector('.group-empty') as HTMLElement;
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
    }

    // Toggle Action Buttons based on active tab
    const convertAllBtn = groupEl.querySelector('[data-action="download-group"]') as HTMLElement;
    const zipBtn = groupEl.querySelector('[data-action="download-zip-group"]') as HTMLElement;

    if (zipBtn) {
        if (!hasTabs) {
            if (convertAllBtn) convertAllBtn.style.display = 'none';
            if (isIOS()) {
                zipBtn.style.display = 'none';
            } else {
                zipBtn.style.display = '';
                const zipDisabled = selectedCompleted_noTab === 0 || isLocked;
                setButtonDisabledState(zipBtn, zipDisabled, 'Select items to download');
                if (!zipDisabled) hideCheckboxHandGuide(groupEl);
                const zipCountEl = zipBtn.querySelector('.zip-count') as HTMLElement;
                if (zipCountEl) zipCountEl.textContent = `Download ZIP (${selectedCompleted_noTab})`;
            }
        } else if (activeTab === 'convert') {
            if (convertAllBtn) convertAllBtn.style.display = '';
            zipBtn.style.display = 'none';
            if (convertAllBtn) {
                const convertDisabled = downloadable_convert === 0;
                setButtonDisabledState(convertAllBtn, convertDisabled, 'Select items to convert');
                if (!convertDisabled) hideCheckboxHandGuide(groupEl);
                convertAllBtn.textContent = `Convert selected (${downloadable_convert})`;
            }
        } else {
            if (convertAllBtn) convertAllBtn.style.display = 'none';
            if (isIOS()) {
                zipBtn.style.display = 'none';
            } else {
                zipBtn.style.display = '';
                const zipDisabled = selectedCompleted_download === 0 || isLocked;
                setButtonDisabledState(zipBtn, zipDisabled, 'Select items to download');
                if (!zipDisabled) hideCheckboxHandGuide(groupEl);
                // FIX 2: Update text node only — no SVG re-parse
                const zipCountEl = zipBtn.querySelector('.zip-count') as HTMLElement;
                if (zipCountEl) {
                    const nextText = `Download ZIP (${selectedCompleted_download})`;
                    if (zipCountEl.textContent !== nextText) {
                        zipCountEl.textContent = nextText;
                    }
                }
            }
        }

        // Update Selection Count Text (scoped to active tab)
        const selectionText = groupEl.querySelector('.group-selection-text');
        if (selectionText) {
            const selectedCount = !hasTabs ? selected_all
                : activeTab === 'convert' ? selected_convert : selected_download;
            selectionText.textContent = `${selectedCount} selected`;
        }

        // Update Group Checkbox State (scoped to active tab)
        const groupCheckbox = groupEl.querySelector('.group-checkbox') as HTMLInputElement;
        if (groupCheckbox) {
            const selectable = !hasTabs ? selectable_all
                : activeTab === 'convert' ? selectable_convert : selectable_download;
            const selAll = !hasTabs ? selectable_all_all
                : activeTab === 'convert' ? selectable_convert_all : selectable_download_all;
            const selSome = !hasTabs ? selectable_all_some
                : activeTab === 'convert' ? selectable_convert_some : selectable_download_some;
            const allSelected = selectable > 0 && selAll;
            const someSelected = selSome;
            groupCheckbox.checked = allSelected;
            groupCheckbox.indeterminate = someSelected && !allSelected;
            groupCheckbox.disabled = false;
        }
    }
}

export const DOWNLOAD_TAB_CLICKED_KEY = STORAGE_KEYS.PLAYLIST_TAB_CLICKED;

/**
 * Show hand pointer guide on the Download tab if user hasn't discovered it yet
 */
export function showDownloadTabGuide(groupEl: HTMLElement, offsetX: number = 0): void {
    if (!groupEl) return;
    if (localStorage.getItem(DOWNLOAD_TAB_CLICKED_KEY) === 'true') return;

    const tabsContainer = groupEl.querySelector('.playlist-header-tabs') as HTMLElement;
    if (!tabsContainer) return;

    const downloadTab = tabsContainer.querySelector('.playlist-tab[data-tab="download"]') as HTMLElement;
    if (!downloadTab) return;

    const handGuide = tabsContainer.querySelector('.tab-hand-guide') as HTMLElement;
    if (!handGuide) return;

    const tabLeft = downloadTab.offsetLeft;
    const guideWidth = 50;
    handGuide.style.left = `${tabLeft - guideWidth + offsetX}px`;
    handGuide.style.right = '';
    handGuide.style.display = '';

    // Auto hide after 5s
    if ((handGuide as any)._autoHideTimer) clearTimeout((handGuide as any)._autoHideTimer);
    (handGuide as any)._autoHideTimer = setTimeout(() => {
        handGuide.style.display = 'none';
        (handGuide as any)._autoHideTimer = null;
    }, 5000);
}

function setButtonDisabledState(btn: HTMLElement, disabled: boolean, tooltipText: string): void {
    if (disabled) {
        btn.classList.add('is-disabled');
        btn.setAttribute('aria-disabled', 'true');
        btn.setAttribute('data-tooltip', tooltipText);
    } else {
        btn.classList.remove('is-disabled');
        btn.setAttribute('aria-disabled', 'false');
        btn.removeAttribute('data-tooltip');
    }
}

export function showCheckboxHandGuide(groupEl: HTMLElement): void {
    const handGuide = groupEl.querySelector('.checkbox-hand-guide') as HTMLElement | null;
    if (!handGuide) return;
    handGuide.style.display = '';
}

export function hideCheckboxHandGuide(groupEl: HTMLElement): void {
    const handGuide = groupEl.querySelector('.checkbox-hand-guide') as HTMLElement | null;
    if (!handGuide) return;
    handGuide.style.display = 'none';
}
