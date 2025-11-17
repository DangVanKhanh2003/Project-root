/**
 * Convert Rendering Module
 *
 * Handles UI rendering cho convert options feature.
 * Renders 2-column layout với video info và format options.
 */

import { mapFormat, extractFormat, buildQualityBadge, processFormatArray } from '../../../utils/format-utils';
import { setActiveTab, updateTaskState, getTaskState, getState, getConversionTask } from '../state';

// Import utils
import { initExpandableText, triggerDownload } from '../../../utils.js';


// CSS imports removed - all CSS now bundled in main.js

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface VideoMeta {
    title?: string;
    thumbnail?: string;
    originalUrl?: string;
    vid?: string;
}

interface VideoFormats {
    video?: ProcessedFormat[];
    audio?: ProcessedFormat[];
}

interface VideoDetail {
    meta: VideoMeta;
    formats: VideoFormats;
}

interface DownloadTask {
    status: 'idle' | 'loading' | 'error' | 'success';
    progress?: number;
    error?: string;
}

interface DownloadTasks {
    [formatId: string]: DownloadTask;
}

interface ConversionTask {
    state: 'Idle' | 'Converting' | 'Extracting' | 'Processing' | 'Polling' | 'Failed' | 'Canceled';
    progress?: number;
    error?: string;
}

interface AppState {
    videoDetail: VideoDetail | null;
    activeTab: 'video' | 'audio';
    downloadTasks: DownloadTasks;
}

interface ProcessedFormat {
    id: string;
    category: 'video' | 'audio';
    type: string;
    quality: string;
    size?: number;
    sizeText: string;
    url?: string;
    vid?: string;
    key?: string;
    isConverted?: boolean;
    q_text?: string;
    fps?: number;
    bitrate?: number;
    isFakeData?: boolean;
    filename?: string;
    format?: string;
}

interface ButtonState {
    class: string;
    text: string;
    disabled: boolean;
    loading: boolean;
}

interface FormatData {
    id: string;
    category: 'video' | 'audio';
    type: string;
    quality: string;
    size: number | null;
    sizeText: string;
    url: string | null;
    vid: string | null;
    key: string | null;
    encryptedUrl: string | null;
    isConverted?: boolean;
    q_text: string | null;
    fps: number | null;
    bitrate: number | null;
    isFakeData: boolean;
    filename?: string;
}

// ============================================================
// MAIN RENDERING FUNCTIONS
// ============================================================

/**
 * Main function để render download options UI
 *
 * @param {Object} state - Current application state
 * @returns {string} HTML string cho download options
 */
export function renderDownloadOptions(state: AppState): string {
    // CSS loading removed - all bundled in main.js

    try {
        // Enhanced validation
        if (!state || typeof state !== 'object') {
            return '';
        }

        if (!state.videoDetail || typeof state.videoDetail !== 'object') {
            return '';
        }

    const { videoDetail, activeTab, downloadTasks } = state;
    const { meta, formats } = videoDetail;

    // Validate formats
    if (!formats || (!formats.video && !formats.audio)) {
        return renderErrorMessage('Không có tùy chọn tải xuống nào khả dụng.');
    }

    // Process formats với format-processor functions

    const videoFormats = processFormatArray(formats.video || [], 'video');
    const audioFormats = processFormatArray(formats.audio || [], 'audio');


    const hasVideo = videoFormats.length > 0;
    const hasAudio = audioFormats.length > 0;

    // Nếu không có format nào valid
    if (!hasVideo && !hasAudio) {
        return renderErrorMessage('Không thể xử lý các định dạng tải xuống.');
    }

    return `
        <div id="downloadOptionsContainer" class="video-info-card">
            <div class="video-layout">
                <!-- Left Column: Video Info -->
                <div class="video-info-left">
                 <div class="format-tabs" role="tablist" aria-label="Format selection">
                    <button type="button"
                            class="format-tab active "
                            role="tab"
                            aria-controls="videoFormats"
                            data-tab="video"
                            id="tab-video">
                        <span>Download</span>
                    </button>
                </div>
                    ${renderVideoInfoSmart(meta)}
                </div>

                <!-- Right Column: Download Options -->
                <div class="video-details">
                    ${renderTabNavigation(activeTab, hasVideo, hasAudio)}
                    ${renderFormatPanels(videoFormats as any, audioFormats as any, activeTab, downloadTasks)}
                </div>
            </div>
        </div>
    `;

    } catch (error) {
        return renderErrorMessage('Failed to render download options. Please try again.');
    }
}

/**
 * Smart wrapper for renderVideoInfo - handles DOM updates vs recreation
 * @param {Object} meta - Video metadata
 * @returns {string} HTML string
 */
function renderVideoInfoSmart(meta: VideoMeta): string {
    const existingThumbnail = document.querySelector('#videoThumbnail') as HTMLImageElement | null;
    const existingTitle = document.querySelector('#videoTitle') as HTMLElement | null;


    if (existingThumbnail && existingTitle && meta && meta.thumbnail) {
        const currentSrc = existingThumbnail.src;
        const newSrc = meta.thumbnail;

        if (currentSrc === newSrc) {
            // Same thumbnail - mark for smart update and schedule title change

            // Schedule async title update to avoid DOM conflicts
            setTimeout(() => {
                const titleElement = document.querySelector('#videoTitle') as HTMLElement | null;
                if (titleElement && meta.title) {
                    const displayTitle = meta.title || meta.originalUrl || '';
                    titleElement.textContent = displayTitle;
                    titleElement.setAttribute('title', displayTitle);
                }
            }, 50);

            // Return simplified placeholder to minimize DOM changes
            return `
                <div class="smart-update-placeholder" style="display: none;">
                    <!-- Smart update in progress -->
                </div>
            `;
        }
    }

    // Full render for new content or different thumbnails
    return renderVideoInfo(meta);
}

/**
 * Renders video information (thumbnail + title)
 * Image src is intentionally BLANK to prevent flicker - loaded via setupImageLoader()
 *
 * @param {Object} meta - Video metadata from API
 * @returns {string} HTML string cho video info
 */
export function renderVideoInfo(meta: VideoMeta): string {
    if (!meta) {
        return '<div class="dl-info__placeholder">Không có thông tin video</div>';
    }

    const { title, thumbnail, originalUrl } = meta;
    const displayTitle = title || originalUrl || '';

    return `
        <div class="video-thumbnail aspect-16-9">
            <img id="videoThumbnail"
                 alt="Video thumbnail"
                 class="thumbnail-image"
                 width="480"
                 height="360"
                 loading="eager"
                 decoding="async"
                 data-src="${escapeHtml(thumbnail || '')}"
                 style="opacity: 0;">
            <div class="thumbnail-skeleton">
                <div class="skeleton-img skeleton-placeholder"></div>
            </div>
        </div>
        <div class="video-title-wrapper">
          <h3 id="videoTitle" class="video-title expandable-text" title="${escapeHtml(displayTitle)}">
            ${escapeHtml(displayTitle)}
        </h3>
        </div>
    `;
}

/**
 * Cập nhật chỉ tiêu đề video mà không render lại toàn bộ card.
 * @param {Object} meta - Metadata mới của video.
 */
export function updateVideoTitle(meta: VideoMeta): void {
    const titleElement = document.getElementById('videoTitle');
    if (!meta || !titleElement) return;

    const displayTitle = meta.title || meta.originalUrl || 'Video không có tiêu đề';
    const escapedTitle = escapeHtml(displayTitle);

    titleElement.textContent = escapedTitle;
    titleElement.setAttribute('title', escapedTitle);

    // Kích hoạt lại logic cho văn bản có thể mở rộng (xem thêm/thu gọn)
    const container = titleElement.closest('#downloadOptionsContainer');
    if (container) {
        initExpandableText(container as HTMLElement, '.video-title');
    }
}

/**
 * Renders tab navigation (Video/Audio tabs)
 *
 * @param {string} activeTab - Currently active tab ('video' or 'audio')
 * @param {boolean} hasVideo - Whether video formats available
 * @param {boolean} hasAudio - Whether audio formats available
 * @returns {string} HTML string cho tab navigation
 */
export function renderTabNavigation(activeTab: 'video' | 'audio', hasVideo: boolean, hasAudio: boolean): string {
    const videoDisabled = !hasVideo;
    const audioDisabled = !hasAudio;

    return `
        <div class="format-tabs" role="tablist" aria-label="Format selection">
            <button type="button"
                    class="format-tab ${activeTab === 'video' ? 'active' : ''} ${videoDisabled ? 'disabled' : ''}"
                    role="tab"
                    aria-selected="${activeTab === 'video'}"
                    aria-controls="videoFormats"
                    data-tab="video"
                    id="tab-video">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M23 7l-7 5 7 5V7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></rect>
                </svg>
                <span>Video</span>
            </button>
            <button type="button"
                    class="format-tab ${activeTab === 'audio' ? 'active' : ''} ${audioDisabled ? 'disabled' : ''}"
                    role="tab"
                    aria-selected="${activeTab === 'audio'}"
                    aria-controls="audioFormats"
                    data-tab="audio"
                    id="tab-audio">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
                    <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
                </svg>
                <span>Audio</span>
            </button>
        </div>
    `;
}

/**
 * Renders format panels cho both video và audio
 *
 * @param {Array} videoFormats - Processed video formats
 * @param {Array} audioFormats - Processed audio formats
 * @param {string} activeTab - Currently active tab
 * @param {Object} downloadTasks - Download task states
 * @returns {string} HTML string cho format panels
 */
export function renderFormatPanels(
    videoFormats: ProcessedFormat[],
    audioFormats: ProcessedFormat[],
    activeTab: 'video' | 'audio',
    downloadTasks: DownloadTasks
): string {

    const videoPanel = renderFormatPanel('video', videoFormats, activeTab === 'video', downloadTasks);
    const audioPanel = renderFormatPanel('audio', audioFormats, activeTab === 'audio', downloadTasks);

    return `
        ${videoPanel}
        ${audioPanel}
    `;
}

/**
 * Renders a single format panel (video hoặc audio)
 *
 * @param {string} category - 'video' or 'audio'
 * @param {Array} formats - Array of processed formats
 * @param {boolean} isActive - Whether this panel is active
 * @param {Object} downloadTasks - Download task states
 * @returns {string} HTML string cho format panel
 */
export function renderFormatPanel(
    category: 'video' | 'audio',
    formats: ProcessedFormat[],
    isActive: boolean,
    downloadTasks: DownloadTasks
): string {

    const panelId = `${category}Formats`;
    const displayStyle = isActive ? 'block' : 'none';

    if (!formats || formats.length === 0) {
        const emptyMessage = category === 'video' ? 'No video formats available' : 'No audio formats available';
        return `
            <div class="quality-list" id="${panelId}" role="tabpanel" aria-labelledby="tab-${category}" style="display: ${displayStyle};">
                <div class="quality-empty">${emptyMessage}</div>
            </div>
        `;
    }

    const formatItems = formats.map(format => renderFormatItem(format, downloadTasks)).join('');

    return `
        <div class="quality-list" id="${panelId}" role="tabpanel" aria-labelledby="tab-${category}" style="display: ${displayStyle};">
            ${formatItems}
        </div>
    `;
}

/**
 * Renders a single format item (quality option)
 * Branches to YouTube conversion flow or direct download based on meta.vid
 *
 * @param {Object} format - Processed format object
 * @param {Object} downloadTasks - Download task states (legacy)
 * @returns {string} HTML string cho format item
 */
export function renderFormatItem(format: ProcessedFormat, downloadTasks: DownloadTasks): string {
    // Get current state to check if YouTube video
    const state = getState();
    const isYouTube = !!(state.videoDetail && state.videoDetail.meta && state.videoDetail.meta.vid);


    // Branch: YouTube conversion flow vs Direct download
    if (isYouTube) {
        return renderConversionButton(format, downloadTasks);
    } else {
        return renderDirectDownloadButton(format);
    }
}

/**
 * Renders conversion button for YouTube videos
 * Handles states: Idle → Converting → Success/Failed
 *
 * @param {Object} format - Processed format object
 * @param {Object} downloadTasks - Download task states (legacy)
 * @returns {string} HTML string for conversion button
 */
function renderConversionButton(format: ProcessedFormat, downloadTasks: DownloadTasks): string {
    const formatId = format.id;

    // Get conversion task state (new concurrent system)
    const conversionTask = getConversionTask(formatId);

    // Get legacy task state for button (backward compatibility)
    const taskState = downloadTasks[formatId] || { status: 'idle' as const };

    // Format display with quality badge
    const formatType = (format.type || 'Unknown').toUpperCase();
    const qualityBadge = buildQualityBadge(format, format.category) || '';

    const buttonState = getButtonStateForTask(taskState, conversionTask as any);

    return `
        <div class="quality-item" data-format-id="${escapeHtml(formatId)}" data-category="${escapeHtml(format.category)}">
            <div class="quality-row">
                <div class="quality-col-left">
                    <span class="quality-format">${escapeHtml(formatType)}</span>
                    ${qualityBadge}
                </div>
                <div class="quality-col-center">
                    <span class="quality-label">${escapeHtml(format.quality || '')}</span>
                </div>
                <div class="quality-col-right">
                    <button type="button"
                            class="btn-convert ${buttonState.class}"
                            data-format-id="${escapeHtml(formatId)}"
                            aria-label="Convert ${formatType} ${format.quality || 'video'}"
                            ${buttonState.disabled ? 'disabled' : ''}>
                        <span class="btn-text">${buttonState.text}</span>
                        ${buttonState.loading ? '<span class="btn-spinner"></span>' : ''}
                        ${renderButtonIcon(buttonState.class)}
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders direct download button for non-YouTube sources (TikTok, Instagram, Facebook)
 * Simple download button with no conversion states
 *
 * @param {Object} format - Processed format object with url
 * @returns {string} HTML string for direct download button
 */
function renderDirectDownloadButton(format: ProcessedFormat): string {
    const formatId = format.id;
    const displayText = extractFormat(format);
    const qualityBadge = buildQualityBadge(format, format.category) || '';

    return `
        <div class="quality-item" data-format-id="${escapeHtml(formatId)}" data-category="${escapeHtml(format.category)}">
            <div class="quality-row">
                <div class="quality-col-left">
                    <span class="quality-format">${escapeHtml(displayText)}</span>
                    ${qualityBadge}
                </div>
                <div class="quality-col-center">
                    <div class="quality-status-area">
                        <div class="size-info">${escapeHtml(format.sizeText)}</div>
                    </div>
                </div>
                <div class="quality-col-right">
                    <button type="button"
                            class="btn-convert btn-convert--direct-download"
                            data-format-id="${escapeHtml(formatId)}"
                            aria-label="Download">
                        <span class="btn-text">Download</span>
                        ${renderButtonIcon('btn-convert--success')}
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render center column content - ALWAYS shows size
 * Conversion status now displayed in modal, not inline
 * @param {Object} format - Format object
 * @param {Object|null} conversionTask - Conversion task (not used for rendering)
 * @returns {string} HTML for center column
 */
function renderCenterColumn(format: ProcessedFormat, conversionTask: ConversionTask | null): string {
    // Always show size info - no more inline status
    return `
        <div class="quality-status-area">
            <div class="size-info">${escapeHtml(format.sizeText)}</div>
        </div>
    `;
}

/**
 * Determines button state based on conversion task and legacy download task status
 * SIMPLIFIED: All states show "Convert" button text (unified UX)
 *
 * @param {Object} taskState - Legacy task state object
 * @param {Object|null} conversionTask - New conversion task or null
 * @returns {Object} Button state configuration
 */
function getButtonStateForTask(taskState: DownloadTask, conversionTask: ConversionTask | null): ButtonState {
    // Priority: conversion task state over legacy task state
    if (conversionTask) {
        switch (conversionTask.state) {
            case 'Converting':
            case 'Extracting':
            case 'Processing':
            case 'Polling':
                return {
                    class: 'btn-convert--converting',
                    text: 'Convert',
                    disabled: false,
                    loading: false
                };
            case 'Failed':
                return {
                    class: 'btn-convert--error',
                    text: 'Convert',
                    disabled: false,
                    loading: false
                };
            case 'Canceled':
            case 'Idle':
            default:
                return {
                    class: 'btn-convert--idle',
                    text: 'Convert',
                    disabled: false,
                    loading: false
                };
        }
    }

    // Fallback to legacy task state (for backward compatibility)
    switch (taskState.status) {
        case 'loading':
            return {
                class: 'btn-convert--loading',
                text: 'Convert',
                disabled: false,
                loading: false
            };
        case 'error':
            return {
                class: 'btn-convert--error',
                text: 'Convert',
                disabled: false,
                loading: false
            };
        default:
            return {
                class: 'btn-convert--idle',
                text: 'Convert',
                disabled: false,
                loading: false
            };
    }
}

/**
 * Renders button icon based on conversion state
 * SIMPLIFIED: All states use the same download icon (prettier design)
 *
 * @param {string} buttonClass - Button class (btn-convert--idle, btn-convert--converting, etc.)
 * @returns {string} SVG icon HTML
 */
function renderButtonIcon(buttonClass: string): string {
    // All states: Use download icon (prettier than convert icon)
    // Converting state gets rotation animation via CSS
    const iconClass = buttonClass.includes('btn-convert--converting')
        ? 'btn-icon btn-icon--rotating'
        : 'btn-icon';

    return `
        <svg class="${iconClass}" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" role="img">
            <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/>
        </svg>
    `;
}

/**
 * Renders error message cho download options
 *
 * @param {string} message - Error message to display
 * @returns {string} HTML string cho error display
 */
export function renderErrorMessage(message: string): string {
    return `
        <div class="dl-container dl-container--error">
            <div class="dl-error">
                <span class="dl-error__icon">⚠️</span>
                <span class="dl-error__message">${escapeHtml(message)}</span>
            </div>
        </div>
    `;
}

// ============================================================
// EVENT HANDLING
// ============================================================

/**
 * Attaches event listeners cho download options container
 * Uses event delegation to prevent duplicate listeners and stale references
 * IDEMPOTENT: Safe to call multiple times (will skip if already initialized)
 *
 * @param {HTMLElement} container - Download options container
 */
export function attachDownloadListeners(container: HTMLElement | null): void {
    if (!container) {
        return;
    }


    // ============================================================
    // GUARD: Skip if already initialized (prevents duplicate listeners)
    // ============================================================
    if (container.dataset.downloadListenersAttached === 'true') {
        // IMPORTANT: Do NOT call initExpandableText again!
        // It will remove existing buttons and re-check overflow on already-expanded text
        // which causes buttons to disappear after user clicks "see more"
        return;
    }

    // ============================================================
    // EVENT DELEGATION: Single unified click handler for all interactions
    // ============================================================
    container.addEventListener('click', (event: MouseEvent) => {
        // Handle format tab clicks
        const formatTab = (event.target as HTMLElement).closest('.format-tab') as HTMLElement | null;
        if (formatTab) {
            handleTabClick(formatTab);
            return;
        }

        // Handle download button clicks
        const downloadBtn = (event.target as HTMLElement).closest('.quality-item');
        if (downloadBtn) {
            handleDownloadClick(event);
            return;
        }

        // Note: "see more" buttons are handled by initExpandableText's own delegation
    });

    // Mark container as initialized
    container.dataset.downloadListenersAttached = 'true';

    // Initialize expandable text for the video title
    initExpandableText(container, '.video-title');

    // Setup image loader to prevent flicker
    setupImageLoader(container);
}

/**
 * Setup image loading with preload to prevent flicker
 * Preloads image in memory, then shows it smoothly after load complete
 * PREVENTS: Flash/flicker from browser's default image loading behavior
 *
 * @param {HTMLElement} container - Download options container
 */
function setupImageLoader(container: HTMLElement): void {
    const img = container.querySelector('#videoThumbnail') as HTMLImageElement | null;
    const skeleton = container.querySelector('.thumbnail-skeleton') as HTMLElement | null;

    if (!img || !skeleton) {
        return;
    }

    const thumbnailUrl = img.dataset.src;
    if (!thumbnailUrl) {
        return;
    }

    // Preload image in memory
    const preloader = new Image();

    preloader.onload = () => {
        // Image loaded successfully - show it smoothly
        img.src = thumbnailUrl;
        img.style.transition = 'opacity 0.2s ease-in';
        img.style.opacity = '1';

        // Hide skeleton
        if (skeleton) {
            skeleton.style.transition = 'opacity 0.2s ease-out';
            skeleton.style.opacity = '0';
            setTimeout(() => {
                skeleton.style.display = 'none';
            }, 200);
        }
    };

    preloader.onerror = () => {
        // Image failed to load - show broken image state
        img.src = thumbnailUrl;  // Still set src to show broken image icon
        img.style.opacity = '0.3';

        // Hide skeleton
        if (skeleton) {
            skeleton.style.display = 'none';
        }
    };

    // Start preloading
    preloader.src = thumbnailUrl;
}

/**
 * Handles tab click events
 *
 * @param {Event} event - Click event
 */
function handleTabClick(tabElement: HTMLElement): void {
    const tab = tabElement.dataset.tab;
    if (tab && (tab === 'video' || tab === 'audio')) {
        setActiveTab(tab as 'video' | 'audio');
    }
}

/**
 * Handles download button click events
 *
 * @param {Event} event - Click event
 */

async function handleDownloadClick(event: MouseEvent): Promise<void> {
    const button = (event.target as HTMLElement).closest('.btn-convert') as HTMLButtonElement | null;
    if (!button) return;

    event.preventDefault();
    if (button.disabled) return;

    const formatId = button.dataset.formatId;
    if (!formatId) {
        return;
    }


    try {
        // Check if this is a direct download button (non-YouTube platforms like TikTok, Instagram)
        if (button.classList.contains('btn-convert--direct-download')) {

            const formatData = extractFormatDataFromState(formatId);

            if (!formatData || !formatData.url) {
                return;
            }

            // Direct download - trigger immediately
            const filename = formatData.filename || `download.${formatData.type || 'mp4'}`;
            triggerDownload(formatData.url, filename, true);
            return;
        }

        // YouTube conversion flow - Always use smartConvert()
        // smartConvert will handle all routing logic internally:
        // - Stream status → Extract fresh
        // - Static + Valid → Open modal SUCCESS (ready to download)
        // - Static + Expired → Extract fresh
        const { smartConvert } = await import('../logic/conversion/convert-logic.js');
        await smartConvert(formatId);

    } catch (error) {
        // Error handling is done inside smartConvert via modal
    }
}


/**
 * Extracts format data từ state based on format ID
 *
 * @param {string} formatId - Format identifier
 * @returns {Object|null} Format data object with vid, key, encryptedUrl
 */
function extractFormatDataFromState(formatId: string): FormatData | null {
    try {

        const state = getState();
        const videoDetail = state.videoDetail;


        if (!videoDetail || !videoDetail.formats) {
            return null;
        }

        const { formats, meta } = videoDetail;

        // Parse formatId to get category
        const parts = formatId.split('|');
        if (parts.length < 2) {
            return null;
        }

        const category = parts[0] as 'video' | 'audio'; // 'video' or 'audio'

        // Get format array based on category
        const formatArray = category === 'video' ? formats.video : formats.audio;


        if (!Array.isArray(formatArray)) {
            return null;
        }

        // Process formats using format-processor
        const processedFormats = processFormatArray(formatArray, category);


        // Find matching format by ID
        const format = processedFormats.find(f => f.id === formatId);

        if (!format) {
            return null;
        }


        // Build complete format data for convert queue
        const formatData: FormatData = {
            id: format.id,
            category: format.category as 'video' | 'audio',
            type: format.type,
            quality: format.quality,
            size: (typeof format.size === 'number' ? format.size : null),       // File size (for progress display)
            sizeText: format.sizeText || (typeof format.size === 'string' ? format.size : ''),

            // Download URL (for direct download)
            url: format.url || null,     // Direct download URL or encrypted URL

            // Conversion parameters
            vid: meta.vid || format.vid || null, // YouTube video ID (prefer meta.vid, fallback to format.vid)
            key: format.key || null,     // YouTube conversion key
            encryptedUrl: format.url || null, // Social media encoded URL (same as url)

            // Additional metadata
            isConverted: format.isConverted,
            q_text: format.q_text || null,
            fps: format.fps || null,
            bitrate: format.bitrate || null,

            // ✅ CRITICAL: Preserve fake data flag for routing logic
            isFakeData: format.isFakeData || false, // Route to extract v2 if true
        };


        return formatData;

    } catch (error) {
        return null;
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Escapes HTML characters để prevent XSS
 *
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text: string | undefined): string {
    if (typeof text !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
