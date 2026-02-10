
import { videoStore } from '../../state/video-store';
import { multiDownloadService } from '../../logic/multiple-download/services/multi-download-service';
import { VideoItemRenderer } from './video-item-renderer';
import { MultiDownloadStrategy } from './multi-download-strategy';
import { PlaylistStrategy } from './playlist-strategy';
import { RendererStrategy } from './renderer-strategy.interface';
import { createStoreChangeHandler, updateGroupCount } from './handle-store-change';
import { isMobileDevice } from '../../../../utils';

export class MultipleDownloadRenderer {
    private container: HTMLElement | null = null;
    private listContainer: HTMLElement | null = null;
    private isInitialized = false;
    private isPlaylistMode: boolean = false;
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
            this.updateBatchHeader();
        });
    }

    private updateBatchHeader() {
        const headerEl = this.container?.querySelector('#multi-batch-header') as HTMLElement;
        if (!headerEl) return;

        // Only show batch header if there are items NOT in a group
        const items = videoStore.getAllItems().filter(i => !i.groupId);
        if (items.length === 0) {
            headerEl.style.display = 'none';
            return;
        }

        headerEl.style.display = 'flex';

        const selectedCount = items.filter(i => i.isSelected).length;
        const allSelected = items.length > 0 && selectedCount === items.length;
        const completedSelectedCount = items.filter(i => i.status === 'completed' && i.isSelected).length;

        headerEl.innerHTML = `
            <div class="multi-header-top-row">
                <p class="multi-header-title">Multiple download</p>
                <span class="item-count-total">${items.length} items</span>
            </div>
            <div class="multiple-download-group-actions">
                <label class="group-selection-label">
                    <input type="checkbox" class="multiple-download-checkbox" id="masterCheckbox" aria-label="Select all" ${allSelected ? 'checked' : ''}>
                    <span class="group-selection-text" id="multiDownloadSelectedCount">${selectedCount} selected</span>
                </label>
                <button type="button" class="group-download-btn btn-success" id="multiDownloadActionBtn" data-action="download-zip-batch" ${completedSelectedCount === 0 ? 'disabled' : ''}>
                    <svg class="btn-icon-zip" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550.801 550.801" aria-hidden="true" width="16" height="16" style="margin-right: 8px; vertical-align: middle;">
                        <path fill="currentColor" d="M475.095,131.992c-0.032-2.526-0.833-5.021-2.568-6.993L366.324,3.694c-0.021-0.034-0.053-0.045-0.084-0.076c-0.633-0.707-1.36-1.29-2.141-1.804c-0.232-0.15-0.465-0.285-0.707-0.422c-0.686-0.366-1.393-0.67-2.131-0.892c-0.2-0.058-0.379-0.14-0.58-0.192C359.87,0.114,359.047,0,358.203,0H97.2C85.292,0,75.6,9.693,75.6,21.601v507.6c0,11.913,9.692,21.601,21.6,21.601H453.6c11.918,0,21.601-9.688,21.601-21.601V133.202C475.2,132.796,475.137,132.398,475.095,131.992z M243.599,523.494H141.75v-15.936l62.398-89.797v-0.785h-56.565v-24.484h95.051v17.106l-61.038,88.636v0.771h62.002V523.494z M292.021,523.494h-29.744V392.492h29.744V523.494z M399.705,463.44c-10.104,9.524-25.069,13.796-42.566,13.796c-3.893,0-7.383-0.19-10.104-0.58v46.849h-29.352V394.242c9.134-1.561,21.958-2.721,40.036-2.721c18.277,0,31.292,3.491,40.046,10.494c8.354,6.607,13.996,17.486,13.996,30.322C411.761,445.163,407.479,456.053,399.705,463.44z M97.2,366.752V21.601h129.167v-3.396h32.756v3.396h88.28v110.515c0,5.961,4.831,10.8,10.8,10.8H453.6ll.011,223.836H97.2z"></path>
                    </svg>
                    Download select (${completedSelectedCount})
                </button>
            </div>
        `;
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
                case 'retry':
                    if (id) multiDownloadService.retryDownload(id);
                    break;
                case 'convert':
                    if (id) multiDownloadService.startDownload(id);
                    break;
                case 'toggle-group':
                    if (groupId) this.toggleGroup(groupId);
                    break;
                case 'download-group':
                    if (groupId) {
                        multiDownloadService.startSelectedGroupDownloads(groupId);
                        this.switchToTab(groupId, 'download');
                    }
                    break;
                case 'download-zip-group':
                    if (groupId) this.handleDownloadZipGroup(groupId, actionBtn);
                    break;
                case 'remove-group':
                    if (groupId) multiDownloadService.removeGroup(groupId);
                    break;
                case 'playlist-tab':
                    if (groupId) this.handleTabClick(target, groupId);
                    break;
                case 'download-zip-batch':
                    this.handleDownloadZipBatch(actionBtn);
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

            // Master checkbox for batch
            if (target.id === 'masterCheckbox') {
                const checked = (target as HTMLInputElement).checked;
                const items = videoStore.getAllItems().filter(i => !i.groupId);
                items.forEach(item => {
                    if (item.isSelected !== checked) {
                        videoStore.toggleSelect(item.id);
                    }
                });
            }
        });
    }

    private async handleDownloadZipBatch(btn: HTMLElement) {
        if (!(btn instanceof HTMLButtonElement)) return;

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Creating ZIP...';

        try {
            const completedIds = videoStore.getAllItems()
                .filter(i => !i.groupId && i.status === 'completed' && i.isSelected)
                .map(i => i.id);

            if (completedIds.length === 0) {
                throw new Error('No selected completed items');
            }

            const downloadUrl = await multiDownloadService.createZipDownload(completedIds);

            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            alert(error.message || 'Failed to create ZIP');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
            this.updateBatchHeader();
        }
    }

    private async handleDownloadZipGroup(groupId: string, btn: HTMLElement) {
        if (!(btn instanceof HTMLButtonElement)) return;

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Creating ZIP...';

        try {
            const completedIds = videoStore.getItemsByGroup(groupId)
                .filter(i => i.status === 'completed' && i.isSelected)
                .map(i => i.id);

            if (completedIds.length === 0) {
                throw new Error('No selected completed items in this group');
            }

            const downloadUrl = await multiDownloadService.createZipDownload(completedIds);

            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            alert(error.message || 'Failed to create ZIP');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }


    private toggleGroup(groupId: string) {
        const groupEl = this.listContainer?.querySelector(`[data-group-id="${groupId}"].playlist-group`) as HTMLElement;
        if (!groupEl) return;
        groupEl.classList.toggle('collapsed');
    }

    private handleTabClick(tabEl: HTMLElement, groupId: string) {
        const tabType = tabEl.dataset.tab;
        if (tabType) {
            this.switchToTab(groupId, tabType);
        }
    }

    private switchToTab(groupId: string, tabType: string) {
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

        // Update glider position
        const glider = groupEl.querySelector('.tab-glider') as HTMLElement;
        if (glider) {
            glider.style.width = `${tabEl.offsetWidth}px`;
            glider.style.transform = `translateX(${tabEl.offsetLeft}px)`;
        }

        // Trigger re-filtering
        updateGroupCount(groupEl);
    }
}

export const multipleDownloadRenderer = new MultipleDownloadRenderer();

