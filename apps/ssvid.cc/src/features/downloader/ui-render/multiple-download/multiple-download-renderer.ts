
import { getState, setRenderCallback } from '../../state/index';
import { MultipleDownloadsState, VideoItem } from '../../state/multiple-download-types';
import { removeVideoItem, updateVideoItem } from '../../state/multiple-download-actions';
import { multiDownloadService } from '../../logic/multiple-download/services/multi-download-service';
import { VideoItemRenderer } from './video-item-renderer';
import { MultiDownloadStrategy } from './multi-download-strategy';
import { isMobileDevice } from '../../../../utils';

export class MultipleDownloadRenderer {
    private container: HTMLElement | null = null;
    private listContainer: HTMLElement | null = null;
    private controlsContainer: HTMLElement | null = null;
    private isInitialized = false;
    private strategy = new MultiDownloadStrategy();

    init() {
        if (this.isInitialized) return;

        // Create or find container
        // We assume we inject into a specific placeholder or append to main content
        // For now, let's try to find #multiple-downloads-container
        this.container = document.getElementById('multiple-downloads-container');

        if (!this.container) {
            // Fallback: create it and append to main content area if possible
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
            this.isInitialized = true;

            // Subscribe to state changes
            setRenderCallback((state) => {
                this.render();
            });
        }
    }

    private renderStructure() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="multi-download-header">
                <h2>Multiple Downloads</h2>
                <div class="multi-download-controls" id="multi-controls"></div>
            </div>
            <div class="multi-download-list" id="multi-list"></div>
            <div class="multi-download-footer" id="multi-footer"></div>
        `;

        this.listContainer = this.container.querySelector('#multi-list');
        this.controlsContainer = this.container.querySelector('#multi-controls');
    }

    private bindEvents() {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const actionBtn = target.closest('[data-action]') as HTMLElement;

            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.id;

            if (action === 'remove' && id) {
                removeVideoItem(id);
                // State update triggers render via callback
            } else if (action === 'cancel' && id) {
                multiDownloadService.cancelDownload(id);
            } else if (action === 'download-all') {
                multiDownloadService.startDownload();
            } else if (action === 'cancel-all') {
                multiDownloadService.cancelDownload();
            } else if (action === 'retry' && id) {
                // Retry logic (add to service if needed, currently assumes addUrls or startDownload)
                multiDownloadService.startDownload(id);
            } else if (action === 'save' && id) {
                // Mobile explicit download button
                // In strategy we used <a> tag with download attribute for completed items
                // But if it's a button with data-action="save", we handle it here
                multiDownloadService.startDownload(id);
            }
        });
    }

    render() {
        if (!this.isInitialized || !this.container || !this.listContainer || !this.controlsContainer) return;

        const state = getState();
        // Check if multiple downloads are enabled/active
        if (!state.isEnabled && (!state.items || state.items.length === 0)) {
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'block';

        // Render List
        if (!state.items || state.items.length === 0) {
            this.listContainer.innerHTML = '<div class="empty-list">No videos added yet.</div>';
        } else {
            this.listContainer.innerHTML = state.items.map(item => VideoItemRenderer.render(item, this.strategy)).join('');
        }

        // Render Controls (Download All button, etc.)
        this.renderControls(state);
    }

    private renderControls(state: any) { // Type should be AppState/MultipleDownloadsState
        if (!this.controlsContainer) return;

        const isDownloading = state.globalStatus === 'downloading' || state.globalStatus === 'analyzing';
        const hasItems = state.items && state.items.length > 0;
        const isMobile = isMobileDevice();

        let html = '';

        if (hasItems) {
            if (isDownloading) {
                // Basic Cancel All
                html = `
                    <button class="btn btn-danger" data-action="cancel-all">Cancel All</button>
                    ${state.isZipAvailable && state.zipUrl ? `<a href="${state.zipUrl}" class="btn btn-success" download>Download ZIP</a>` : ''}
                 `;
            } else {
                // Mobile: Hide "Download All" if we want them to click individual buttons?
                // Or keep it as "Batch Download"?
                // ytmp3.gg hides header controls on mobile.
                if (isMobile) {
                    html = ''; // Hide controls on mobile as per ytmp3.gg logic
                } else {
                    html = `
                        <button class="btn btn-primary" data-action="download-all">Download All (${state.items.length})</button>
                    `;
                }
            }
        }

        this.controlsContainer.innerHTML = html;

        // Hide header if no controls and no title needed? 
        // ytmp3.gg: "Header (Download All) ... Ẩn hoàn toàn".
        // If html is empty, maybe hiding the container padding validation?
        // Let's keep it simple for now.
    }
}

export const multipleDownloadRenderer = new MultipleDownloadRenderer();
