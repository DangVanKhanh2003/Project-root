
import { VideoItem } from '../../state/multiple-download-types';

/**
 * Video Item Renderer
 * Renders individual video items for the Multiple/Playlist Download list
 */
export class VideoItemRenderer {

    /**
     * Render a single video item
     */
    static render(item: VideoItem): string {
        const { id, meta, status, progress, error, settings } = item;

        const isDownloading = status === 'downloading' || status === 'converting';
        const isCompleted = status === 'completed';
        const isError = status === 'error';

        // Progress bar formatting
        const progressPercent = Math.round(progress || 0);
        const progressBarWidth = `${progressPercent}%`;

        return `
            <div class="multi-video-item ${status}" data-id="${id}">
                <div class="multi-video-thumb">
                    <img src="${escapeHtml(meta.thumbnail)}" alt="${escapeHtml(meta.title)}" loading="lazy">
                    <div class="multi-video-duration">${formatDuration(meta.duration)}</div>
                </div>
                
                <div class="multi-video-info">
                    <div class="multi-video-title" title="${escapeHtml(meta.title)}">${escapeHtml(meta.title)}</div>
                    <div class="multi-video-meta">
                        ${meta.author ? `<span class="multi-video-author">${escapeHtml(meta.author)}</span>` : ''}
                    </div>
                    
                    ${isError ? `<div class="multi-video-error">${escapeHtml(error || 'Error')}</div>` : ''}
                    
                    <div class="multi-video-status">
                        ${this.renderStatus(item)}
                    </div>
                </div>
                
                <div class="multi-video-actions">
                    ${this.renderActions(item)}
                </div>
                
                ${isDownloading ? `
                    <div class="multi-video-progress">
                        <div class="progress-bar" style="width: ${progressBarWidth}"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    private static renderStatus(item: VideoItem): string {
        switch (item.status) {
            case 'pending': return '<span class="status-badge pending">Pending</span>';
            case 'analyzing': return '<span class="status-badge">Analyzing...</span>';
            case 'ready':
                return `<span class="status-badge ready">${item.settings.format.toUpperCase()} ${item.settings.quality}</span>`;
            case 'downloading': return `<span class="status-badge downloading">Downloading... ${Math.round(item.progress)}%</span>`;
            case 'converting': return `<span class="status-badge converting">Converting...</span>`;
            case 'completed': return '<span class="status-badge success">Completed</span>';
            case 'error': return '<span class="status-badge error">Failed</span>';
            case 'cancelled': return '<span class="status-badge cancelled">Cancelled</span>';
            default: return '';
        }
    }

    private static renderActions(item: VideoItem): string {
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
}

// Utility Helpers (duplicated from elsewhere or imported)
function escapeHtml(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function (m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            default: return m;
        }
    });
}

function formatDuration(duration: string | number | undefined): string {
    if (!duration) return '';
    const sec = typeof duration === 'string' ? parseInt(duration) : duration;
    if (isNaN(sec)) return '';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function pad(n: number): string {
    return n < 10 ? '0' + n : '' + n;
}
