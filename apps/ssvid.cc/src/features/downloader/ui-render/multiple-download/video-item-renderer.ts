
import { VideoItem } from '../../state/multiple-download-types';
import { RendererStrategy } from './renderer-strategy.interface';
import { isMobileDevice } from '../../../../utils';

/**
 * Video Item Renderer
 * Renders individual video items using a strategy pattern behavior
 */
export class VideoItemRenderer {

    /**
     * Render a single video item
     */
    static render(item: VideoItem, strategy: RendererStrategy): string {
        const { id, meta, status, progress, error } = item;
        const isMobile = isMobileDevice();

        const isDownloading = status === 'downloading' || status === 'converting' || status === 'analyzing';
        const isError = status === 'error';
        const settingsClass = strategy.getSettingsClass(item);

        // Progress bar formatting
        const progressPercent = Math.round(progress || 0);
        const progressBarWidth = `${progressPercent}%`;

        // Strategy content
        const settingsContent = strategy.buildSettingsContent(item);
        const actionButton = strategy.getActionButton(item, {});
        const checkboxHtml = strategy.getCheckboxHtml(item);
        const statusHtml = strategy.getStatusHtml(item);

        // CSS Classes
        // .multi-video-item flex layout is handled by CSS
        // but we might want to add a class if checkbox is present to adjust padding
        const hasCheckbox = !!checkboxHtml;
        const itemClasses = `multi-video-item ${status} ${hasCheckbox ? 'has-checkbox' : ''}`;

        // Skeleton / Loading State
        if (status === 'fetching_metadata') {
            return `
                <div class="${itemClasses} skeleton-loading" data-id="${id}">
                   ${checkboxHtml}
                   <div class="multi-video-thumb skeleton-box"></div>
                   <div class="multi-video-info">
                        <div class="multi-video-title skeleton-text" style="width: 80%;"></div>
                        <div class="multi-video-meta">
                             <div class="skeleton-text" style="width: 40%; height: 14px;"></div>
                        </div>
                   </div>
                   <div class="multi-video-actions">
                        <!-- Spinner or simple placeholder -->
                        <div class="spinner-border text-muted" style="width: 20px; height: 20px; border-width: 2px;"></div>
                   </div>
                </div>
            `;
        }

        return `
            <div class="${itemClasses}" data-id="${id}">
                ${checkboxHtml}
                
                <div class="multi-video-thumb">
                    <img src="${escapeHtml(meta.thumbnail)}" alt="${escapeHtml(meta.title)}" loading="lazy">
                </div>
                
                <div class="multi-video-info">
                    <div class="multi-video-title" title="${escapeHtml(meta.title)}">${escapeHtml(meta.title)}</div>
                    
                    <div class="multi-video-meta">
                        ${meta.author ? `<span class="multi-video-author">${escapeHtml(meta.author)}</span>` : ''}
                    </div>
                    
                    ${isError ? `<div class="multi-video-error">${escapeHtml(error || 'Error')}</div>` : ''}
                    
                    <div class="settings-progress-wrapper">
                         ${settingsContent ? `<div class="item-settings${settingsClass}">${settingsContent}</div>` : ''}
                         <div class="multi-video-status">
                            ${statusHtml}
                        </div>
                    </div>
                </div>
                
                <div class="multi-video-actions">
                    ${actionButton}
                </div>
                
                ${isDownloading ? `
                    <div class="multi-video-progress">
                        <div class="progress-bar" style="width: ${progressBarWidth}"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

// Utility Helpers
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
