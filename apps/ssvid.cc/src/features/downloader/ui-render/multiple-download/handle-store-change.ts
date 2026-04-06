
import { VideoStoreEventName, VideoItem } from '../../state/multiple-download-types';
import { videoStore } from '../../state/video-store';
import { VideoItemRenderer } from './video-item-renderer';
import { RendererStrategy } from './renderer-strategy.interface';
import { isIOS, isMobileDevice } from '../../../../utils';
import { STORAGE_KEYS } from '../../../../utils/storage-keys';
import { getAddedCount, hasItemsProcessing } from '../../logic/multiple-download/mobile-save-zip-manager';

export interface StoreChangeHandlerConfig {
    listContainer: HTMLElement;
    controlsContainer?: HTMLElement;
    strategy: RendererStrategy;
    onCountsChanged?: () => void;
    getGlobalLockState?: () => boolean;
    getActiveLoadingId?: () => string | null;
}

const CONVERT_TAB_STATUSES = new Set(['pending', 'analyzing', 'fetching_metadata', 'ready', 'cancelled']);
const DOWNLOAD_TAB_STATUSES = new Set(['queued', 'downloading', 'converting', 'completed', 'expired', 'error']);

function isConvertTabStatus(status: string) {
    return CONVERT_TAB_STATUSES.has(status);
}

function isDownloadTabStatus(status: string) {
    return DOWNLOAD_TAB_STATUSES.has(status);
}

export function createStoreChangeHandler(config: StoreChangeHandlerConfig) {
    const { listContainer, strategy, onCountsChanged } = config;

    return function handleStoreChange(eventName: VideoStoreEventName, data: any): void {
        switch (eventName) {
            case 'item:added': {
                // data is the full VideoItem
                const item = data as VideoItem;
                const el = VideoItemRenderer.createVideoItemElement(item, strategy);

                // Insert into group container if groupId exists
                if (item.groupId) {
                    let groupEl = listContainer.querySelector(`[data-group-id="${item.groupId}"]`) as HTMLElement;
                    if (!groupEl) {
                        groupEl = createGroupElement(item.groupId, item.groupTitle || 'Playlist');
                        listContainer.prepend(groupEl);
                    }
                    const groupList = groupEl.querySelector('.group-items');
                    if (groupList) {
                        // Insert before the load-more button so it stays at the bottom
                        const loadMoreEl = groupList.querySelector('.group-load-more');
                        groupList.insertBefore(el, loadMoreEl ?? null);
                    }
                    // afterRender must run AFTER DOM insertion so getComputedStyle works correctly
                    if (strategy.afterRender) {
                        strategy.afterRender(el, item);
                    }
                    const isLocked = config.getGlobalLockState?.() || false;
                    updateGroupCount(groupEl, isLocked);
                } else {
                    listContainer.prepend(el);
                    // afterRender must run AFTER DOM insertion so getComputedStyle works correctly
                    if (strategy.afterRender) {
                        strategy.afterRender(el, item);
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
                const el = getVideoItemElement(listContainer, item.id);
                if (el) el.remove();

                // Update group count if item had a group
                if (item.groupId) {
                    const groupEl = listContainer.querySelector(`[data-group-id="${item.groupId}"]`) as HTMLElement;
                    if (groupEl) {
                        const isLocked = config.getGlobalLockState?.() || false;
                        updateGroupCount(groupEl, isLocked);
                        // Keep group visible even when all items downloaded (user may want to load more)
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
                // If data is null/undefined, it means a global UI update (e.g. lock release)
                if (!data) {
                    const items = videoStore.getAllItems();
                    const isGlobalLocked = config.getGlobalLockState?.() || false;
                    const activeLoadingId = config.getActiveLoadingId?.() || null;

                    // Update all individual items
                    for (const item of items) {
                        const el = getVideoItemElement(listContainer, item.id);
                        if (el) {
                            VideoItemRenderer.updateVideoItemElement(el, item, strategy, {
                                isGlobalLocked,
                                currentDownloadingItemId: activeLoadingId || undefined
                            });
                        }
                    }

                    // Update all group headers
                    const groups = listContainer.querySelectorAll('.playlist-group');
                    groups.forEach(group => updateGroupCount(group as HTMLElement, isGlobalLocked));

                    onCountsChanged?.();
                    return;
                }

                // Normal single item update
                const item = data as VideoItem;
                const el = getVideoItemElement(listContainer, item.id);
                if (!el) return;

                const isGlobalLocked = config.getGlobalLockState?.() || false;
                const activeLoadingId = config.getActiveLoadingId?.() || null;

                VideoItemRenderer.updateVideoItemElement(el, item, strategy, {
                    isGlobalLocked,
                    currentDownloadingItemId: activeLoadingId || undefined
                });

                // Update group count if in a group
                if (item.groupId) {
                    const groupEl = listContainer.querySelector(`[data-group-id="${item.groupId}"]`) as HTMLElement;
                    if (groupEl) {
                        updateGroupCount(groupEl, isGlobalLocked);
                    }
                }

                onCountsChanged?.();
                break;
            }

            case 'item:progress': {
                // data is the full VideoItem
                const item = data as VideoItem;
                const el = getVideoItemElement(listContainer, item.id);
                if (!el) return;

                VideoItemRenderer.updateProgressOnly(el, item, strategy);
                onCountsChanged?.();
                break;
            }

            case 'items:cleared': {
                listContainer.innerHTML = '<div class="empty-list">No videos added yet.</div>';
                onCountsChanged?.();
                break;
            }

            case 'items:selection-changed': {
                const isLocked = config.getGlobalLockState?.() || false;

                if (data) {
                    // Single item toggled (from toggleSelect) — only update that checkbox + its group
                    const item = data as VideoItem;
                    const checkbox = listContainer.querySelector(`.item-checkbox[data-id="${item.id}"]`) as HTMLInputElement;
                    if (checkbox) checkbox.checked = item.isSelected;

                    if (item.groupId) {
                        const groupEl = listContainer.querySelector(`[data-group-id="${item.groupId}"]`) as HTMLElement;
                        if (groupEl) updateGroupCount(groupEl, isLocked);
                    }
                } else {
                    // Bulk selection changed — sync all checkboxes in one pass
                    const itemsMap = new Map(videoStore.getAllItems().map(i => [i.id, i]));
                    const allCheckboxes = listContainer.querySelectorAll<HTMLInputElement>('.item-checkbox');
                    allCheckboxes.forEach(checkbox => {
                        const id = checkbox.dataset.id;
                        if (id) {
                            const item = itemsMap.get(id);
                            if (item) checkbox.checked = item.isSelected;
                        }
                    });

                    const groups = listContainer.querySelectorAll('.playlist-group');
                    groups.forEach(group => updateGroupCount(group as HTMLElement, isLocked));
                }

                onCountsChanged?.();
                break;
            }

            case 'items:settings-changed': {
                // Re-render settings area of each item
                const items = videoStore.getAllItems();
                for (const item of items) {
                    const el = getVideoItemElement(listContainer, item.id);
                    if (!el) continue;

                    const settingsEl = el.querySelector('.item-settings') as HTMLElement;
                    if (settingsEl) {
                        settingsEl.innerHTML = strategy.buildSettingsContent(item);
                        settingsEl.className = 'item-settings' + strategy.getSettingsClass(item);
                    }
                }
                break;
            }

            case 'group:updated': {
                const { groupId } = data as { groupId: string };
                const groupEl = listContainer.querySelector(`[data-group-id="${groupId}"]`) as HTMLElement;
                if (groupEl) {
                    const isLocked = config.getGlobalLockState?.() || false;
                    updateGroupCount(groupEl, isLocked);
                }
                break;
            }
        }
    };
}

function getVideoItemElement(container: HTMLElement, id: string): HTMLElement | null {
    return container.querySelector(`.multi-video-item[data-id="${id}"]`);
}

function createGroupElement(groupId: string, groupTitle: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'playlist-group';
    el.dataset.groupId = groupId;
    el.dataset.activeTab = 'convert'; // Default tab
    el.innerHTML = `
        <div class="group-header">
            <div class="group-header-top-row" data-action="toggle-group" data-group-id="${groupId}">
                <div class="group-header-title-area">
                    <p class="group-title">Playlist</p>
                </div>
                <div class="playlist-header-tabs">
                    <div class="tab-glider"></div>
                    <button type="button" class="playlist-tab active" data-action="playlist-tab" data-tab="convert" data-group-id="${groupId}">Convert <span class="tab-suffix">Tab</span> (0)</button>
                    <button type="button" class="playlist-tab" data-action="playlist-tab" data-tab="download" data-group-id="${groupId}">Download <span class="tab-suffix">Tab</span> (0)</button>
                    <div class="tab-hand-guide" style="display: none;" aria-hidden="true">
                        <img src="/hand-click.gif" alt="" width="48" height="48">
                    </div>
                </div>
            </div>
            <div class="group-header-bottom-row">
                <label class="group-selection-label">
                    <input type="checkbox" class="group-checkbox" data-group-id="${groupId}" checked>
                    <span class="group-selection-text">0 selected</span>
                </label>
                <div class="checkbox-hand-guide" style="display: none;" aria-hidden="true">
                    <img src="/hand-click.gif" alt="" width="48" height="48">
                </div>
                <div class="group-actions">
                    <button class="btn-playlist-group-action is-disabled" aria-disabled="true" data-tooltip="Select items to convert" data-action="download-group" data-group-id="${groupId}">Convert selected (0)</button>
                    <button class="btn-playlist-group-action btn-success is-disabled" aria-disabled="true" data-tooltip="Select items to download" data-action="download-zip-group" data-group-id="${groupId}" style="display: none;">
                    <svg class="btn-icon-zip" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550.801 550.801" aria-hidden="true" width="16" height="16" style="margin-right: 8px; vertical-align: middle;">
                        <path fill="currentColor" d="M475.095,131.992c-0.032-2.526-0.833-5.021-2.568-6.993L366.324,3.694c-0.021-0.034-0.053-0.045-0.084-0.076c-0.633-0.707-1.36-1.29-2.141-1.804c-0.232-0.15-0.465-0.285-0.707-0.422c-0.686-0.366-1.393-0.67-2.131-0.892c-0.2-0.058-0.379-0.14-0.58-0.192C359.87,0.114,359.047,0,358.203,0H97.2C85.292,0,75.6,9.693,75.6,21.601v507.6c0,11.913,9.692,21.601,21.6,21.601H453.6c11.918,0,21.601-9.688,21.601-21.601V133.202C475.2,132.796,475.137,132.398,475.095,131.992z M243.599,523.494H141.75v-15.936l62.398-89.797v-0.785h-56.565v-24.484h95.051v17.106l-61.038,88.636v0.771h62.002V523.494z M292.021,523.494h-29.744V392.492h29.744V523.494z M399.705,463.44c-10.104,9.524-25.069,13.796-42.566,13.796c-3.893,0-7.383-0.19-10.104-0.58v46.849h-29.352V394.242c9.134-1.561,21.958-2.721,40.036-2.721c18.277,0,31.292,3.491,40.046,10.494c8.354,6.607,13.996,17.486,13.996,30.322C411.761,445.163,407.479,456.053,399.705,463.44z M97.2,366.752V21.601h129.167v-3.396h32.756v3.396h88.28v110.515c0,5.961,4.831,10.8,10.8,10.8H453.6l.011,223.836H97.2z"></path>
                    </svg>
                    <span class="zip-btn-text">Download ZIP (0)</span></button>
                </div>
            </div>
        </div>
        <div class="group-items">
            <div class="group-empty" style="display: none;">No items in this tab</div>
        </div>
        <div class="group-load-more" style="display: none;">
            <button type="button" class="btn-load-more-group" data-action="load-more-group" data-group-id="${groupId}">Load more</button>
        </div>
    `;
    return el;
}

export function updateGroupCount(groupEl: HTMLElement, isLocked: boolean = false): void {
    const groupId = groupEl.dataset.groupId;
    if (!groupId) return;

    const items = videoStore.getItemsByGroup(groupId);
    const activeTab = groupEl.dataset.activeTab || 'convert';

    // Update group title
    const groupMeta = videoStore.getGroupMeta(groupId);
    const isGroupLoading = groupMeta?.isLoading === true;
    const titleEl = groupEl.querySelector('.group-title') as HTMLElement;
    if (titleEl) {
        const name = groupMeta?.title || 'Playlist';
        titleEl.textContent = `${name} (${items.length} items)`;
    }

    // Update Load more button
    const loadMoreContainer = groupEl.querySelector('.group-load-more') as HTMLElement;
    const loadMoreBtn = loadMoreContainer?.querySelector('.btn-load-more-group') as HTMLButtonElement;
    if (loadMoreContainer && loadMoreBtn) {
        if (groupMeta?.nextPageToken && activeTab !== 'download') {
            loadMoreContainer.style.display = '';
            loadMoreBtn.disabled = isGroupLoading;
            loadMoreBtn.textContent = isGroupLoading ? 'Loading...' : 'Load more';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }

    // Count items for tabs
    const convertItems = items.filter(i => isConvertTabStatus(i.status));
    const downloadItems = items.filter(i => isDownloadTabStatus(i.status));

    const cCount = convertItems.length;
    const dCount = downloadItems.length;

    // Update Tab Counts
    const convertTab = groupEl.querySelector('.playlist-tab[data-tab="convert"]') as HTMLElement | null;
    const downloadTab = groupEl.querySelector('.playlist-tab[data-tab="download"]') as HTMLElement | null;

    if (convertTab) convertTab.innerHTML = `Convert <span class="tab-suffix">Tab</span> (${cCount})`;
    if (downloadTab) downloadTab.innerHTML = `Download <span class="tab-suffix">Tab</span> (${dCount})`;

    // Sync glider to active tab (handles initial render and any tab that hasn't been clicked yet)
    const activeTabEl = activeTab === 'convert' ? convertTab : downloadTab;
    const glider = groupEl.querySelector('.tab-glider') as HTMLElement | null;
    if (glider && activeTabEl && activeTabEl.offsetWidth > 0) {
        const style = window.getComputedStyle(activeTabEl);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const extraPadding = 6;
        const width = (activeTabEl.offsetWidth - paddingLeft - paddingRight) + (extraPadding * 2);
        glider.style.width = `${width}px`;
        glider.style.transform = `translateX(${activeTabEl.offsetLeft + paddingLeft - extraPadding}px)`;
    }

    // Filter Visibility of items — always by active tab (mobile and desktop)
    const itemsMap = new Map(items.map(i => [i.id, i]));
    const itemElements = groupEl.querySelectorAll('.multi-video-item');
    let visibleCount = 0;

    itemElements.forEach(itemEl => {
        const id = (itemEl as HTMLElement).dataset.id;
        const itemData = id ? itemsMap.get(id) : undefined;

        if (itemData) {
            const isVisible = activeTab === 'convert'
                ? isConvertTabStatus(itemData.status)
                : isDownloadTabStatus(itemData.status);

            (itemEl as HTMLElement).style.display = isVisible ? 'flex' : 'none';
            if (isVisible) visibleCount++;
        }
    });

    // Toggle Empty State
    const emptyState = groupEl.querySelector('.group-empty') as HTMLElement;
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
    }

    // Toggle Action Buttons based on active tab
    const convertAllBtn = groupEl.querySelector('[data-action="download-group"]') as HTMLElement;
    const zipBtn = groupEl.querySelector('[data-action="download-zip-group"]') as HTMLElement;

    const isMobile = isMobileDevice();

    if (convertAllBtn && zipBtn) {
        if (activeTab === 'convert') {
            convertAllBtn.style.display = '';
            zipBtn.style.display = 'none';

            const downloadableCount = convertItems.filter(i => i.isSelected && ['ready', 'error', 'cancelled'].includes(i.status)).length;
            const isConvertDisabled = downloadableCount === 0 || isLocked;
            setButtonDisabledState(convertAllBtn, isConvertDisabled, 'Select items to convert');
            convertAllBtn.textContent = `Convert selected (${downloadableCount})`;
            if (!isConvertDisabled) hideCheckboxHandGuide(groupEl);
        } else {
            convertAllBtn.style.display = 'none';

            // Always show ZIP button on download tab
            zipBtn.style.display = '';

            // Skip updating ZIP button content if it's in loading state (polling)
            if (!zipBtn.classList.contains('is-loading')) {
                const zipCount = isMobile
                    ? getAddedCount(groupId) // Mobile: count from server session
                    : downloadItems.filter(i => i.status === 'completed' && i.isSelected).length;
                const processing = isMobile && hasItemsProcessing(groupId);
                // Mobile ZIP is server-side — ignore global lock
                const isZipDisabled = !isMobile && (zipCount === 0 || isLocked);
                setButtonDisabledState(zipBtn, isZipDisabled, 'Select items to download');
                const countText = processing ? `${zipCount})<span class="automation-dots"><span>.</span><span>.</span><span>.</span></span>` : `${zipCount})`;
                zipBtn.innerHTML = `<svg class="btn-icon-zip" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550.801 550.801" aria-hidden="true" width="16" height="16" style="margin-right: 8px; vertical-align: middle;"><path fill="currentColor" d="M475.095,131.992c-0.032-2.526-0.833-5.021-2.568-6.993L366.324,3.694c-0.021-0.034-0.053-0.045-0.084-0.076c-0.633-0.707-1.36-1.29-2.141-1.804c-0.232-0.15-0.465-0.285-0.707-0.422c-0.686-0.366-1.393-0.67-2.131-0.892c-0.2-0.058-0.379-0.14-0.58-0.192C359.87,0.114,359.047,0,358.203,0H97.2C85.292,0,75.6,9.693,75.6,21.601v507.6c0,11.913,9.692,21.601,21.6,21.601H453.6c11.918,0,21.601-9.688,21.601-21.601V133.202C475.2,132.796,475.137,132.398,475.095,131.992z M243.599,523.494H141.75v-15.936l62.398-89.797v-0.785h-56.565v-24.484h95.051v17.106l-61.038,88.636v0.771h62.002V523.494z M292.021,523.494h-29.744V392.492h29.744V523.494z M399.705,463.44c-10.104,9.524-25.069,13.796-42.566,13.796c-3.893,0-7.383-0.19-10.104-0.58v46.849h-29.352V394.242c9.134-1.561,21.958-2.721,40.036-2.721c18.277,0,31.292,3.491,40.046,10.494c8.354,6.607,13.996,17.486,13.996,30.322C411.761,445.163,407.479,456.053,399.705,463.44z M97.2,366.752V21.601h129.167v-3.396h32.756v3.396h88.28v110.515c0,5.961,4.831,10.8,10.8,10.8H453.6l.011,223.836H97.2z"></path></svg> <span class="zip-btn-text">Download ZIP (${countText}</span>`;
                if (!isZipDisabled) hideCheckboxHandGuide(groupEl);
            }
        }

        // Mobile + Download tab: hide checkbox/selection (auto-upload, no manual selection)
        const selectionLabel = groupEl.querySelector('.group-selection-label') as HTMLElement;
        if (selectionLabel) {
            selectionLabel.style.display = (isMobile && activeTab === 'download') ? 'none' : '';
        }

        // Update Selection Count Text (scoped to active tab)
        const selectionText = groupEl.querySelector('.group-selection-text');
        if (selectionText) {
            const tabItems = activeTab === 'convert' ? convertItems : downloadItems;
            const selectedCount = tabItems.filter(i => i.isSelected).length;
            selectionText.textContent = `${selectedCount} selected`;
        }

        // Update Group Checkbox State (scoped to active tab)
        const groupCheckbox = groupEl.querySelector('.group-checkbox') as HTMLInputElement;
        if (groupCheckbox) {
            const tabItems = activeTab === 'convert' ? convertItems : downloadItems;
            const selectableItems = tabItems.filter(i => ['ready', 'expired', 'error', 'cancelled', 'completed'].includes(i.status));
            const allSelected = selectableItems.length > 0 && selectableItems.every(i => i.isSelected);
            const someSelected = selectableItems.some(i => i.isSelected);
            groupCheckbox.checked = allSelected;
            groupCheckbox.indeterminate = someSelected && !allSelected;
            groupCheckbox.disabled = isLocked;
        }
    }
}

export const DOWNLOAD_TAB_CLICKED_KEY = STORAGE_KEYS.PLAYLIST_TAB_CLICKED;

/**
 * Show hand pointer guide on the Download tab if user hasn't discovered it yet
 */
export function showDownloadTabGuide(groupEl: HTMLElement, offsetX: number = 0): void {
    if (!groupEl) { console.log('[guide] no groupEl'); return; }
    if (localStorage.getItem(DOWNLOAD_TAB_CLICKED_KEY) === 'true') { console.log('[guide] already clicked, skip'); return; }

    const tabsContainer = groupEl.querySelector('.playlist-header-tabs') as HTMLElement;
    if (!tabsContainer) { console.log('[guide] no tabsContainer'); return; }

    const downloadTab = tabsContainer.querySelector('.playlist-tab[data-tab="download"]') as HTMLElement;
    if (!downloadTab) { console.log('[guide] no downloadTab'); return; }

    const handGuide = tabsContainer.querySelector('.tab-hand-guide') as HTMLElement;
    if (!handGuide) { console.log('[guide] no handGuide el'); return; }

    const tabLeft = downloadTab.offsetLeft;
    const guideWidth = 50;
    console.log('[guide] showing at left:', tabLeft - guideWidth + offsetX, 'offsetX:', offsetX);
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
