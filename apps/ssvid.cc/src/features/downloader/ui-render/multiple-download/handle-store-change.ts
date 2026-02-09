
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
                        groupList.prepend(el);
                    }
                    updateGroupCount(groupEl);
                } else {
                    listContainer.prepend(el);
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

                VideoItemRenderer.updateProgressOnly(el, item);
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
    el.innerHTML = `
        <div class="group-header">
            <div class="group-header-left">
                <button class="group-collapse-btn" data-action="toggle-group" data-group-id="${groupId}">
                    <span class="collapse-icon">▼</span>
                </button>
                <div class="group-title-info">
                    <h3 class="group-title">${groupTitle}</h3>
                    <span class="group-count"></span>
                </div>
            </div>
            <div class="group-header-right">
                <div class="group-actions">
                    <button class="btn btn-primary btn-sm" data-action="download-group" data-group-id="${groupId}">Download All</button>
                    <button class="btn btn-success btn-sm" data-action="download-zip-group" data-group-id="${groupId}">Download ZIP</button>
                    <button class="btn btn-secondary btn-sm" data-action="remove-group" data-group-id="${groupId}">Remove</button>
                </div>
                <label class="group-checkbox-label">
                    <input type="checkbox" class="group-checkbox" data-group-id="${groupId}" checked>
                    <span>Select All</span>
                </label>
            </div>
        </div>
        <div class="group-items"></div>
    `;
    return el;
}

function updateGroupCount(groupEl: HTMLElement): void {
    const groupId = groupEl.dataset.groupId;
    if (!groupId) return;

    const items = videoStore.getItemsByGroup(groupId);
    const total = items.length;
    const completedItems = items.filter(i => i.status === 'completed');
    const completed = completedItems.length;
    const downloadableCount = items.filter(i => ['ready', 'error', 'cancelled'].includes(i.status)).length;
    const selectedCompletedCount = completedItems.filter(i => i.isSelected).length;

    const countEl = groupEl.querySelector('.group-count');
    if (countEl) {
        if (completed > 0) {
            countEl.textContent = `(${completed}/${total})`;
        } else {
            countEl.textContent = `(${total})`;
        }
    }

    // Update group button states
    const downloadBtn = groupEl.querySelector('[data-action="download-group"]') as HTMLButtonElement;
    if (downloadBtn) {
        downloadBtn.disabled = downloadableCount === 0;
        downloadBtn.textContent = `Download All (${downloadableCount})`;
    }

    const zipBtn = groupEl.querySelector('[data-action="download-zip-group"]') as HTMLButtonElement;
    if (zipBtn) {
        zipBtn.disabled = selectedCompletedCount === 0;
        zipBtn.textContent = `Download ZIP (${selectedCompletedCount})`;
    }
}

