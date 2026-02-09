
import { getState, setRenderCallback } from '../../state/index';
import { MultipleDownloadsState, VideoItem } from '../../state/multiple-download-types';
import { removeVideoItem, updateVideoItem } from '../../state/multiple-download-actions';
import { multiDownloadService } from '../../logic/multiple-download/services/multi-download-service';
import { VideoItemRenderer } from './video-item-renderer';

export class MultipleDownloadRenderer {
    private container: HTMLElement | null = null;
    private listContainer: HTMLElement | null = null;
    private controlsContainer: HTMLElement | null = null;
    private isInitialized = false;

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
            // Note: In strict architecture, state-manager calls a global render function which delegates.
            // Here we might need to hook into that or start our own subscription.
            // ssvid.cc seems to use `setRenderCallback` in `ui-renderer.ts`.
            // We can check if we can add a listener or if we need to be called by `ui-renderer`.
            // For now, let's expose a render method that can be called.
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
                this.render(); // Re-render immediately
            } else if (action === 'cancel' && id) {
                multiDownloadService.cancelDownload(id);
            } else if (action === 'download-all') {
                multiDownloadService.startDownload();
            } else if (action === 'cancel-all') {
                multiDownloadService.cancelDownload();
            }
        });
    }

    render() {
        if (!this.isInitialized || !this.container || !this.listContainer || !this.controlsContainer) return;

        const state = getState();
        // Check if multiple downloads are enabled/active
        if (!state.isEnabled && state.items.length === 0) {
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'block';

        // Render List
        if (state.items.length === 0) {
            this.listContainer.innerHTML = '<div class="empty-list">No videos added yet.</div>';
        } else {
            this.listContainer.innerHTML = state.items.map(item => VideoItemRenderer.render(item)).join('');
        }

        // Render Controls (Download All button, etc.)
        this.renderControls(state);
    }

    private renderControls(state: any) { // Type should be AppState/MultipleDownloadsState
        if (!this.controlsContainer) return;

        const isDownloading = state.globalStatus === 'downloading' || state.globalStatus === 'analyzing';
        const hasItems = state.items.length > 0;

        let html = '';

        if (hasItems) {
            if (isDownloading) {
                html = `
                    <button class="btn btn-danger" data-action="cancel-all">Cancel All</button>
                    ${state.isZipAvailable && state.zipUrl ? `<a href="${state.zipUrl}" class="btn btn-success" download>Download ZIP</a>` : ''}
                 `;
            } else {
                html = `
                    <button class="btn btn-primary" data-action="download-all">Download All (${state.items.length})</button>
                 `;
            }
        }

        this.controlsContainer.innerHTML = html;
    }
}

export const multipleDownloadRenderer = new MultipleDownloadRenderer();
