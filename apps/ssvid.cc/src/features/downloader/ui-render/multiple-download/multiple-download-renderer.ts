
import { videoStore } from '../../state/video-store';
import { multiDownloadService } from '../../logic/multiple-download/services/multi-download-service';
import { VideoItemRenderer } from './video-item-renderer';
import { MultiDownloadStrategy } from './multi-download-strategy';
import { PlaylistStrategy } from './playlist-strategy';
import { RendererStrategy } from './renderer-strategy.interface';
import { createStoreChangeHandler } from './handle-store-change';
import { isMobileDevice } from '../../../../utils';

export class MultipleDownloadRenderer {
    private container: HTMLElement | null = null;
    private listContainer: HTMLElement | null = null;
    private controlsContainer: HTMLElement | null = null;
    private headerEl: HTMLElement | null = null;
    private isInitialized = false;
    private strategy: RendererStrategy = new MultiDownloadStrategy();
    private unsubscribe: (() => void) | null = null;

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
            <div class="multi-download-header">
                <div class="multi-download-header-left">
                    <label class="master-checkbox-label" style="${isMobileDevice() ? 'display:none' : ''}">
                        <input type="checkbox" class="master-checkbox" checked>
                    </label>
                    <h2>Videos</h2>
                    <span class="item-count-badge"></span>
                </div>
                <div class="multi-download-controls" id="multi-controls"></div>
            </div>
            <div class="multi-download-list" id="multi-list"></div>
            <div class="multi-download-footer" id="multi-footer"></div>
        `;

        this.listContainer = this.container.querySelector('#multi-list');
        this.controlsContainer = this.container.querySelector('#multi-controls');
        this.headerEl = this.container.querySelector('.multi-download-header');
    }

    private subscribeToStore() {
        if (!this.listContainer || !this.controlsContainer) return;

        const handleChange = createStoreChangeHandler({
            listContainer: this.listContainer,
            controlsContainer: this.controlsContainer,
            strategy: this.strategy,
            onCountsChanged: () => this.updateControls(),
        });

        this.unsubscribe = videoStore.subscribe((eventName, data) => {
            // Show container when items exist
            const count = videoStore.getCount();
            if (count > 0) {
                this.show();
            } else if (count === 0) {
                this.hide();
            }

            handleChange(eventName, data);
        });
    }

    private bindEvents() {
        if (!this.container) return;

        // Click delegation
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
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
                case 'download-all':
                    multiDownloadService.startAllDownloads();
                    break;
                case 'download-selected':
                    multiDownloadService.startSelectedDownloads();
                    break;
                case 'retry':
                    if (id) multiDownloadService.retryDownload(id);
                    break;
                case 'convert':
                    if (id) multiDownloadService.startDownload(id);
                    break;
                case 'toggle-group':
                    if (groupId) this.toggleGroup(groupId);
                    break;
            }
        });

        // Change delegation (checkboxes, selects)
        this.container.addEventListener('change', (e) => {
            const target = e.target as HTMLElement;

            // Item checkbox
            if (target.classList.contains('item-checkbox')) {
                const id = (target as HTMLInputElement).dataset.id;
                if (id) videoStore.toggleSelect(id);
                this.syncMasterCheckbox();
                return;
            }

            // Master checkbox
            if (target.classList.contains('master-checkbox')) {
                const checked = (target as HTMLInputElement).checked;
                if (checked) {
                    videoStore.selectAll();
                } else {
                    videoStore.deselectAll();
                }
                return;
            }

            // Group checkbox
            if (target.classList.contains('group-checkbox')) {
                const groupId = (target as HTMLInputElement).dataset.groupId;
                const checked = (target as HTMLInputElement).checked;
                if (groupId) videoStore.setGroupSelection(groupId, checked);
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
        });
    }

    private updateControls() {
        if (!this.controlsContainer) return;

        const allItems = videoStore.getAllItems();
        const count = allItems.length;
        const selectedCount = videoStore.getSelectedCount();
        const isMobile = isMobileDevice();
        const hasActive = allItems.some(i =>
            i.status === 'downloading' || i.status === 'converting' || i.status === 'queued'
        );
        const downloadableCount = videoStore.getDownloadableItems().length;
        const selectedDownloadableCount = videoStore.getSelectedDownloadable().length;

        // Update count badge
        const countBadge = this.container?.querySelector('.item-count-badge');
        if (countBadge) {
            countBadge.textContent = count > 0 ? `(${count})` : '';
        }

        let html = '';

        if (count > 0) {
            if (hasActive) {
                html = `<button class="btn btn-danger" data-action="cancel-all">Cancel All</button>`;
            } else if (!isMobile) {
                if (selectedDownloadableCount > 0 && selectedDownloadableCount < downloadableCount) {
                    html = `
                        <button class="btn btn-primary" data-action="download-selected">Download Selected (${selectedDownloadableCount})</button>
                        <button class="btn btn-primary" data-action="download-all">Download All (${downloadableCount})</button>
                    `;
                } else if (downloadableCount > 0) {
                    html = `<button class="btn btn-primary" data-action="download-all">Download All (${downloadableCount})</button>`;
                }
            }
        }

        this.controlsContainer.innerHTML = html;
    }

    private syncMasterCheckbox() {
        const masterCheckbox = this.container?.querySelector('.master-checkbox') as HTMLInputElement;
        if (!masterCheckbox) return;

        const allItems = videoStore.getAllItems();
        const selectedCount = videoStore.getSelectedCount();

        masterCheckbox.checked = selectedCount === allItems.length && allItems.length > 0;
        masterCheckbox.indeterminate = selectedCount > 0 && selectedCount < allItems.length;
    }

    private toggleGroup(groupId: string) {
        const groupEl = this.listContainer?.querySelector(`[data-group-id="${groupId}"].playlist-group`) as HTMLElement;
        if (!groupEl) return;
        groupEl.classList.toggle('collapsed');
        const icon = groupEl.querySelector('.collapse-icon');
        if (icon) {
            icon.textContent = groupEl.classList.contains('collapsed') ? '▶' : '▼';
        }
    }
}

export const multipleDownloadRenderer = new MultipleDownloadRenderer();
