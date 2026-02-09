
import { RendererStrategy } from './renderer-strategy.interface';
import { VideoItem } from '../../state/multiple-download-types';
import { isMobileDevice } from '../../../../utils';

/**
 * Strategy for Multi-Download Mode (Batch - badges)
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
            case 'pending': return '<span class="status-badge pending">Pending</span>';
            case 'analyzing': return '<span class="status-badge analyzing">Analyzing...</span>';
            case 'fetching_metadata': return '<span class="status-badge analyzing">Fetching info...</span>';
            case 'ready':
                return '<span class="status-badge ready">Ready</span>';
            case 'queued': return '<span class="status-badge pending">Queued</span>';
            case 'downloading': return `<span class="status-badge downloading">Downloading... ${Math.round(item.progress)}%</span>`;
            case 'converting': {
                const phaseText = item.progressPhase === 'merging' ? 'Merging' :
                    item.progressPhase === 'extracting' ? 'Extracting' : 'Converting';
                return `<span class="status-badge converting">${phaseText}... ${Math.round(item.progress)}%</span>`;
            }
            case 'completed':
                return item.isDownloaded
                    ? '<span class="status-badge success">Downloaded</span>'
                    : '<span class="status-badge success">Ready</span>';
            case 'error': return '<span class="status-badge error">Failed</span>';
            case 'cancelled': return '<span class="status-badge cancelled">Cancelled</span>';
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
                    <span class="icon-trash">🗑</span>
                </button>
            `;
        }

        if (item.status === 'error') {
            return `
                <button class="btn-icon btn-retry" data-action="retry" data-id="${item.id}" title="Retry">↻</button>
                <button class="btn-icon btn-remove" data-action="remove" data-id="${item.id}" title="Remove">
                    <span class="icon-trash">🗑</span>
                </button>
            `;
        }

        return `
            <button class="btn-icon btn-remove" data-action="remove" data-id="${item.id}" title="Remove">
                <span class="icon-trash">🗑</span>
            </button>
        `;
    }

    private getMobileActionButton(item: VideoItem): string {
        if (item.status === 'downloading' || item.status === 'converting') {
            return '';
        }

        if (item.status === 'completed' && item.downloadUrl) {
            return `
                <a href="${item.downloadUrl}" class="btn-icon btn-download" download title="Download">
                    <span class="icon-download">⬇</span>
                </a>
            `;
        }

        if (item.status === 'error') {
            return `<button class="btn-icon btn-retry" data-action="retry" data-id="${item.id}" title="Retry">↻</button>`;
        }

        return '';
    }
}
