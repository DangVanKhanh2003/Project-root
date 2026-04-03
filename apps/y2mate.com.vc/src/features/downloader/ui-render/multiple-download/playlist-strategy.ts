
import { RendererStrategy } from './renderer-strategy.interface';
import { VideoItem } from '../../state/multiple-download-types';
import { isMobileDevice } from '../../../../utils';
import { escapeAttr } from './video-item-renderer';
import { LANGUAGES } from '../../logic/data/languages';
import { autoResizeSelect } from '../../../../utils/dom-utils';
import { syncCustomVideoGroupDropdown } from '../video-group-dropdown';

/**
 * Strategy for Playlist Mode
 * Editable dropdowns when pending/ready/error, locked badges when downloading/completed
 */
export class PlaylistStrategy implements RendererStrategy {

    afterRender(el: HTMLElement, item: VideoItem): void {
        const selects = el.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
        selects.forEach(select => {
            autoResizeSelect(select);
            // Also resize on change
            if (!(select as any)._hasResizeListener) {
                select.addEventListener('change', () => autoResizeSelect(select));
                (select as any)._hasResizeListener = true;
            }
        });

        const videoQualitySelect = el.querySelector('select.item-quality-select[data-field="quality"]') as HTMLSelectElement | null;
        if (videoQualitySelect) {
            syncCustomVideoGroupDropdown(videoQualitySelect, {
                valueMode: 'p',
                dropdownClassName: 'item-video-group-dropdown',
            });
        }
    }

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
            case 'ready': return '<span class="status-badge ready">Ready</span>';
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
    // Private
    // ==========================================

    private buildEditableSettings(item: VideoItem): string {
        const format = item.settings?.format || 'mp4';
        const rawQuality = item.settings?.quality || '720p';
        const quality = /^(webm|mkv)$/.test(rawQuality) ? `${rawQuality}-720p` : rawQuality;

        const formatSelect = `
            <select class="item-format-select" data-id="${item.id}" data-field="format">
                <option value="mp4" ${format === 'mp4' ? 'selected' : ''}>MP4</option>
                <option value="mp3" ${format === 'mp3' ? 'selected' : ''}>MP3</option>
            </select>`;

        let qualitySelect = '';
        if (format === 'mp4') {
            qualitySelect = `
                <select class="item-quality-select" data-id="${item.id}" data-field="quality">
                    <optgroup label="MP4">
                        <option value="2160p" ${quality === '2160p' ? 'selected' : ''}>mp4 - 4K</option>
                        <option value="1440p" ${quality === '1440p' ? 'selected' : ''}>mp4 - 2K</option>
                        <option value="1080p" ${quality === '1080p' ? 'selected' : ''}>mp4 - 1080p</option>
                        <option value="720p" ${quality === '720p' ? 'selected' : ''}>mp4 - 720p</option>
                        <option value="480p" ${quality === '480p' ? 'selected' : ''}>mp4 - 480p</option>
                        <option value="360p" ${quality === '360p' ? 'selected' : ''}>mp4 - 360p</option>
                        <option value="144p" ${quality === '144p' ? 'selected' : ''}>mp4 - 144p</option>
                    </optgroup>
                    <optgroup label="WEBM">
                        <option value="webm-2160p" ${quality === 'webm-2160p' ? 'selected' : ''}>webm - 4K</option>
                        <option value="webm-1440p" ${quality === 'webm-1440p' ? 'selected' : ''}>webm - 2K</option>
                        <option value="webm-1080p" ${quality === 'webm-1080p' ? 'selected' : ''}>webm - 1080p</option>
                        <option value="webm-720p" ${quality === 'webm-720p' ? 'selected' : ''}>webm - 720p</option>
                        <option value="webm-480p" ${quality === 'webm-480p' ? 'selected' : ''}>webm - 480p</option>
                        <option value="webm-360p" ${quality === 'webm-360p' ? 'selected' : ''}>webm - 360p</option>
                        <option value="webm-144p" ${quality === 'webm-144p' ? 'selected' : ''}>webm - 144p</option>
                    </optgroup>
                    <optgroup label="MKV">
                        <option value="mkv-2160p" ${quality === 'mkv-2160p' ? 'selected' : ''}>mkv - 4K</option>
                        <option value="mkv-1440p" ${quality === 'mkv-1440p' ? 'selected' : ''}>mkv - 2K</option>
                        <option value="mkv-1080p" ${quality === 'mkv-1080p' ? 'selected' : ''}>mkv - 1080p</option>
                        <option value="mkv-720p" ${quality === 'mkv-720p' ? 'selected' : ''}>mkv - 720p</option>
                        <option value="mkv-480p" ${quality === 'mkv-480p' ? 'selected' : ''}>mkv - 480p</option>
                        <option value="mkv-360p" ${quality === 'mkv-360p' ? 'selected' : ''}>mkv - 360p</option>
                        <option value="mkv-144p" ${quality === 'mkv-144p' ? 'selected' : ''}>mkv - 144p</option>
                    </optgroup>
                </select>`;
        } else {
            const bitrate = item.settings?.audioBitrate || '128';
            const audioFormat = item.settings?.audioFormat || 'mp3';
            const legacyFormatBitrate = ['wav', 'm4a', 'ogg', 'opus', 'flac'].includes(bitrate) ? bitrate : '';
            const selectedAudioValue = legacyFormatBitrate || (audioFormat === 'mp3' ? `mp3-${bitrate}` : audioFormat);
            qualitySelect = `
                <select class="item-quality-select" data-id="${item.id}" data-field="audioChoice">
                    <option value="mp3-320" ${selectedAudioValue === 'mp3-320' ? 'selected' : ''}>MP3 - 320kbps</option>
                    <option value="mp3-192" ${selectedAudioValue === 'mp3-192' ? 'selected' : ''}>MP3 - 192kbps</option>
                    <option value="mp3-128" ${selectedAudioValue === 'mp3-128' ? 'selected' : ''}>MP3 - 128kbps</option>
                    <option value="mp3-64" ${selectedAudioValue === 'mp3-64' ? 'selected' : ''}>MP3 - 64kbps</option>
                    <option value="wav" ${selectedAudioValue === 'wav' ? 'selected' : ''}>WAV - 128kbps</option>
                    <option value="m4a" ${selectedAudioValue === 'm4a' ? 'selected' : ''}>M4A - 128kbps</option>
                    <option value="ogg" ${selectedAudioValue === 'ogg' ? 'selected' : ''}>OGG - 128kbps</option>
                    <option value="opus" ${selectedAudioValue === 'opus' ? 'selected' : ''}>Opus - 128kbps</option>
                    <option value="flac" ${selectedAudioValue === 'flac' ? 'selected' : ''}>FLAC - 128kbps</option>
                </select>`;
        }

        const track = item.settings?.audioTrack || 'original';
        const available = item.availableAudioLanguages;
        const langList = (available && available.length > 1) ? available : LANGUAGES.map(l => l.code);
        const options = langList.map(code => {
            const label = LANGUAGES.find(l => l.code.toLowerCase() === code.toLowerCase())?.name || code.toUpperCase();
            const selected = code.toLowerCase() === track.toLowerCase() ? 'selected' : '';
            return `<option value="${code}" ${selected}>${label}</option>`;
        }).join('');
        const trackHtml = `<select class="item-audio-track-select" data-id="${item.id}" data-field="audioTrack">${options}</select>`;

        return `${formatSelect}${qualitySelect}${trackHtml}`;
    }

    private buildLockedSettings(item: VideoItem): string {
        const baseFormat = (item.settings?.format || 'mp4').toLowerCase();
        const quality = item.settings?.quality || '720p';
        const audioTrack = item.settings?.audioTrack;

        // Only show audio track if it's explicitly set and not 'original'
        const trackLabel = (audioTrack && audioTrack !== 'original') ? ` - ${audioTrack.toUpperCase()}` : '';

        const display = baseFormat === 'mp3'
            ? getAudioDisplay(item.settings?.audioFormat, item.settings?.audioBitrate)
            : getVideoDisplay(quality, baseFormat);

        return `<span class="item-setting-text">${display.format} - ${display.details}${trackLabel}</span>`;
    }

    private getDesktopActionButton(item: VideoItem, context: { isFileDownloading?: boolean, currentDownloadingItemId?: string, isGlobalLocked?: boolean }): string {
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
            const isLocked = !!context.isGlobalLocked;
            const isLoading = context.currentDownloadingItemId === item.id;
            const classes = ['btn-download-multi-download', isDownloaded && !isLoading ? 'is-success' : '', isLocked ? 'is-disabled' : '', isLoading ? 'is-loading' : ''].filter(Boolean).join(' ');
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
            return `
                <button class="btn-icon btn-cancel" data-action="cancel" data-id="${item.id}" title="Cancel">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            `;
        }

        if (item.status === 'completed' && item.downloadUrl) {
            const filename = `${item.meta.title} (${item.settings?.quality || item.settings?.audioBitrate || ''}).${item.settings?.format || 'mp4'}`;
            const isDownloaded = item.isDownloaded;
            const isLocked = !!context.isGlobalLocked;
            const isLoading = context.currentDownloadingItemId === item.id;
            const classes = ['btn-download-multi-download', isDownloaded && !isLoading ? 'is-success' : '', isLocked ? 'is-disabled' : '', isLoading ? 'is-loading' : ''].filter(Boolean).join(' ');
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

        if (item.status === 'ready') {
            const isLocked = context.isGlobalLocked;
            const disabledAttr = isLocked ? 'disabled' : '';
            return `
                <button class="btn-download-multi-download is-outline" type="button" data-action="convert" data-id="${item.id}" ${disabledAttr}>
                    <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="15"></line>
                        <polyline points="8 11 12 15 16 11"></polyline>
                        <line x1="6" y1="19" x2="18" y2="19"></line>
                    </svg>
                    <span class="btn-text">Convert</span>
                </button>
            `;
        }

        if (item.status === 'error' || item.status === 'expired') {
            return `<button class="btn-retry" data-action="retry" data-id="${item.id}">Retry</button>`;
        }

        return '';
    }
}

function getVideoDisplay(quality: string, fallbackFormat: string): { format: string; details: string } {
    const normalizedQuality = (quality || '720p').toLowerCase();
    const grouped = normalizedQuality.match(/^(webm|mkv)-(\d+p)$/);
    if (grouped) {
        return { format: grouped[1].toUpperCase(), details: normalizeResolutionLabel(grouped[2]) };
    }

    const plain = normalizedQuality.match(/^(\d+)p$/);
    if (plain) {
        return { format: fallbackFormat.toUpperCase(), details: normalizeResolutionLabel(`${plain[1]}p`) };
    }

    return { format: fallbackFormat.toUpperCase(), details: quality };
}

function getAudioDisplay(audioFormat: string | undefined, bitrate: string | undefined): { format: string; details: string } {
    const normalizedFormat = (audioFormat || 'mp3').toLowerCase();
    if (normalizedFormat !== 'mp3') {
        return { format: normalizedFormat.toUpperCase(), details: '128kbps' };
    }

    const numericBitrate = Number(bitrate || '128');
    const resolved = Number.isNaN(numericBitrate) ? '128' : String(numericBitrate);
    return { format: 'MP3', details: `${resolved}kbps` };
}

function normalizeResolutionLabel(resolution: string): string {
    const normalized = (resolution || '').toLowerCase();
    if (normalized === '2160p') return '4K';
    if (normalized === '1440p') return '2K';
    return normalized;
}





