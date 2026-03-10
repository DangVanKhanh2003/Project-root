
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

        const details = format === 'MP3'
            ? formatAudioDetail(item.settings?.audioBitrate, item.settings?.audioFormat)
            : quality;

        return `<span class="item-setting-text">${format} · ${details}${trackLabel}</span>`;
    }

    getSettingsClass(item: VideoItem): string {
        return ' is-badges';
    }

    getCheckboxHtml(item: VideoItem): string {
        const isSelectable = ['ready', 'expired', 'error', 'cancelled', 'completed'].includes(item.status);
        const disabledAttr = isSelectable ? '' : 'disabled';
        const checkedAttr = item.isSelected ? 'checked' : '';

        return `
            <div class="item-checkbox-wrapper">
                <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${checkedAttr} ${disabledAttr}>
            </div>`;
    }

    getActionButton(item: VideoItem, context: { isFileDownloading?: boolean, currentDownloadingItemId?: string, isGlobalLocked?: boolean } = {}): string {
        if (isMobileDevice()) {
            return this.getMobileActionButton(item, context);
        }
        return this.getDesktopActionButton(item, context);
    }

    getStatusHtml(item: VideoItem): string {
        switch (item.status) {
            case 'pending': return '<span class="status-badge pending">Pending</span>';
            case 'ready':
                return '<span class="status-badge ready">Ready</span>';
            case 'queued': return '<span class="status-badge pending">Queued</span>';
            case 'completed':
                return item.isDownloaded
                    ? '<span class="status-badge success">Downloaded</span>'
                    : '<span class="status-badge success">Ready</span>';
            case 'expired': return '<span class="status-badge expired">Expired</span>';
            case 'error': return '<span class="status-badge error">Failed</span>';
            case 'cancelled': return '<span class="status-badge cancelled">Cancelled</span>';
            default: return '';
        }
    }

    getPhaseHtml(item: VideoItem): string {
        switch (item.status) {
            case 'analyzing': return 'Analyzing...';
            case 'fetching_metadata': return 'Fetching info...';
            case 'downloading': return 'Downloading...';
            case 'converting': {
                return 'Processing...';
            }
            case 'queued': return 'Queued...';
            default: return '';
        }
    }

    // ==========================================
    // Private Helpers
    // ==========================================

    private getDesktopActionButton(item: VideoItem, context: { isFileDownloading?: boolean, currentDownloadingItemId?: string, isGlobalLocked?: boolean }): string {
        const isLocked = !!context.isGlobalLocked;
        const isLoading = context.currentDownloadingItemId === item.id;
        const disabledAttr = isLocked ? 'disabled' : '';
        const disabledClass = isLocked ? 'is-disabled' : '';
        const loadingClass = isLoading ? 'is-loading' : '';

        if (item.status === 'downloading' || item.status === 'converting') {
            return `
                <button class="btn-icon btn-cancel" data-action="cancel" data-id="${item.id}" title="Cancel">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            `;
        }

        if (item.status === 'completed' && item.downloadUrl) {
            const filename = `${item.meta.title} (${item.settings?.quality || item.settings?.audioBitrate || ''}).${item.settings?.format || 'mp4'}`;
            const isDownloaded = item.isDownloaded;
            const classes = ['btn-download-multi-download', (isDownloaded && !isLoading) ? 'is-success' : '', disabledClass, loadingClass].filter(Boolean).join(' ');
            const label = isDownloaded ? 'Downloaded' : 'Download';

            return `
                <button class="${classes}" type="button" data-action="save" data-id="${item.id}" data-download-url="${item.downloadUrl}" data-filename="${escapeAttr(filename)}" ${disabledAttr}>
                    <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="15"></line>
                        <polyline points="8 11 12 15 16 11"></polyline>
                        <line x1="6" y1="19" x2="18" y2="19"></line>
                    </svg>
                    <svg class="btn-icon-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"></path>
                    </svg>
                    <svg class="btn-icon-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span class="btn-text">${label}</span>
                </button>
            `;
        }

        if (item.status === 'error' || item.status === 'expired') {
            return `
                <button class="btn-retry" data-action="retry" data-id="${item.id}">Retry</button>
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

    private getMobileActionButton(item: VideoItem, context: { isFileDownloading?: boolean, currentDownloadingItemId?: string, isGlobalLocked?: boolean }): string {
        if (item.status === 'downloading' || item.status === 'converting') {
            return '';
        }

        if (item.status === 'completed' && item.downloadUrl) {
            const filename = `${item.meta.title} (${item.settings?.quality || item.settings?.audioBitrate || ''}).${item.settings?.format || 'mp4'}`;
            const isDownloaded = item.isDownloaded;
            const isLocked = !!context.isGlobalLocked;
            const isLoading = context.currentDownloadingItemId === item.id;
            const classes = ['btn-download-multi-download', (isDownloaded && !isLoading) ? 'is-success' : '', isLocked ? 'is-disabled' : '', isLoading ? 'is-loading' : ''].filter(Boolean).join(' ');
            const label = isDownloaded ? 'Downloaded' : 'Download';
            const disabledAttr = isLocked ? 'disabled' : '';
            return `
                <button class="${classes}" type="button" data-action="save" data-id="${item.id}" data-download-url="${item.downloadUrl}" data-filename="${escapeAttr(filename)}" ${disabledAttr}>
                    <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="15"></line>
                        <polyline points="8 11 12 15 16 11"></polyline>
                        <line x1="6" y1="19" x2="18" y2="19"></line>
                    </svg>
                    <svg class="btn-icon-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"></path>
                    </svg>
                    <svg class="btn-icon-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span class="btn-text">${label}</span>
                </button>
            `;
        }

        if (item.status === 'error' || item.status === 'expired') {
            return `<button class="btn-retry" data-action="retry" data-id="${item.id}">Retry</button>`;
        }

        return '';
    }
}

function formatAudioDetail(bitrate: string | undefined, audioFormat: string | undefined): string {
    if (bitrate) {
        const numeric = Number(bitrate);
        if (!Number.isNaN(numeric)) {
            return numeric + 'kbps';
        }
        return bitrate.toUpperCase();
    }

    if (audioFormat && audioFormat !== 'mp3') {
        return audioFormat.toUpperCase();
    }

    return '128kbps';
}

