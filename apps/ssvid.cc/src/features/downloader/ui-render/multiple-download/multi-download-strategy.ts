
import { RendererStrategy } from './renderer-strategy.interface';
import { VideoItem } from '../../state/multiple-download-types';
import { isMobileDevice } from '../../../../utils';
import { escapeAttr } from './video-item-renderer';

/**
 * Strategy for Multi-Download Mode (Batch - badges)
 */
export class MultiDownloadStrategy implements RendererStrategy {

    buildSettingsContent(item: VideoItem): string {
        const format = (item.settings?.format || 'mp4').toUpperCase();
        const quality = item.settings?.quality || '720p';
        const audioTrack = item.settings?.audioTrack;

        // Only show audio track if it's explicitly set and not 'original'
        const trackLabel = (audioTrack && audioTrack !== 'original') ? ` · ${audioTrack.toUpperCase()}` : '';

        return `<span class="item-setting-text">${format} · ${quality}${trackLabel}</span>`;
    }

    getSettingsClass(item: VideoItem): string {
        return ' is-badges';
    }

    getCheckboxHtml(item: VideoItem): string {
        if (isMobileDevice()) return '';

        const isSelectable = ['ready', 'error', 'cancelled', 'completed'].includes(item.status);
        const disabledAttr = isSelectable ? '' : 'disabled';
        const checkedAttr = item.isSelected ? 'checked' : '';

        return `
            <div class="item-checkbox-wrapper">
                <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${checkedAttr} ${disabledAttr}>
            </div>`;
    }

    getActionButton(item: VideoItem, context: { isFileDownloading?: boolean, currentDownloadingItemId?: string } = {}): string {
        if (isMobileDevice()) {
            return this.getMobileActionButton(item);
        }
        return this.getDesktopActionButton(item);
    }

    getStatusHtml(item: VideoItem): string {
        switch (item.status) {
            case 'pending': return '<span class="status-badge is-right pending">Pending</span>';
            case 'ready':
                return '<span class="status-badge is-right ready">Ready</span>';
            case 'queued': return '<span class="status-badge is-right pending">Queued</span>';
            case 'completed':
                return item.isDownloaded
                    ? '<span class="status-badge is-right success">Downloaded</span>'
                    : '<span class="status-badge is-right success">Ready</span>';
            case 'error': return '<span class="status-badge is-right error">Failed</span>';
            case 'cancelled': return '<span class="status-badge is-right cancelled">Cancelled</span>';
            default: return '';
        }
    }

    getPhaseHtml(item: VideoItem): string {
        switch (item.status) {
            case 'analyzing': return 'Analyzing...';
            case 'fetching_metadata': return 'Fetching info...';
            case 'downloading': return 'Downloading...';
            case 'converting': {
                const phaseText = item.progressPhase === 'merging' ? 'Merging' :
                    item.progressPhase === 'extracting' ? 'Extracting' : 'Converting';
                return `${phaseText}...`;
            }
            default: return '';
        }
    }

    // ==========================================
    // Private Helpers
    // ==========================================

    private getDesktopActionButton(item: VideoItem): string {
        if (item.status === 'downloading' || item.status === 'converting') {
            return `
                <button class="btn-icon btn-cancel" data-action="cancel" data-id="${item.id}" title="Cancel">
                    <span class="icon-cancel">✕</span>
                </button>
            `;
        }

        if (item.status === 'completed' && item.downloadUrl) {
            return `
                <button class="btn-icon btn-remove" data-action="remove" data-id="${item.id}" title="Remove">
                    <span class="icon-trash">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </span>
                </button>
            `;
        }

        if (item.status === 'error') {
            return `
                <button class="btn-icon btn-retry" data-action="retry" data-id="${item.id}" title="Retry">↻</button>
                <button class="btn-icon btn-remove" data-action="remove" data-id="${item.id}" title="Remove">
                    <span class="icon-trash">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </span>
                </button>
            `;
        }

        return `
            <button class="btn-icon btn-remove" data-action="remove" data-id="${item.id}" title="Remove">
                <span class="icon-trash">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </span>
            </button>
        `;
    }

    private getMobileActionButton(item: VideoItem): string {
        if (item.status === 'downloading' || item.status === 'converting') {
            return '';
        }

        if (item.status === 'completed' && item.downloadUrl) {
            const filename = `${item.meta.title} (${item.settings?.quality || item.settings?.audioBitrate || ''}).${item.settings?.format || 'mp4'}`;
            return `
                <button class="btn-download-multi-download" type="button" data-action="save" data-id="${item.id}" data-download-url="${item.downloadUrl}" data-filename="${escapeAttr(filename)}">
                    <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="15"></line>
                        <polyline points="8 11 12 15 16 11"></polyline>
                        <line x1="6" y1="19" x2="18" y2="19"></line>
                    </svg>
                    <svg class="btn-icon-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"></path>
                    </svg>
                    <svg class="btn-icon-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span class="btn-text">Download</span>
                </button>
            `;
        }

        if (item.status === 'error') {
            return `<button class="btn-icon btn-retry" data-action="retry" data-id="${item.id}" title="Retry">↻</button>`;
        }

        return '';
    }
}
