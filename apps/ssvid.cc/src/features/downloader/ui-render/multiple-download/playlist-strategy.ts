
import { RendererStrategy } from './renderer-strategy.interface';
import { VideoItem } from '../../state/multiple-download-types';
import { isMobileDevice } from '../../../../utils';

/**
 * Strategy for Playlist Mode
 * Editable dropdowns when pending/ready/error, locked badges when downloading/completed
 */
export class PlaylistStrategy implements RendererStrategy {

    buildSettingsContent(item: VideoItem): string {
        const isEditable = ['pending', 'ready', 'error', 'cancelled'].includes(item.status);

        if (isEditable) {
            return this.buildEditableSettings(item);
        }
        return this.buildLockedSettings(item);
    }

    getSettingsClass(item: VideoItem): string {
        const isEditable = ['pending', 'ready', 'error', 'cancelled'].includes(item.status);
        return isEditable ? ' is-dropdowns' : ' is-badges';
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
            case 'ready': return '<span class="status-badge ready">Ready</span>';
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
                    : '<span class="status-badge success">Completed</span>';
            case 'error': return '<span class="status-badge error">Failed</span>';
            case 'cancelled': return '<span class="status-badge cancelled">Cancelled</span>';
            default: return '';
        }
    }

    // ==========================================
    // Private
    // ==========================================

    private buildEditableSettings(item: VideoItem): string {
        const format = item.settings?.format || 'mp4';
        const quality = item.settings?.quality || '720p';

        const formatSelect = `
            <select class="item-format-select" data-id="${item.id}" data-field="format">
                <option value="mp4" ${format === 'mp4' ? 'selected' : ''}>MP4</option>
                <option value="mp3" ${format === 'mp3' ? 'selected' : ''}>MP3</option>
            </select>`;

        let qualitySelect = '';
        if (format === 'mp4') {
            qualitySelect = `
                <select class="item-quality-select" data-id="${item.id}" data-field="quality">
                    <option value="2160p" ${quality === '2160p' ? 'selected' : ''}>4K</option>
                    <option value="1440p" ${quality === '1440p' ? 'selected' : ''}>1440p</option>
                    <option value="1080p" ${quality === '1080p' ? 'selected' : ''}>1080p</option>
                    <option value="720p" ${quality === '720p' ? 'selected' : ''}>720p</option>
                    <option value="480p" ${quality === '480p' ? 'selected' : ''}>480p</option>
                    <option value="360p" ${quality === '360p' ? 'selected' : ''}>360p</option>
                </select>`;
        } else {
            const bitrate = item.settings?.audioBitrate || '128';
            qualitySelect = `
                <select class="item-quality-select" data-id="${item.id}" data-field="audioBitrate">
                    <option value="320" ${bitrate === '320' ? 'selected' : ''}>320kbps</option>
                    <option value="256" ${bitrate === '256' ? 'selected' : ''}>256kbps</option>
                    <option value="192" ${bitrate === '192' ? 'selected' : ''}>192kbps</option>
                    <option value="128" ${bitrate === '128' ? 'selected' : ''}>128kbps</option>
                    <option value="64" ${bitrate === '64' ? 'selected' : ''}>64kbps</option>
                </select>`;
        }

        return `${formatSelect}${qualitySelect}`;
    }

    private buildLockedSettings(item: VideoItem): string {
        const format = (item.settings?.format || 'mp4').toUpperCase();
        const quality = item.settings?.quality || '720p';
        return `<span class="item-setting-text">${format} · ${quality}</span>`;
    }

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
            return `<button class="btn-icon btn-retry" data-action="retry" data-id="${item.id}" title="Retry">↻</button>`;
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

        if (item.status === 'ready') {
            return `
                <button class="btn-icon btn-convert-single" data-action="convert" data-id="${item.id}" title="Convert">
                    <span>Convert</span>
                </button>
            `;
        }

        return '';
    }
}
