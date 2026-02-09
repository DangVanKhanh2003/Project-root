
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
        });
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
        const icon = groupEl.querySelector('.collapse-icon');
        if (icon) {
            icon.textContent = groupEl.classList.contains('collapsed') ? '▶' : '▼';
        }
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
