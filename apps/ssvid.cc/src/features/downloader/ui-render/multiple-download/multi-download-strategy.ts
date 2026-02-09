
import { RendererStrategy } from './renderer-strategy.interface';
import { VideoItem } from '../../state/multiple-download-types';
import { isMobileDevice } from '../../../../utils';

/**
 * Strategy for Multi-Download Mode (Badges)
 */
export class MultiDownloadStrategy implements RendererStrategy {

    buildSettingsContent(item: VideoItem): string {
        const format = (item.settings?.format || 'mp4').toUpperCase();
        const quality = item.settings?.quality || '720p';
        return `<span class="item-setting-text">${format} · ${quality}</span>`;
    }

    getSettingsClass(item: VideoItem): string {
        return ' is-badges';
    }

    getCheckboxHtml(item: VideoItem): string {
        if (isMobileDevice()) return '';

        // Desktop: Show checkbox for selectable items
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
            return this.getMobileActionButton(item, context);
        }
        return this.getDesktopActionButton(item);
    }

    getStatusHtml(item: VideoItem): string {
        switch (item.status) {
            case 'pending': return '<span class="status-badge pending">Pending</span>';
            case 'analyzing': return '<span class="status-badge analyzing">Analyzing...</span>';
            case 'fetching_metadata': return '<span class="status-badge analyzing">Fetching info...</span>';
            case 'ready':
                return `<span class="status-badge ready">Ready</span>`;
            case 'queued': return '<span class="status-badge pending">Queued</span>';
            case 'downloading': return `<span class="status-badge downloading">Downloading... ${Math.round(item.progress)}%</span>`;
            case 'converting': return `<span class="status-badge converting">Converting...</span>`;
            case 'completed': return '<span class="status-badge success">Completed</span>';
            case 'error': return '<span class="status-badge error">Failed</span>';
            case 'cancelled': return '<span class="status-badge cancelled">Cancelled</span>';
            default: return '';
        }
    }

    // ==========================================
    // Private Helpers
    // ==========================================

    private getDesktopActionButton(item: VideoItem): string {
        // Desktop: Show Trash for removing items
        // If downloading, show Cancel
        if (item.status === 'downloading' || item.status === 'converting') {
            return `
                <button class="btn-icon btn-cancel" data-action="cancel" data-id="${item.id}" title="Cancel">
                    <span class="icon-cancel">✕</span>
                </button>
            `;
        }

        if (item.status === 'completed' && item.downloadUrl) {
            return `
                <a href="${item.downloadUrl}" class="btn-icon btn-download" download target="_blank" title="Download">
                    <span class="icon-download">⬇</span>
                </a>
            `;
        }

        return `
            <button class="btn-icon btn-remove" data-action="remove" data-id="${item.id}" title="Remove">
                <span class="icon-trash">🗑</span>
            </button>
        `;
    }

    private getMobileActionButton(item: VideoItem, context: { isFileDownloading?: boolean, currentDownloadingItemId?: string }): string {
        // Mobile: Show Download button when ready/completed
        // Hide Trash to save space
        if (item.status === 'downloading' || item.status === 'converting') {
            // Mobile might not show cancel button per item to save space, or show it?
            // Based on ytmp3.gg, it hides buttons during download or shows spinner
            return '';
        }

        if (item.status === 'completed' && item.downloadUrl) {
            return `
                <a href="${item.downloadUrl}" class="btn-icon btn-download" download target="_blank" title="Download">
                    <span class="icon-download">⬇</span>
                </a>
            `;
        }

        // In Multi-mode mobile, we often just want a big "Download" button if it's ready
        // But ytmp3.gg logic says: 
        // "MOBILE: Traditional individual download button" for 'completed'
        // For 'ready', it might return empty string if using global download

        if (item.status === 'ready') {
            // Check ytmp3.gg logic:
            // case 'ready': if (isMobile) return '';
            // So we return empty, user uses "Download All" or similar?
            // Wait, ytmp3.gg says: "MOBILE: Traditional individual download button" ONLY for completed?
            // Let's re-read the provided code for ytmp3.gg video-item-multi-download.js
            // 60: case 'ready':
            // 61:    if (isMobile) return '';
            return '';
        }

        // Error retry
        if (item.status === 'error') {
            return `<button class="btn-icon btn-retry" data-action="retry" data-id="${item.id}" title="Retry">↻</button>`;
        }

        return '';
    }
}
