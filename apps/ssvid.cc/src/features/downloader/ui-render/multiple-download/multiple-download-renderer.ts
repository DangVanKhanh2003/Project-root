
import { videoStore } from '../../state/video-store';
import { multiDownloadService } from '../../logic/multiple-download/services/multi-download-service';
import { VideoItemRenderer } from './video-item-renderer';
import { MultiDownloadStrategy } from './multi-download-strategy';
import { PlaylistStrategy } from './playlist-strategy';
import { RendererStrategy } from './renderer-strategy.interface';
import { createStoreChangeHandler, updateGroupCount, DOWNLOAD_TAB_CLICKED_KEY, showDownloadTabGuide, showCheckboxHandGuide } from './handle-store-change';
import { triggerDownload, isIOS, isMobileDevice } from '../../../../utils';
import { mobileSaveZipDownload, getAddedCount, updateHeaderZipButton } from '../../logic/multiple-download/mobile-save-zip-manager';
import { MaterialPopup } from '../../../../ui-components/material-popup/material-popup';
import { isLinkExpired } from '../../../../utils/link-validator';
import { showRetryAllModal } from './expire-retry-modal';
import type { VideoItem } from '../../state/multiple-download-types';

export class MultipleDownloadRenderer {
    private container: HTMLElement | null = null;
    private listContainer: HTMLElement | null = null;
    private isInitialized = false;
    private isPlaylistMode: boolean = false;
    private strategy: RendererStrategy = new MultiDownloadStrategy();
    private unsubscribe: (() => void) | null = null;
    private isGlobalDownloadLocked: boolean = false;
    private activeLoadingId: string | null = null;

    init() {
        if (this.isInitialized) return;

        this.container = document.getElementById('multiple-downloads-container');

        if (!this.container) {
            const mainContent = document.getElementById('content-area') || document.querySelector('.hero-section');
            if (mainContent) {
                this.container = document.createElement('div');
                this.container.id = 'multiple-downloads-container';
                this.container.className = 'multiple-downloads-container';
                this.container.style.display = 'none';
                mainContent.insertAdjacentElement('afterend', this.container);
            }
        }

        if (this.container) {
            this.renderStructure();
            this.bindEvents();
            this.subscribeToStore();
            this.isInitialized = true;

            document.addEventListener('retryAllExpiredItems', () => {
                multiDownloadService.retryAllExpiredAndError();
            });
        }
    }

    setStrategy(strategy: RendererStrategy) {
        this.strategy = strategy;
    }

    usePlaylistStrategy() {
        this.strategy = new PlaylistStrategy();
    }

    useBatchStrategy() {
        this.strategy = new MultiDownloadStrategy();
    }

    show() {
        if (this.container) this.container.style.display = 'block';
    }

    hide() {
        if (this.container) this.container.style.display = 'none';
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.isInitialized = false;
    }

    // ==========================================
    // Private
    // ==========================================

    private renderStructure() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="multi-download-header" id="multi-batch-header" style="display: none;"></div>
            <div class="multi-download-list" id="multi-list"></div>
            <div class="multi-download-footer" id="multi-footer"></div>
        `;

        this.listContainer = this.container.querySelector('#multi-list');
    }

    private subscribeToStore() {
        if (!this.listContainer) return;

        const handleChange = createStoreChangeHandler({
            listContainer: this.listContainer,
            strategy: this.strategy,
            getGlobalLockState: () => this.isGlobalDownloadLocked,
            getActiveLoadingId: () => this.activeLoadingId
        });

        this.unsubscribe = videoStore.subscribe((eventName, data) => {
            // Show container when items exist
            const count = videoStore.getCount();
            if (count > 0) {
                this.show();
            } else if (count === 0 && !this.container?.querySelector('.playlist-group')) {
                this.hide();
            }

            handleChange(eventName, data);

            // Only re-render batch header when item counts/status/selection actually change
            // Skip for high-frequency events (item:progress, items:settings-changed)
            if (eventName !== 'item:progress' && eventName !== 'items:settings-changed') {
                this.updateBatchHeader();

                // On mobile, re-sync ZIP button state after batch header re-render
                if (isMobileDevice()) {
                    updateHeaderZipButton();
                }
            }
        });
    }

    private updateBatchHeader() {
        const headerEl = this.container?.querySelector('#multi-batch-header') as HTMLElement;
        if (!headerEl) return;

        // Skip re-render if ZIP button is in loading state (mobile polling in progress)
        const existingZipBtn = headerEl.querySelector('#multiDownloadActionBtn');
        if (existingZipBtn?.classList.contains('is-loading')) return;

        // Only show batch header if there are items NOT in a group
        const items = videoStore.getAllItems().filter(i => !i.groupId);
        if (items.length === 0) {
            headerEl.style.display = 'none';
            return;
        }

        headerEl.style.display = 'flex';

        const isMobile = isMobileDevice();
        const selectedCount = items.filter(i => i.isSelected).length;
        const allSelected = items.length > 0 && selectedCount === items.length;
        const completedSelectedCount = isMobile
            ? getAddedCount() // Mobile: count from server session
            : items.filter(i => i.status === 'completed' && i.isSelected).length;

        const showCheckbox = !isMobile; // Batch mode: no checkbox on mobile
        // Mobile ZIP is server-side (doesn't conflict with individual downloads) — ignore global lock
        const zipBtnDisabled = !isMobile && (completedSelectedCount === 0 || this.isGlobalDownloadLocked);

        headerEl.innerHTML = `
            <div class="multi-header-top-row">
                <p class="multi-header-title">Multiple download</p>
                <span class="item-count-total">${items.length} items</span>
            </div>
            <div class="multiple-download-group-actions">
                ${showCheckbox ? `<label class="group-selection-label">
                    <input type="checkbox" class="multiple-download-checkbox" id="masterCheckbox" aria-label="Select all" ${allSelected ? 'checked' : ''}>
                    <span class="group-selection-text" id="multiDownloadSelectedCount">${selectedCount} selected</span>
                </label>` : ''}
                <button type="button" class="group-download-btn btn-success${zipBtnDisabled ? ' is-disabled' : ''}" id="multiDownloadActionBtn" data-action="download-zip-batch" ${zipBtnDisabled ? 'aria-disabled="true" data-tooltip="Select items to download"' : 'aria-disabled="false"'}>
                    <svg class="btn-icon-zip" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550.801 550.801" aria-hidden="true" width="16" height="16" style="margin-right: 8px; vertical-align: middle;">
                        <path fill="currentColor" d="M475.095,131.992c-0.032-2.526-0.833-5.021-2.568-6.993L366.324,3.694c-0.021-0.034-0.053-0.045-0.084-0.076c-0.633-0.707-1.36-1.29-2.141-1.804c-0.232-0.15-0.465-0.285-0.707-0.422c-0.686-0.366-1.393-0.67-2.131-0.892c-0.2-0.058-0.379-0.14-0.58-0.192C359.87,0.114,359.047,0,358.203,0H97.2C85.292,0,75.6,9.693,75.6,21.601v507.6c0,11.913,9.692,21.601,21.6,21.601H453.6c11.918,0,21.601-9.688,21.601-21.601V133.202C475.2,132.796,475.137,132.398,475.095,131.992z M243.599,523.494H141.75v-15.936l62.398-89.797v-0.785h-56.565v-24.484h95.051v17.106l-61.038,88.636v0.771h62.002V523.494z M292.021,523.494h-29.744V392.492h29.744V523.494z M399.705,463.44c-10.104,9.524-25.069,13.796-42.566,13.796c-3.893,0-7.383-0.19-10.104-0.58v46.849h-29.352V394.242c9.134-1.561,21.958-2.721,40.036-2.721c18.277,0,31.292,3.491,40.046,10.494c8.354,6.607,13.996,17.486,13.996,30.322C411.761,445.163,407.479,456.053,399.705,463.44z M97.2,366.752V21.601h129.167v-3.396h32.756v3.396h88.28v110.515c0,5.961,4.831,10.8,10.8,10.8H453.6l.011,223.836H97.2z"></path>
                    </svg>
                    <span class="btn-text">Download ZIP (${completedSelectedCount})</span>
                </button>
                ${showCheckbox ? `<div class="checkbox-hand-guide" style="display: none;" aria-hidden="true">
                    <img src="/hand-click.gif" alt="" width="48" height="48">
                </div>` : ''}
            </div>
        `;
    }

    private bindEvents() {
        if (!this.container) return;

        // Click delegation
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const itemEl = target.closest('.multi-video-item') as HTMLElement | null;

            if (itemEl && this.shouldToggleItemSelection(target, itemEl)) {
                const id = itemEl.dataset.id;
                if (id) {
                    const item = videoStore.getItem(id);
                    if (item && this.handleExpiredItems([item], { markAsExpired: true }).length > 0) {
                        return;
                    }
                    videoStore.toggleSelect(id);
                }
                return;
            }

            const actionBtn = target.closest('[data-action]') as HTMLElement;

            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.id;
            const groupId = actionBtn.dataset.groupId;

            switch (action) {
                case 'remove':
                    if (id) videoStore.removeItem(id);
                    break;
                case 'cancel':
                    if (id) multiDownloadService.cancelDownload(id);
                    break;
                case 'cancel-all':
                    multiDownloadService.cancelAllDownloads();
                    break;
                case 'retry':
                    if (id) multiDownloadService.retryDownload(id);
                    break;
                case 'convert':
                    if (id) {
                        const groupElForItemGuide = actionBtn.closest('.playlist-group') as HTMLElement;
                        multiDownloadService.startDownload(id);
                        if (groupElForItemGuide) showDownloadTabGuide(groupElForItemGuide, 50);
                    }
                    break;
                case 'toggle-group':
                    if (groupId) this.toggleGroup(groupId);
                    break;
                case 'download-group':
                    if (groupId) {
                        if (actionBtn.classList.contains('is-disabled')) {
                            const groupElForHandGuide = this.listContainer?.querySelector(`[data-group-id="${groupId}"].playlist-group`) as HTMLElement;
                            if (groupElForHandGuide) showCheckboxHandGuide(groupElForHandGuide);
                            break;
                        }
                        multiDownloadService.startSelectedGroupDownloads(groupId);
                        const groupElForGuide = this.listContainer?.querySelector(`[data-group-id="${groupId}"].playlist-group`) as HTMLElement;
                        showDownloadTabGuide(groupElForGuide);
                        this.switchToTab(groupId, 'download', true);
                        videoStore.setGroupSelection(groupId, false);
                    }
                    break;
                case 'download-zip-group':
                    if (groupId) {
                        if (actionBtn.classList.contains('is-disabled')) {
                            const groupElForHandGuide = this.listContainer?.querySelector(`[data-group-id="${groupId}"].playlist-group`) as HTMLElement;
                            if (groupElForHandGuide) showCheckboxHandGuide(groupElForHandGuide);
                            break;
                        }
                        this.handleDownloadZipGroup(groupId, actionBtn);
                    }
                    break;
                case 'remove-group':
                    if (groupId) multiDownloadService.removeGroup(groupId);
                    break;
                case 'load-more-group':
                    if (groupId) multiDownloadService.loadMoreGroup(groupId);
                    break;
                case 'playlist-tab':
                    if (groupId) this.handleTabClick(actionBtn, groupId);
                    break;
                case 'download-zip-batch':
                    if (actionBtn.classList.contains('is-disabled')) {
                        this.showBatchCheckboxHandGuide();
                        break;
                    }
                    this.handleDownloadZipBatch(actionBtn);
                    break;
                case 'save':
                    this.handleSaveDownload(actionBtn);
                    break;
            }
        });

        // Change delegation (checkboxes, selects)
        this.container.addEventListener('change', (e) => {
            const target = e.target as HTMLElement;

            // Item checkbox
            if (target.classList.contains('item-checkbox')) {
                const id = (target as HTMLInputElement).dataset.id;
                const checkbox = target as HTMLInputElement;
                if (id) {
                    const item = videoStore.getItem(id);
                    if (checkbox.checked && item && this.handleExpiredItems([item], { markAsExpired: true }).length > 0) {
                        checkbox.checked = false;
                        const { expiredCount, errorCount } = this.getExpiredAndErrorCounts();
                        showRetryAllModal({ expiredCount, errorCount });
                        return;
                    }
                    videoStore.toggleSelect(id);
                }
                return;
            }


            // Group checkbox
            if (target.classList.contains('group-checkbox')) {
                const groupId = (target as HTMLInputElement).dataset.groupId;
                const checked = (target as HTMLInputElement).checked;

                if (groupId && this.listContainer) {
                    if (checked) {
                        const groupEl = this.listContainer.querySelector(`[data-group-id="${groupId}"].playlist-group`) as HTMLElement | null;
                        const activeTab = groupEl?.dataset.activeTab || 'convert';
                        const items = videoStore.getItemsByGroup(groupId);
                        const tabItems = items.filter(i =>
                            activeTab === 'convert' ? isConvertTabStatus(i.status) : isDownloadTabStatus(i.status)
                        );
                        const expiredItems = this.handleExpiredItems(tabItems, { markAsExpired: true });
                        const expiredIds = new Set(expiredItems.map(item => item.id));

                        // Show expire modal if there are expired/error items
                        const expiredCount = tabItems.filter(i => i.status === 'expired').length;
                        const failedCount = tabItems.filter(i => i.status === 'error' && !expiredIds.has(i.id)).length;

                        if (expiredCount > 0 || failedCount > 0) {
                            showRetryAllModal({ expiredCount, errorCount: failedCount });
                        }

                        const processingCount = tabItems.filter(i => ['analyzing', 'fetching_metadata', 'queued', 'downloading', 'converting'].includes(i.status)).length;

                        if (processingCount > 0) {
                            (target as HTMLInputElement).checked = false;

                            MaterialPopup.show({
                                title: 'Warning',
                                type: 'warning',
                                message: `There ${processingCount === 1 ? 'is' : 'are'} <strong>${processingCount} video${processingCount > 1 ? 's' : ''}</strong> still processing. Are you sure you want to continue?`,
                                confirmText: 'OK',
                                onConfirm: () => {
                                    (target as HTMLInputElement).checked = true;
                                    this.toggleGroupSelection(groupId, true);
                                }
                            });
                            return;
                        }
                    }

                    this.toggleGroupSelection(groupId, checked);
                }
                return;
            }

            // Format select (playlist mode)
            if (target.classList.contains('item-format-select')) {
                const id = (target as HTMLSelectElement).dataset.id;
                const value = (target as HTMLSelectElement).value as 'mp3' | 'mp4';
                if (id) {
                    videoStore.updateSettings(id, { format: value });
                    // Re-render settings to swap quality dropdown
                    const item = videoStore.getItem(id);
                    if (item) {
                        const el = this.listContainer?.querySelector(`.multi-video-item[data-id="${id}"]`) as HTMLElement;
                        if (el) {
                            const settingsEl = el.querySelector('.item-settings') as HTMLElement;
                            if (settingsEl) {
                                settingsEl.innerHTML = this.strategy.buildSettingsContent(item);
                                if (this.strategy.afterRender) {
                                    this.strategy.afterRender(el, item);
                                }
                            }
                        }
                    }
                }
                return;
            }

            // Quality select (playlist mode)
            if (target.classList.contains('item-quality-select')) {
                const id = (target as HTMLSelectElement).dataset.id;
                const field = (target as HTMLSelectElement).dataset.field;
                const value = (target as HTMLSelectElement).value;
                if (id && field) {
                    videoStore.updateSettings(id, { [field]: value });
                }
                return;
            }

            // Audio track select (playlist mode)
            if (target.classList.contains('item-audio-track-select')) {
                const id = (target as HTMLSelectElement).dataset.id;
                const value = (target as HTMLSelectElement).value;
                if (id) {
                    videoStore.updateSettings(id, { audioTrack: value });
                }
                return;
            }

            // Master checkbox for batch
            if (target.id === 'masterCheckbox') {
                const checked = (target as HTMLInputElement).checked;
                const items = videoStore.getAllItems().filter(i => !i.groupId);

                if (checked) {
                    const expiredItems = this.handleExpiredItems(items, { markAsExpired: true });
                    const expiredIds = new Set(expiredItems.map(item => item.id));

                    // Show expire modal if there are expired/error items
                    const expiredCount = items.filter(i => i.status === 'expired').length;
                    const failedCount = items.filter(i => i.status === 'error' && !expiredIds.has(i.id)).length;

                    if (expiredCount > 0 || failedCount > 0) {
                        showRetryAllModal({ expiredCount, errorCount: failedCount });
                    }

                    const processingCount = items.filter(i => ['analyzing', 'fetching_metadata', 'queued', 'downloading', 'converting'].includes(i.status)).length;

                    if (processingCount > 0) {
                        (target as HTMLInputElement).checked = false;

                        MaterialPopup.show({
                            title: 'Warning',
                            type: 'warning',
                            message: `There ${processingCount === 1 ? 'is' : 'are'} <strong>${processingCount} video${processingCount > 1 ? 's' : ''}</strong> still processing. Are you sure you want to continue?`,
                            confirmText: 'OK',
                            onConfirm: () => {
                                (target as HTMLInputElement).checked = true;
                                this.toggleBatchSelection(true);
                            }
                        });
                        return;
                    }
                }

                this.toggleBatchSelection(checked);
            }
        });
    }

    private shouldToggleItemSelection(target: HTMLElement, itemEl: HTMLElement): boolean {
        if (!itemEl.classList.contains('has-checkbox')) {
            return false;
        }

        if (target.closest('.item-checkbox-wrapper, .item-settings, .multi-video-actions, [data-action]')) {
            return false;
        }

        if (target.closest('button, select, option, input, textarea, label, a, summary, details')) {
            return false;
        }

        if (target.closest('.dropdown, .dropdown-menu, .dropdown-toggle')) {
            return false;
        }

        const checkbox = itemEl.querySelector('.item-checkbox') as HTMLInputElement | null;
        return !!checkbox && !checkbox.disabled;
    }

    private async handleDownloadZipBatch(btn: HTMLElement) {
        // Mobile: use server-side session flow
        if (isMobileDevice()) {
            btn.classList.add('is-loading');
            const result = await mobileSaveZipDownload([], btn, false, undefined);
            btn.classList.remove('is-loading');
            if (!result.success && result.error) {
                MaterialPopup.show({
                    title: 'Error',
                    type: 'warning',
                    message: result.error,
                    confirmText: 'OK'
                });
            }
            this.updateBatchHeader();
            return;
        }

        // Desktop: existing flow
        const originalText = btn.textContent;
        btn.classList.add('is-loading');
        btn.textContent = 'Creating ZIP...';

        try {
            const selectedItems = videoStore.getAllItems()
                .filter(i => !i.groupId && i.isSelected);

            // Re-check TTL + sync expired
            videoStore.syncExpiredItems();
            const selectedExpiredCount = selectedItems.filter(i => i.status === 'expired').length;
            const selectedErrorCount = selectedItems.filter(i => i.status === 'error').length;

            if (selectedExpiredCount > 0 || selectedErrorCount > 0) {
                const { expiredCount, errorCount } = this.getExpiredAndErrorCounts();
                const action = await showRetryAllModal({ showContinue: true, expiredCount, errorCount });
                if (action !== 'continue') return;
            }

            // Continue with valid completed items only
            const completedIds = videoStore.getAllItems()
                .filter(i => !i.groupId && i.status === 'completed' && i.isSelected && i.downloadUrl)
                .map(i => i.id);

            if (completedIds.length === 0) return;

            const downloadUrl = await multiDownloadService.createZipDownload(completedIds);

            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            MaterialPopup.show({
                title: 'Error',
                type: 'warning',
                message: error.message || 'Failed to create ZIP',
                confirmText: 'OK'
            });
        } finally {
            btn.classList.remove('is-loading');
            btn.textContent = originalText;
            this.updateBatchHeader();
        }
    }

    private async handleDownloadZipGroup(groupId: string, btn: HTMLElement) {
        // Mobile: use server-side session flow
        if (isMobileDevice()) {
            btn.classList.add('is-loading');
            const result = await mobileSaveZipDownload([], btn, false, groupId);
            btn.classList.remove('is-loading');
            if (!result.success && result.error) {
                MaterialPopup.show({
                    title: 'Error',
                    type: 'warning',
                    message: result.error,
                    confirmText: 'OK'
                });
            }
            const groupEl = this.listContainer?.querySelector(`[data-group-id="${groupId}"].playlist-group`) as HTMLElement;
            if (groupEl) updateGroupCount(groupEl, this.isGlobalDownloadLocked);
            return;
        }

        // Desktop: existing flow
        const originalText = btn.textContent;
        btn.classList.add('is-loading');
        btn.textContent = 'Creating ZIP...';

        try {
            const selectedItems = videoStore.getItemsByGroup(groupId)
                .filter(i => i.isSelected);

            // Re-check TTL + sync expired
            videoStore.syncExpiredItems();
            const selectedExpiredCount = selectedItems.filter(i => i.status === 'expired').length;
            const selectedErrorCount = selectedItems.filter(i => i.status === 'error').length;

            if (selectedExpiredCount > 0 || selectedErrorCount > 0) {
                const { expiredCount, errorCount } = this.getExpiredAndErrorCounts();
                const action = await showRetryAllModal({ showContinue: true, expiredCount, errorCount });
                if (action !== 'continue') return;
            }

            // Continue with valid completed items only
            const completedIds = videoStore.getItemsByGroup(groupId)
                .filter(i => i.status === 'completed' && i.isSelected && i.downloadUrl)
                .map(i => i.id);

            if (completedIds.length === 0) return;

            const downloadUrl = await multiDownloadService.createZipDownload(completedIds);

            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            MaterialPopup.show({
                title: 'Error',
                type: 'warning',
                message: error.message || 'Failed to create ZIP',
                confirmText: 'OK'
            });
        } finally {
            btn.classList.remove('is-loading');
            btn.textContent = originalText;
        }
    }

    private showBatchCheckboxHandGuide(): void {
        const headerEl = this.container?.querySelector('#multi-batch-header') as HTMLElement;
        if (!headerEl) return;
        const handGuide = headerEl.querySelector('.checkbox-hand-guide') as HTMLElement | null;
        if (!handGuide) return;
        handGuide.style.display = '';
    }

    private handleSaveDownload(btn: HTMLElement) {
        const downloadUrl = btn.dataset.downloadUrl;
        const filename = btn.dataset.filename;
        const id = btn.dataset.id;

        if (!downloadUrl) return;
        if (btn instanceof HTMLButtonElement && btn.disabled) return;
        if (id) {
            const item = videoStore.getItem(id);
            if (item && this.handleExpiredItems([item], { markAsExpired: true }).length > 0) {
                const { expiredCount, errorCount } = this.getExpiredAndErrorCounts();
                showRetryAllModal({ expiredCount, errorCount });
                return;
            }
        }

        const hadSuccess = btn.classList.contains('is-success');
        btn.classList.remove('is-success');
        btn.classList.add('is-loading'); // Local visual effect

        if (id) {
            this.activeLoadingId = id;
        }

        if (btn instanceof HTMLButtonElement) {
            btn.disabled = true;
        }

        this.isGlobalDownloadLocked = true;
        this.updateBatchHeader(); // Refresh header buttons
        this.listContainer?.querySelectorAll('.multi-video-item').forEach(el => {
            const itemId = (el as HTMLElement).dataset.id;
            if (itemId) {
                const item = videoStore.getItem(itemId);
                if (item) {
                    VideoItemRenderer.updateVideoItemElement(
                        el as HTMLElement,
                        item,
                        this.strategy,
                        {
                            isGlobalLocked: true,
                            currentDownloadingItemId: this.activeLoadingId || undefined
                        }
                    );
                }
            }
        });

        // Update all group headers (Convert Selected, ZIP)
        this.listContainer?.querySelectorAll('.playlist-group').forEach(groupEl => {
            updateGroupCount(groupEl as HTMLElement, true);
        });

        triggerDownload(downloadUrl, filename || undefined);

        window.setTimeout(() => {
            if (id) {
                videoStore.markDownloaded(id);
            }
            this.isGlobalDownloadLocked = false;
            this.activeLoadingId = null;
            this.updateBatchHeader();
            // Trigger a re-render/update of all items to unlock
            videoStore.triggerUpdate();

            btn.classList.remove('is-loading');
            if (hadSuccess || (id && videoStore.getItem(id)?.isDownloaded)) {
                btn.classList.add('is-success');
            }
        }, 5000);
    }

    private lockDownloadButtons(): void {
        if (!this.container) return;

        const buttons = this.container.querySelectorAll<HTMLButtonElement>('.btn-download-multi-download[data-action="save"]');
        buttons.forEach((button) => {
            button.disabled = true;
            button.classList.add('is-disabled');
        });
    }

    private unlockDownloadButtons(): void {
        if (!this.container) return;

        const buttons = this.container.querySelectorAll<HTMLButtonElement>('.btn-download-multi-download[data-action="save"]');
        buttons.forEach((button) => {
            button.disabled = false;
            button.classList.remove('is-disabled');
        });
    }

    private getExpiredCompletedItems(items: VideoItem[]): VideoItem[] {
        return items.filter(
            (item) =>
                (item.status === 'completed' || item.status === 'expired') &&
                typeof item.completedAt === 'number' &&
                isLinkExpired(item.completedAt)
        );
    }

    private handleExpiredItems(items: VideoItem[], options: { markAsExpired?: boolean } = {}): VideoItem[] {
        const expiredItems = this.getExpiredCompletedItems(items);
        if (expiredItems.length === 0) {
            return [];
        }

        const selectedExpiredIds = expiredItems.filter(item => item.isSelected).map(item => item.id);
        if (selectedExpiredIds.length > 0) {
            videoStore.setItemsSelection(selectedExpiredIds, false);
        }

        if (options.markAsExpired) {
            expiredItems.forEach((item) => {
                if (item.status !== 'expired') {
                    videoStore.setExpired(item.id, 'Download link expired. Please convert again to generate a new link.');
                }
            });
        }


        return expiredItems;
    }


    private getExpiredAndErrorCounts(): { expiredCount: number; errorCount: number } {
        const allItems = videoStore.getAllItems();
        return {
            expiredCount: allItems.filter(i => i.status === 'expired').length,
            errorCount: allItems.filter(i => i.status === 'error').length
        };
    }

    private escapeHtml(text: string): string {
        return text.replace(/[&<>"']/g, (m) => {
            switch (m) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case '\'': return '&#039;';
                default: return m;
            }
        });
    }


    private toggleGroup(groupId: string) {
        const groupEl = this.listContainer?.querySelector(`[data-group-id="${groupId}"].playlist-group`) as HTMLElement;
        if (!groupEl) return;
        groupEl.classList.toggle('collapsed');
    }

    private handleTabClick(tabEl: HTMLElement, groupId: string) {
        const tabType = tabEl.dataset.tab;
        if (tabType) {
            this.switchToTab(groupId, tabType, false);
        }
    }

    private switchToTab(groupId: string, tabType: string, isProgrammatic: boolean = false) {
        const groupEl = this.listContainer?.querySelector(`[data-group-id="${groupId}"].playlist-group`) as HTMLElement;
        if (!groupEl) return;

        const tabEl = groupEl.querySelector(`.playlist-tab[data-tab="${tabType}"]`) as HTMLElement;
        if (!tabEl) return;

        // Update active class on tabs
        const tabs = groupEl.querySelectorAll('.playlist-tab');
        tabs.forEach(t => t.classList.remove('active'));
        tabEl.classList.add('active');

        // Update active tab on group element
        groupEl.dataset.activeTab = tabType;

        // If user manually clicks Download tab: mark as discovered and hide hand guide
        if (!isProgrammatic && tabType === 'download') {
            localStorage.setItem(DOWNLOAD_TAB_CLICKED_KEY, 'true');
            const handGuide = groupEl.querySelector('.tab-hand-guide') as HTMLElement;
            if (handGuide) handGuide.style.display = 'none';
        }

        // Always clear all selections in Download tab on entry
        if (tabType === 'download') {
            const downloadTabItemIds = videoStore
                .getItemsByGroup(groupId)
                .filter(item => isDownloadTabStatus(item.status))
                .map(item => item.id);

            if (downloadTabItemIds.length > 0) {
                videoStore.setItemsSelection(downloadTabItemIds, false);
            }
        }

        // Update glider position (padding-aware)
        const glider = groupEl.querySelector('.tab-glider') as HTMLElement;
        if (glider) {
            const style = window.getComputedStyle(tabEl);
            const paddingLeft = parseFloat(style.paddingLeft) || 0;
            const paddingRight = parseFloat(style.paddingRight) || 0;
            const extraPadding = 6;
            const width = (tabEl.offsetWidth - paddingLeft - paddingRight) + (extraPadding * 2);
            glider.style.width = `${width}px`;
            glider.style.transform = `translateX(${tabEl.offsetLeft + paddingLeft - extraPadding}px)`;
        }

        // Trigger re-filtering
        updateGroupCount(groupEl, this.isGlobalDownloadLocked);
    }

    private toggleGroupSelection(groupId: string, checked: boolean) {
        const groupEl = this.listContainer?.querySelector(`[data-group-id="${groupId}"].playlist-group`) as HTMLElement | null;
        const activeTab = groupEl?.dataset.activeTab || 'convert';
        const items = videoStore.getItemsByGroup(groupId);
        const tabItems = items.filter(i =>
            activeTab === 'convert' ? isConvertTabStatus(i.status) : isDownloadTabStatus(i.status)
        );
        videoStore.setItemsSelection(tabItems.map(i => i.id), checked);
    }

    private toggleBatchSelection(checked: boolean) {
        const items = videoStore.getAllItems().filter(i => !i.groupId);
        // Batch update — fires ONE event instead of N events
        videoStore.setItemsSelection(items.map(i => i.id), checked);
    }
}

const CONVERT_TAB_STATUSES = new Set(['pending', 'analyzing', 'fetching_metadata', 'ready', 'cancelled']);
const DOWNLOAD_TAB_STATUSES = new Set(['queued', 'downloading', 'converting', 'completed', 'expired', 'error']);

function isConvertTabStatus(status: string) {
    return CONVERT_TAB_STATUSES.has(status);
}

function isDownloadTabStatus(status: string) {
    return DOWNLOAD_TAB_STATUSES.has(status);
}

export const multipleDownloadRenderer = new MultipleDownloadRenderer();

