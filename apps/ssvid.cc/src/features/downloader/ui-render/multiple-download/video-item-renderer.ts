
import { VideoItem } from '../../state/multiple-download-types';
import { RendererStrategy } from './renderer-strategy.interface';
import { isMobileDevice } from '../../../../utils';

/**
 * Video Item Renderer
 * Creates and updates DOM elements (no innerHTML re-render)
 */
export class VideoItemRenderer {

    /**
     * Create a DOM element for a video item (called once per item)
     */
    static createVideoItemElement(item: VideoItem, strategy: RendererStrategy): HTMLElement {
        const el = document.createElement('div');
        el.className = 'multi-video-item';
        el.dataset.id = item.id;
        if (item.groupId) el.dataset.groupId = item.groupId;

        // Build initial structure
        VideoItemRenderer.buildStructure(el, item, strategy);
        VideoItemRenderer.applyStatusClass(el, item);

        return el;
    }

    /**
     * Update existing element (granular, no re-create)
     */
    static updateVideoItemElement(el: HTMLElement, item: VideoItem, strategy: RendererStrategy): void {
        console.log('[VideoItemRenderer] updateVideoItemElement called:', item.id, 'status:', item.status);
        console.log('[VideoItemRenderer] el.classList:', el.classList.toString());

        // Check for skeleton BEFORE applyStatusClass (which removes skeleton-loading class)
        const hasSkeleton = el.classList.contains('skeleton-loading');
        const shouldTransition = hasSkeleton && item.status !== 'fetching_metadata';
        console.log('[VideoItemRenderer] hasSkeleton:', hasSkeleton, 'shouldTransition:', shouldTransition);

        // Skeleton → full transition
        if (shouldTransition) {
            console.log('[VideoItemRenderer] Transitioning from skeleton to full content...');
            el.innerHTML = '';
            el.classList.remove('skeleton-loading');
            VideoItemRenderer.buildStructure(el, item, strategy);
            VideoItemRenderer.applyStatusClass(el, item);
            console.log('[VideoItemRenderer] Transition complete!');
            return;
        }

        // Apply status class for non-skeleton updates
        VideoItemRenderer.applyStatusClass(el, item);

        if (item.status === 'fetching_metadata') return;

        // Title
        const titleEl = el.querySelector('.multi-video-title') as HTMLElement;
        if (titleEl && titleEl.textContent !== item.meta.title) {
            titleEl.textContent = item.meta.title || '';
            titleEl.title = item.meta.title || '';
        }

        // Thumbnail
        const thumbImg = el.querySelector('.multi-video-thumb img') as HTMLImageElement;
        if (thumbImg && item.meta.thumbnail && thumbImg.src !== item.meta.thumbnail) {
            thumbImg.src = item.meta.thumbnail;
        }

        // Author
        const authorEl = el.querySelector('.multi-video-author') as HTMLElement;
        if (authorEl) {
            authorEl.textContent = item.meta.author || '';
        }

        // Duration badge
        const durationEl = el.querySelector('.multi-video-duration') as HTMLElement;
        if (durationEl) {
            const dur = formatDuration(item.meta.duration);
            if (dur) {
                durationEl.textContent = dur;
                durationEl.style.display = '';
            } else {
                durationEl.style.display = 'none';
            }
        }

        // Error message
        const errorEl = el.querySelector('.multi-video-error') as HTMLElement;
        if (errorEl) {
            if (item.status === 'error' && item.error) {
                errorEl.textContent = item.error;
                errorEl.style.display = '';
            } else {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        }

        // Status badge (terminal states)
        const statusContainer = el.querySelector('.multi-video-status');
        if (statusContainer) {
            statusContainer.innerHTML = strategy.getStatusHtml(item);
        }

        // Phase text (active states)
        const phaseEl = el.querySelector('.multi-video-phase-text') as HTMLElement;
        if (phaseEl) {
            phaseEl.textContent = strategy.getPhaseHtml(item);
        }

        // Settings
        const settingsEl = el.querySelector('.item-settings') as HTMLElement;
        if (settingsEl) {
            const newContent = strategy.buildSettingsContent(item);
            settingsEl.innerHTML = newContent;
            settingsEl.className = 'item-settings' + strategy.getSettingsClass(item);
        }

        // Action buttons
        const actionsEl = el.querySelector('.multi-video-actions');
        if (actionsEl) {
            actionsEl.innerHTML = strategy.getActionButton(item, {});
        }

        // Checkbox
        const checkboxWrapper = el.querySelector('.item-checkbox-wrapper');
        const newCheckboxHtml = strategy.getCheckboxHtml(item);
        if (!checkboxWrapper && newCheckboxHtml) {
            el.insertAdjacentHTML('afterbegin', newCheckboxHtml);
        } else if (checkboxWrapper) {
            const checkbox = checkboxWrapper.querySelector('.item-checkbox') as HTMLInputElement;
            if (checkbox) {
                checkbox.checked = item.isSelected;
                const isSelectable = ['ready', 'error', 'cancelled', 'completed'].includes(item.status);
                checkbox.disabled = !isSelectable;
            }
        }

        // Progress bar
        VideoItemRenderer.updateProgressBar(el, item);
    }

    /**
     * Lightweight progress-only update
     */
    static updateProgressOnly(el: HTMLElement, item: VideoItem, strategy: RendererStrategy): void {
        VideoItemRenderer.updateProgressBar(el, item);

        // Update phase text
        const phaseEl = el.querySelector('.multi-video-phase-label') as HTMLElement;
        if (phaseEl) {
            phaseEl.textContent = strategy.getPhaseHtml(item);
        }

        // Update percentage text
        const percentEl = el.querySelector('.progress-percentage-label') as HTMLElement;
        if (percentEl) {
            percentEl.textContent = `${Math.round(item.progress)}%`;
        }
    }

    // ==========================================
    // Private helpers
    // ==========================================

    private static buildStructure(el: HTMLElement, item: VideoItem, strategy: RendererStrategy): void {
        if (item.status === 'fetching_metadata') {
            el.classList.add('skeleton-loading');
            el.innerHTML = `
                ${strategy.getCheckboxHtml(item)}
                <div class="multi-video-thumb skeleton-box"></div>
                <div class="multi-video-info">
                    <div class="multi-video-title skeleton-text" style="width: 80%;"></div>
                    <div class="multi-video-meta">
                        <div class="skeleton-text" style="width: 40%; height: 14px;"></div>
                    </div>
                </div>
                <div class="multi-video-actions">
                    <div class="spinner-border text-muted" style="width: 20px; height: 20px; border-width: 2px;"></div>
                </div>
            `;
            return;
        }

        const isDownloading = item.status === 'downloading' || item.status === 'converting' || item.status === 'analyzing';
        const checkboxHtml = strategy.getCheckboxHtml(item);
        const durationStr = formatDuration(item.meta.duration);
        const progressPercent = Math.round(item.progress || 0);

        el.innerHTML = `
            ${checkboxHtml}
            <div class="multi-video-thumb">
                <img src="${escapeAttr(item.meta.thumbnail)}" alt="${escapeAttr(item.meta.title)}" loading="lazy">
                ${durationStr ? `<span class="multi-video-duration">${durationStr}</span>` : ''}
            </div>
            <div class="multi-video-info">
                <div class="multi-video-title" title="${escapeAttr(item.meta.title)}">${escapeHtml(item.meta.title)}</div>
                <div class="multi-video-meta">
                    ${item.meta.author ? `<span class="multi-video-author">${escapeHtml(item.meta.author)}</span>` : ''}
                </div>
                <div class="multi-video-error" style="${item.status === 'error' ? '' : 'display:none'}">${escapeHtml(item.error || '')}</div>
                <div class="settings-progress-wrapper">
                    <div class="item-settings${strategy.getSettingsClass(item)}">${strategy.buildSettingsContent(item)}</div>
                    <div class="item-active-progress" style="${isDownloading ? '' : 'display:none'}">
                        <div class="progress-info-row">
                            <div class="multi-video-phase-label">${strategy.getPhaseHtml(item)}</div>
                            <div class="progress-percentage-label">${progressPercent}%</div>
                        </div>
                        <div class="multi-video-progress">
                            <div class="progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="multi-video-status">
                ${strategy.getStatusHtml(item)}
            </div>
            <div class="multi-video-actions">${strategy.getActionButton(item, {})}</div>
        `;

        if (checkboxHtml) {
            el.classList.add('has-checkbox');
        }
    }

    private static updateProgressBar(el: HTMLElement, item: VideoItem): void {
        const isActive = item.status === 'downloading' || item.status === 'converting' || item.status === 'analyzing';
        const activeWrapper = el.querySelector('.item-active-progress') as HTMLElement;
        const progressPercent = Math.round(item.progress || 0);

        if (isActive) {
            if (activeWrapper) activeWrapper.style.display = 'block';

            const bar = el.querySelector('.progress-bar') as HTMLElement;
            if (bar) bar.style.width = `${progressPercent}%`;

            const percentLabel = el.querySelector('.progress-percentage-label') as HTMLElement;
            if (percentLabel) percentLabel.textContent = `${progressPercent}%`;

            // Phase-specific color
            const progressContainer = el.querySelector('.multi-video-progress');
            if (progressContainer) {
                if (item.progressPhase === 'merging') {
                    progressContainer.classList.add('phase-merging');
                } else {
                    progressContainer.classList.remove('phase-merging');
                }
            }
        } else {
            if (activeWrapper) activeWrapper.style.display = 'none';
        }
    }

    private static applyStatusClass(el: HTMLElement, item: VideoItem): void {
        // Remove all status classes
        el.classList.remove(
            'pending', 'analyzing', 'fetching_metadata', 'ready', 'queued',
            'downloading', 'converting', 'completed', 'error', 'cancelled',
            'skeleton-loading'
        );
        el.classList.add(item.status);
        if (item.status === 'fetching_metadata') {
            el.classList.add('skeleton-loading');
        }
    }
}

// ==========================================
// Utility Helpers
// ==========================================

export function escapeHtml(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/[&<>"']/g, (m) => {
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

export function escapeAttr(text: string | undefined): string {
    return escapeHtml(text);
}

export function formatDuration(duration: string | number | undefined): string {
    if (!duration) return '';
    const sec = typeof duration === 'string' ? parseInt(duration) : duration;
    if (isNaN(sec) || sec <= 0) return '';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function pad(n: number): string {
    return n < 10 ? '0' + n : '' + n;
}
