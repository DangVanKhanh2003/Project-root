/**
 * Download Rendering Utilities
 *
 * Handles rendering of conversion status bar based on state changes.
 * This module integrates with the main render flow (ui-renderer.ts) to provide
 * consistent, state-driven UI updates without polling.
 */

import { initExpandableText } from '../../../utils';
import { addRippleEffect } from '@downloader/core/utils';
import { TaskState } from '../logic/conversion/types';
import { updateButtonVisibility, setQuery, setOriginalQuery } from '../state';
import type { AppState, ConversionTask } from '../state/types';
import { showVidToolPopup } from '@downloader/vidtool-popup';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface VideoMeta {
  title?: string;
  originalUrl?: string;
}

// ============================================================
// MAIN RENDER FUNCTION
// ============================================================

/**
 * Render conversion status bar based on state changes
 * This function is called from ui-renderer.ts when conversionTasks change
 *
 * @param state - Current application state
 * @param _prevState - Previous application state (unused, kept for consistency with render pattern)
 */
export function renderConversionStatus(state: AppState, _prevState?: AppState): void {
  // Get status bar container
  const statusContainer = document.getElementById('status-container');

  if (!statusContainer) {
    // Status bar not present on page - skip
    return;
  }

  // Get current format ID being displayed
  const formatId = getCurrentFormatId(state);

  if (!formatId) {
    // No format selected - hide status bar
    statusContainer.style.display = 'none';
    return;
  }

  // Get conversion task for current format
  const task = state.conversionTasks[formatId];
  if (!task) {
    // No active conversion - hide status bar
    statusContainer.style.display = 'none';
    return;
  }

  // Setup button handlers if not already set up
  setupButtonHandlers(formatId);

  // Check if SUCCESS or FAILED - hide status bar, show action buttons only
  if (task.state === TaskState.SUCCESS || task.state === TaskState.FAILED) {
    // Prevent re-triggering setTimeout if already showing completion state
    if (statusContainer.dataset.completionState === task.state) {
      return;
    }
    statusContainer.dataset.completionState = task.state;

    // Update status bar UI first (show status text, icons)
    updateStatusBarUI(statusContainer, task, formatId);

    if (task.state === TaskState.SUCCESS) {
      // SUCCESS: Wait for animation to complete before hiding
      // 200ms CSS transition + 150ms visible at 100% = 350ms
      const actionContainer = document.getElementById('action-container');
      setTimeout(() => {
        statusContainer.style.display = 'none';  // Ẩn status trước
        actionContainer?.classList.add('active'); // Rồi mới hiện button
        delete statusContainer.dataset.completionState;
      }, 350);
    }
    // FAILED: Keep showing error, don't hide

    return;
  }

  // Show status bar for other states (processing, extracting, polling)
  statusContainer.style.display = 'flex';
  // Update status bar UI (with throttling)
  updateStatusBarUI(statusContainer, task, formatId);
}

// ============================================================
// THROTTLE STATE
// ============================================================

// Track last update time per format ID to throttle UI updates
const lastUpdateTimes = new Map<string, number>();
const UPDATE_THROTTLE_MS = 1000; // Update UI max every 1 second

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get current format ID based on selected format and quality
 * Matches the format ID construction in content-renderer.ts:593-599
 */
function getCurrentFormatId(state: AppState): string | null {
  const selectedFormat = state.selectedFormat;

  if (!selectedFormat) {
    return null;
  }

  if (selectedFormat === 'mp4') {
    const videoQuality = state.videoQuality || '720p';
    const isExplicitFormat = ['webm', 'mkv'].includes(videoQuality);
    const container = isExplicitFormat ? videoQuality : 'mp4';
    return `video|${container}-${videoQuality}`;
  } else {
    // Audio formats - apply same fallback as input-form.ts
    const audioFormat = state.audioFormat || 'mp3';
    const audioBitrate = state.audioBitrate || '128';

    if (audioFormat === 'mp3') {
      return `audio|mp3-${audioBitrate}kbps`;
    } else {
      return `audio|${audioFormat}`;
    }
  }
}

/**
 * Update status bar UI based on conversion task state
 * Throttled to update max every 1 second to avoid excessive DOM updates
 *
 * @param statusContainer - Status bar container element
 * @param task - Conversion task with state
 * @param formatId - Format ID for throttle tracking
 */
function updateStatusBarUI(statusContainer: HTMLElement, task: ConversionTask, formatId: string): void {
  const now = Date.now();
  const lastUpdate = lastUpdateTimes.get(formatId) || 0;
  const timeSinceLastUpdate = now - lastUpdate;

  // Check if we should throttle (skip this update)
  // Skip throttle for: completed states OR progress at 100%
  const isCompleted = task.state === TaskState.SUCCESS || task.state === TaskState.FAILED;
  const isAtFull = (task.progress ?? 0) >= 100;
  const shouldThrottle = !isCompleted && !isAtFull && timeSinceLastUpdate < UPDATE_THROTTLE_MS;

  if (shouldThrottle) {
    // Skip update - too soon since last update
    return;
  }

  // Update last update time
  lastUpdateTimes.set(formatId, now);

  // Get DOM elements
  const statusElement = statusContainer.querySelector('.status');
  const statusTextElement = statusContainer.querySelector('.status-text');
  const iconElement = statusContainer.querySelector('.icon');
  const actionContainer = document.getElementById('action-container') as HTMLElement | null;
  const downloadBtn = document.getElementById('conversion-download-btn') as HTMLElement | null;
  const retryBtn = document.getElementById('conversion-retry-btn') as HTMLElement | null;

  if (!statusElement || !statusTextElement || !iconElement || !actionContainer) {
    console.warn('[renderConversionStatus] Required DOM elements not found');
    return;
  }

  // Update status text
  statusTextElement.textContent = task.statusText || 'Processing...';

  // Update progress fill background
  const progress = task.progress ?? 0;
  const currentWidth = statusContainer.style.getPropertyValue('--progress-width') || '0%';

  // If jumping from 0% to 100%, use requestAnimationFrame to ensure browser paints 0% first
  if (progress === 100 && (currentWidth === '0%' || currentWidth === '')) {
    requestAnimationFrame(() => {
      statusContainer.style.setProperty('--progress-width', `${progress}%`);
    });
  } else {
    statusContainer.style.setProperty('--progress-width', `${progress}%`);
  }

  // Remove all state classes
  statusElement.classList.remove('status--extracting', 'status--processing', 'status--success', 'status--error');
  iconElement.classList.remove('spinner', 'checkmark', 'error', 'active');
  iconElement.textContent = '';

  const isMergingPhase = task.state === 'processing' && progress >= 100;

  // Add appropriate state class based on task state
  switch (task.state) {
    case TaskState.EXTRACTING:
      statusElement.classList.add('status--extracting');
      iconElement.classList.add('spinner', 'active');
      break;

    case TaskState.PROCESSING:
    case TaskState.DOWNLOADING:
    case TaskState.POLLING:
      statusElement.classList.add('status--processing');
      iconElement.classList.add('spinner');
      if (isMergingPhase) {
        iconElement.classList.add('active'); // Show spinner during merging (progress = 100%)
      }
      break;

    case TaskState.SUCCESS:
      statusElement.classList.add('status--success');
      iconElement.classList.add('checkmark');
      iconElement.textContent = '✓';
      break;

    case TaskState.FAILED:
      statusElement.classList.add('status--error');
      iconElement.classList.add('error');
      iconElement.textContent = '✕';

      // Show VidTool popup when download fails (after all retries exhausted)
      showVidToolPopup({
        lang: document.documentElement.lang || 'en'
      });
      break;

    default:
      // Idle, canceled, or unknown state
      break;
  }

  // Update action buttons based on state
  if (downloadBtn && retryBtn) {
    if (task.state === TaskState.SUCCESS) {
      downloadBtn.classList.add('active');
      retryBtn.classList.remove('active');
    } else if (task.state === TaskState.FAILED) {
      downloadBtn.classList.remove('active');
      retryBtn.classList.add('active');
    } else {
      downloadBtn.classList.remove('active');
      retryBtn.classList.remove('active');
    }
  }

  // Update action-container visibility
  // Note: For SUCCESS, action-container is shown in renderConversionStatus() after status hides
  // Here we only handle FAILED state (show immediately) and other states (hide)
  if (task.state === TaskState.FAILED) {
    actionContainer.classList.add('active');
    // Cleanup throttle map when task completes (prevent memory leak)
    lastUpdateTimes.delete(formatId);
  } else if (task.state !== TaskState.SUCCESS) {
    // Hide for non-terminal states (SUCCESS is handled separately)
    actionContainer.classList.remove('active');
  } else {
    // SUCCESS: Cleanup throttle map (action-container handled in renderConversionStatus)
    lastUpdateTimes.delete(formatId);
  }
}

/**
 * Setup button click handlers (idempotent - safe to call multiple times)
 */
function setupButtonHandlers(formatId: string): void {
  const actionContainer = document.getElementById('action-container');

  if (!actionContainer) {
    return;
  }

  // Use a flag to prevent duplicate setup
  if (actionContainer.dataset.handlersAttached === 'true') {
    return;
  }

  const downloadBtn = document.getElementById('conversion-download-btn');
  const retryBtn = document.getElementById('conversion-retry-btn');
  const newConvertBtn = document.getElementById('btn-new-convert');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => handleDownloadButtonClick(formatId));
    addRippleEffect(downloadBtn as HTMLElement);
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => handleRetryButtonClick(formatId));
    addRippleEffect(retryBtn as HTMLElement);
  }

  if (newConvertBtn) {
    newConvertBtn.addEventListener('click', handleNewConvertButtonClick);
    addRippleEffect(newConvertBtn as HTMLElement);
  }

  actionContainer.dataset.handlersAttached = 'true';
}

/**
 * Handle download button click
 */
async function handleDownloadButtonClick(formatId: string): Promise<void> {
  console.log('[renderConversionStatus] Download button clicked for:', formatId);

  const { handleDownloadClick } = await import('../logic/conversion');
  const result = handleDownloadClick(formatId);

  if (result === 'error') {
    alert('Download failed. Please try again.');
  }
}

/**
 * Handle retry button click
 */
async function handleRetryButtonClick(formatId: string): Promise<void> {
  console.log('[renderConversionStatus] Retry button clicked for:', formatId);

  const { getState } = await import('../state');
  const state = getState();
  const task = state.conversionTasks[formatId];

  if (!task?.formatData) {
    console.error('[renderConversionStatus] No formatData found for retry');
    return;
  }

  const { startConversion } = await import('../logic/conversion');
  const videoTitle = state.youtubePreview?.title || 'Video';
  const videoUrl = state.youtubePreview?.url || '';

  await startConversion({
    formatId,
    videoUrl,
    videoTitle,
    extractV2Options: task.formatData?.extractV2Options || {}
  });
}

/**
 * Clear URL - remove /search path and query params, keep everything before /search
 * Example: /vi/search?v=... → /vi/ or /search?v=... → /
 */
function clearSearchUrl(): void {
  const url = new URL(window.location.href);
  let newPath = url.pathname.replace(/\/search\/?$/, '') || '/';

  // Ensure path ends with / (except for root /)
  if (newPath !== '/' && !newPath.endsWith('/')) {
    newPath += '/';
  }

  window.history.replaceState({}, '', newPath);
}

/**
 * Handle Next button click
 * Switches back to search view and clears input
 */
async function handleNewConvertButtonClick(): Promise<void> {
  console.log('[renderConversionStatus] Next button clicked');

  const { showSearchView } = await import('./view-switcher');
  const { setInputValue, focusInput } = await import('./ui-renderer');
  const { clearYouTubePreview } = await import('../state');

  // Switch to search view
  showSearchView();

  // Clear input
  setInputValue('');

  // Clear URL
  clearSearchUrl();

  // Clear YouTube preview data
  clearYouTubePreview();

  // Focus input for better UX
  focusInput();
}

// ============================================================
// LEGACY FUNCTIONS - Keep for backward compatibility
// ============================================================

/**
 * Update video title dynamically without full re-render
 * Used in input-form.ts for fake data → real data transition
 * @param meta - Video metadata
 */
export function updateVideoTitle(meta: VideoMeta): void {
  const titleElement = document.getElementById('videoTitle');
  if (!meta || !titleElement) return;

  const displayTitle = meta.title || meta.originalUrl || 'Video không có tiêu đề';
  const escapedTitle = escapeHtml(displayTitle);

  titleElement.textContent = escapedTitle;
  titleElement.setAttribute('title', escapedTitle);

  // Re-activate expandable text logic (see more/collapse)
  const container = titleElement.closest('#previewCard, #downloadOptionsContainer');
  if (container) {
    initExpandableText(container as HTMLElement, '.video-title');
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
