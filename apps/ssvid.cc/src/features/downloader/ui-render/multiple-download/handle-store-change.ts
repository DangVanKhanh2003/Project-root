
import { VideoStoreEventName, VideoItem } from '../../state/multiple-download-types';
import { videoStore } from '../../state/video-store';
import { VideoItemRenderer } from './video-item-renderer';
import { RendererStrategy } from './renderer-strategy.interface';

export interface StoreChangeHandlerConfig {
    listContainer: HTMLElement;
    controlsContainer?: HTMLElement;
    strategy: RendererStrategy;
    onCountsChanged?: () => void;
}

const CONVERT_TAB_STATUSES = new Set(['pending', 'analyzing', 'fetching_metadata', 'ready', 'error', 'cancelled']);
const DOWNLOAD_TAB_STATUSES = new Set(['queued', 'downloading', 'converting', 'completed']);

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
                        groupList.appendChild(el);
                    }
                    updateGroupCount(groupEl);
                } else {
                    listContainer.appendChild(el);
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
                        updateGroupCount(groupEl);
                        // Remove group if empty
                        const groupItems = groupEl.querySelector('.group-items');
                        if (groupItems && groupItems.children.length === 0) {
                            groupEl.remove();
                        }
                    }
                }

                // Show empty state if no items
                if (videoStore.getCount() === 0) {
                    listContainer.innerHTML = '<div class="empty-list">No videos added yet.</div>';
                }

                onCountsChanged?.();
                break;
            }

            case 'item:updated': {
                // data is the full VideoItem (already updated in store)
                const item = data as VideoItem;
                console.log('[handleStoreChange] item:updated received for:', item.id, 'status:', item.status);

                const el = getVideoItemElement(listContainer, item.id);
                if (!el) {
                    console.log('[handleStoreChange] DOM element NOT found for:', item.id);
                    return;
                }

                console.log('[handleStoreChange] DOM element found, updating...', 'has skeleton:', el.classList.contains('skeleton-loading'));

                VideoItemRenderer.updateVideoItemElement(el, item, strategy);

                // Update group count if in a group
                if (item.groupId) {
                    const groupEl = listContainer.querySelector(`[data-group-id="${item.groupId}"]`) as HTMLElement;
                    if (groupEl) updateGroupCount(groupEl);
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
                // Sync all checkboxes
                const items = videoStore.getAllItems();
                for (const item of items) {
                    const checkbox = listContainer.querySelector(`.item-checkbox[data-id="${item.id}"]`) as HTMLInputElement;
                    if (checkbox) {
                        checkbox.checked = item.isSelected;
                    }
                }

                // Update all group headers (for ZIP count and Select All state)
                const groups = listContainer.querySelectorAll('.playlist-group');
                groups.forEach(group => updateGroupCount(group as HTMLElement));

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
            <div class="group-header-top-row">
                <div class="group-header-title-area">
                    <button class="group-collapse-btn" data-action="toggle-group" data-group-id="${groupId}">
                        <span class="collapse-icon">▼</span>
                    </button>
                    <h3 class="group-title">${groupTitle}</h3>
                </div>
                <div class="playlist-header-tabs">
                    <button type="button" class="playlist-tab active" data-action="playlist-tab" data-tab="convert" data-group-id="${groupId}">Convert Tab (0)</button>
                    <button type="button" class="playlist-tab" data-action="playlist-tab" data-tab="download" data-group-id="${groupId}">Download Tab (0)</button>
                </div>
            </div>
            <div class="group-header-bottom-row">
                <label class="group-selection-label">
                    <input type="checkbox" class="group-checkbox" data-group-id="${groupId}" checked>
                    <span class="group-selection-text">0 selected</span>
                </label>
                <div class="group-actions">
                    <button class="btn-playlist-group-action" data-action="download-group" data-group-id="${groupId}">Convert selected (0)</button>
                    <button class="btn-playlist-group-action btn-success" data-action="download-zip-group" data-group-id="${groupId}" style="display: none;">Download ZIP (0)</button>
                </div>
            </div>
        </div>
        <div class="group-items"></div>
        <div class="group-empty" style="display: none;">No items in this tab</div>
    `;
    return el;
}

export function updateGroupCount(groupEl: HTMLElement): void {
    const groupId = groupEl.dataset.groupId;
    if (!groupId) return;

    const items = videoStore.getItemsByGroup(groupId);
    const activeTab = groupEl.dataset.activeTab || 'convert';

    // Count items for tabs
    const convertItems = items.filter(i => isConvertTabStatus(i.status));
    const downloadItems = items.filter(i => isDownloadTabStatus(i.status));

    const cCount = convertItems.length;
    const dCount = downloadItems.length;

    // Update Tab Counts
    const convertTab = groupEl.querySelector('.playlist-tab[data-tab="convert"]');
    const downloadTab = groupEl.querySelector('.playlist-tab[data-tab="download"]');

    if (convertTab) convertTab.textContent = `Convert Tab (${cCount})`;
    if (downloadTab) downloadTab.textContent = `Download Tab (${dCount})`;

    // Filter Visibility of items
    const itemElements = groupEl.querySelectorAll('.multi-video-item');
    let visibleCount = 0;

    itemElements.forEach(itemEl => {
        const id = (itemEl as HTMLElement).dataset.id;
        const itemData = items.find(i => i.id === id);

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

    // Toggle Action Buttons based on Tab
    const convertAllBtn = groupEl.querySelector('[data-action="download-group"]') as HTMLElement;
    const zipBtn = groupEl.querySelector('[data-action="download-zip-group"]') as HTMLElement;

    if (convertAllBtn && zipBtn) {
        if (activeTab === 'convert') {
            convertAllBtn.style.display = '';
            zipBtn.style.display = 'none';

            const downloadableCount = convertItems.filter(i => i.isSelected && ['ready', 'error', 'cancelled'].includes(i.status)).length;
            (convertAllBtn as HTMLButtonElement).disabled = downloadableCount === 0;
            convertAllBtn.textContent = `Convert selected (${downloadableCount})`;
        } else {
            convertAllBtn.style.display = 'none';
            zipBtn.style.display = '';

            const completedItems = downloadItems.filter(i => i.status === 'completed');
            const selectedCompletedCount = completedItems.filter(i => i.isSelected).length;
            (zipBtn as HTMLButtonElement).disabled = selectedCompletedCount === 0;
            zipBtn.textContent = `Download ZIP (${selectedCompletedCount})`;
        }
    }

    // Update Selection Count Text
    const selectionText = groupEl.querySelector('.group-selection-text');
    if (selectionText) {
        const selectedCount = items.filter(i => i.isSelected).length;
        selectionText.textContent = `${selectedCount} selected`;
    }

    // Update Group Checkbox State
    const groupCheckbox = groupEl.querySelector('.group-checkbox') as HTMLInputElement;
    if (groupCheckbox) {
        const allSelected = items.length > 0 && items.every(i => i.isSelected);
        const someSelected = items.some(i => i.isSelected);
        groupCheckbox.checked = allSelected;
        groupCheckbox.indeterminate = someSelected && !allSelected;
    }
}

