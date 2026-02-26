
import { VideoItem } from '../../state/multiple-download-types';
import { RendererStrategy } from './renderer-strategy.interface';
import { isMobileDevice } from '../../../../utils';
import { clearMergingEstimator, getMergingEstimator } from '../merging-progress-estimator';
import { LANGUAGES } from '../../logic/data/languages';

const EXTRACTING_MESSAGES = [
    'Creating download job...',
    'Analyzing video information...',
    'Preparing conversion...',
    'Please wait a moment...',
];

const extractingStartTimes = new Map<string, number>();
const extractingIntervals = new Map<string, number>();
const extractingElements = new Map<string, HTMLElement[]>();
const previousMergingPhase = new Map<string, boolean>();
const mergingTransitionInProgress = new Map<string, boolean>();

function stopExtractingRotator(itemId: string): void {
    const interval = extractingIntervals.get(itemId);
    if (interval) {
        window.clearInterval(interval);
        extractingIntervals.delete(itemId);
    }
    extractingElements.delete(itemId);
}

function startExtractingRotator(itemId: string, phaseEls: HTMLElement[]): void {
    extractingElements.set(itemId, phaseEls);

    if (extractingIntervals.has(itemId)) return;

    if (!extractingStartTimes.has(itemId)) {
        extractingStartTimes.set(itemId, Date.now());
    }

    const updateLabel = () => {
        const startTime = extractingStartTimes.get(itemId) || Date.now();
        const elapsed = Date.now() - startTime;
        const msgIndex = Math.floor(elapsed / 2000) % EXTRACTING_MESSAGES.length;
        const els = extractingElements.get(itemId) || [];
        els.forEach((el) => {
            el.textContent = EXTRACTING_MESSAGES[msgIndex];
        });
    };

    updateLabel();

    const interval = window.setInterval(() => {
        const els = extractingElements.get(itemId) || [];
        const hasLiveEl = els.some((el) => document.body.contains(el));
        if (!hasLiveEl) {
            stopExtractingRotator(itemId);
            return;
        }
        updateLabel();
    }, 1000);

    extractingIntervals.set(itemId, interval);
}

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
        VideoItemRenderer.buildStructure(el, item, strategy, { isGlobalLocked: false });
        VideoItemRenderer.applyStatusClass(el, item);
        VideoItemRenderer.updatePhaseLabel(el, item, strategy);
        VideoItemRenderer.updateProgressBar(el, item);

        // NOTE: afterRender (autoResizeSelect) is NOT called here because the element
        // is not yet in the DOM — getComputedStyle would return wrong values.
        // Caller must invoke strategy.afterRender(el, item) after DOM insertion.

        return el;
    }

    /**
     * Update existing element (granular, no re-create)
     */
    static updateVideoItemElement(el: HTMLElement, item: VideoItem, strategy: RendererStrategy, context: { isFileDownloading?: boolean, currentDownloadingItemId?: string, isGlobalLocked?: boolean } = {}): void {

        // Check for skeleton BEFORE applyStatusClass (which removes skeleton-loading class)
        const hasSkeleton = el.classList.contains('skeleton-loading');
        const shouldTransition = hasSkeleton && item.status !== 'fetching_metadata';

        // Skeleton → full transition
        if (shouldTransition) {
            el.innerHTML = '';
            el.classList.remove('skeleton-loading');
            VideoItemRenderer.buildStructure(el, item, strategy, context);
            VideoItemRenderer.applyStatusClass(el, item);
            if (strategy.afterRender) {
                strategy.afterRender(el, item);
            }
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

        VideoItemRenderer.updateAudioLanguageWarning(el, item);

        // Status badge (terminal states)
        const statusContainer = el.querySelector('.multi-video-status');
        if (statusContainer) {
            statusContainer.innerHTML = strategy.getStatusHtml(item);
        }

        // Phase text (active states)
        VideoItemRenderer.updatePhaseLabel(el, item, strategy);

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
            actionsEl.innerHTML = strategy.getActionButton(item, context);
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

        // Progress bar + phase label
        VideoItemRenderer.updateProgressBar(el, item);
        VideoItemRenderer.updatePhaseLabel(el, item, strategy);

        if (strategy.afterRender) {
            strategy.afterRender(el, item);
        }
    }

    /**
     * Lightweight progress-only update
     */
    static updateProgressOnly(el: HTMLElement, item: VideoItem, strategy: RendererStrategy): void {
        VideoItemRenderer.updateProgressBar(el, item);
        VideoItemRenderer.updatePhaseLabel(el, item, strategy);

        // Update percentage text
        const percentEl = el.querySelector('.progress-percentage-label') as HTMLElement;
        if (percentEl) {
            if (VideoItemRenderer.isMergingPhase(item)) {
                const estimator = getMergingEstimator(item.id);
                percentEl.textContent = `${Math.round(estimator.getProgress())}%`;
            } else {
                percentEl.textContent = `${Math.round(item.progress)}%`;
            }
        }
    }

    // ==========================================
    // Private helpers
    // ==========================================

    private static buildStructure(el: HTMLElement, item: VideoItem, strategy: RendererStrategy, context: { isGlobalLocked?: boolean } = {}): void {
        if (item.status === 'fetching_metadata') {
            el.classList.add('skeleton-loading');
            el.innerHTML = `
                ${strategy.getCheckboxHtml(item)}
                <div class="multi-video-thumb">
                    <div class="skeleton-box"></div>
                </div>
                <div class="multi-video-info">
                    <div class="multi-video-title skeleton-text" style="width: 80%;"></div>
                    <div class="multi-video-meta">
                        <div class="skeleton-text" style="width: 100px; height: 14px;"></div>
                    </div>
                    <div class="multi-video-error" style="display:none"></div>
                    <div class="settings-progress-wrapper">
                        <div class="item-settings">
                            <div class="skeleton-text" style="width: 60%; height: 14px;"></div>
                            <div class="skeleton-text" style="width: 45%; height: 14px;"></div>
                        </div>
                        <div class="item-active-progress" style="display:none"></div>
                    </div>
                </div>
                <div class="multi-video-actions">
                    <div class="spinner-border text-muted" style="width: 20px; height: 20px; border-width: 2px;"></div>
                </div>
            `;
            return;
        }

        const isDownloading = ['downloading', 'converting', 'analyzing', 'queued'].includes(item.status);
        const checkboxHtml = strategy.getCheckboxHtml(item);
        const durationStr = formatDuration(item.meta.duration);
        const progressPercent = Math.round(item.progress || 0);
        const initialPhaseText = VideoItemRenderer.getPhaseLabelText(item, strategy);

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
                ${VideoItemRenderer.getAudioLanguageWarningHtml(item)}
                <div class="settings-progress-wrapper">
                    <div class="item-settings${strategy.getSettingsClass(item)}">${strategy.buildSettingsContent(item)}</div>
                    <div class="item-active-progress" style="${isDownloading ? '' : 'display:none'}">
                        <div class="progress-info-row">
                            <div class="multi-video-phase-label">${initialPhaseText}</div>
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
            <div class="multi-video-actions">${strategy.getActionButton(item, context)}</div>
        `;

        if (checkboxHtml) {
            el.classList.add('has-checkbox');
        }
    }

    private static updateProgressBar(el: HTMLElement, item: VideoItem): void {
        const isActive = ['downloading', 'converting', 'analyzing', 'queued'].includes(item.status);
        const activeWrapper = el.querySelector('.item-active-progress') as HTMLElement;
        const progressPercent = Math.round(item.progress || 0);
        const isMergingPhase = VideoItemRenderer.isMergingPhase(item);
        const wasMerging = previousMergingPhase.get(item.id) || false;

        if (isActive) {
            if (activeWrapper) activeWrapper.style.display = 'block';

            const bar = el.querySelector('.progress-bar') as HTMLElement;
            const percentLabel = el.querySelector('.progress-percentage-label') as HTMLElement;

            if (isMergingPhase) {
                if (!wasMerging) {
                    mergingTransitionInProgress.set(item.id, true);
                    if (bar) bar.style.width = '100%';
                    if (percentLabel) percentLabel.textContent = '100%';

                    window.setTimeout(() => {
                        if (!document.body.contains(el) || !el.classList.contains('converting')) {
                            mergingTransitionInProgress.set(item.id, false);
                            return;
                        }

                        if (bar) bar.style.width = '0%';
                        if (percentLabel) percentLabel.textContent = '0%';

                        const estimator = getMergingEstimator(item.id);
                        estimator.start((p) => {
                            if (!document.body.contains(el) || !el.classList.contains('converting')) return;
                            if (bar) bar.style.width = `${p}%`;
                            if (percentLabel) percentLabel.textContent = `${p}%`;
                        });

                        mergingTransitionInProgress.set(item.id, false);
                    }, 400);
                }

                if (!mergingTransitionInProgress.get(item.id)) {
                    const estimator = getMergingEstimator(item.id);
                    const mergeProgress = estimator.isRunning()
                        ? estimator.getProgress()
                        : Math.min(98, progressPercent);
                    if (bar) bar.style.width = `${mergeProgress}%`;
                    if (percentLabel) percentLabel.textContent = `${mergeProgress}%`;
                }
            } else {
                clearMergingEstimator(item.id);
                if (bar) bar.style.width = `${progressPercent}%`;
                if (percentLabel) percentLabel.textContent = `${progressPercent}%`;
            }

            // Phase-specific color
            const progressContainer = el.querySelector('.multi-video-progress');
            if (progressContainer) {
                if (isMergingPhase) {
                    progressContainer.classList.add('phase-merging');
                } else {
                    progressContainer.classList.remove('phase-merging');
                }
            }
        } else {
            if (activeWrapper) activeWrapper.style.display = 'none';
            stopExtractingRotator(item.id);
            clearMergingEstimator(item.id);
        }

        if (isMergingPhase) {
            previousMergingPhase.set(item.id, true);
        } else if (wasMerging) {
            previousMergingPhase.delete(item.id);
            mergingTransitionInProgress.delete(item.id);
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

    private static updatePhaseLabel(el: HTMLElement, item: VideoItem, strategy: RendererStrategy): void {
        const phaseEls = [
            el.querySelector('.multi-video-phase-label') as HTMLElement | null,
            el.querySelector('.multi-video-phase-text') as HTMLElement | null,
        ].filter(Boolean) as HTMLElement[];

        if (!phaseEls.length) return;

        const isExtracting = item.status === 'converting' && item.progressPhase === 'extracting';
        const isMerging = VideoItemRenderer.isMergingPhase(item);

        if (isExtracting) {
            startExtractingRotator(item.id, phaseEls);
            return;
        }

        stopExtractingRotator(item.id);
        extractingStartTimes.delete(item.id);

        const labelText = VideoItemRenderer.getPhaseLabelText(item, strategy);
        phaseEls.forEach((phaseEl) => {
            phaseEl.textContent = labelText;
        });

        if (!isMerging && item.status !== 'converting') {
            clearMergingEstimator(item.id);
        }
    }

    private static getPhaseLabelText(item: VideoItem, strategy: RendererStrategy): string {
        if (item.status === 'converting') {
            if (item.progressPhase === 'merging') return 'Merging...';
            if (item.progressPhase === 'extracting') return EXTRACTING_MESSAGES[0];
            return 'Processing...';
        }

        const text = strategy.getPhaseHtml(item);
        return text || '';
    }

    private static isMergingPhase(item: VideoItem): boolean {
        return item.status === 'converting' && item.progressPhase === 'merging';
    }

    private static updateAudioLanguageWarning(el: HTMLElement, item: VideoItem): void {
        const existing = el.querySelector('.multi-audio-language-warning') as HTMLElement | null;
        if (item.audioLanguageChanged) {
            const html = VideoItemRenderer.getAudioLanguageWarningHtml(item);
            if (existing) {
                existing.outerHTML = html;
            } else {
                const infoEl = el.querySelector('.multi-video-info');
                if (infoEl) {
                    infoEl.insertAdjacentHTML('beforeend', html);
                }
            }
        } else if (existing) {
            existing.remove();
        }
    }

    private static getAudioLanguageWarningHtml(item: VideoItem): string {
        if (!item.audioLanguageChanged) return '';
        const languageLabels = (item.availableAudioLanguages || [])
            .filter(Boolean)
            .map(VideoItemRenderer.mapAudioLanguageLabel)
            .join(', ');

        return `
            <div class="multi-audio-language-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>This video only has audio in <strong>${escapeHtml(languageLabels || 'Original')}</strong> — automatically using original audio.</span>
            </div>
        `;
    }

    private static mapAudioLanguageLabel(code: string): string {
        const normalized = code.trim().toLowerCase();
        const match = LANGUAGES.find((lang) => lang.code.toLowerCase() === normalized);
        return match?.name || code;
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
