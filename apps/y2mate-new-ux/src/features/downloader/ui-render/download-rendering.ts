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
import type { AppState, ConversionTask } from '../state/types';

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
  // Get status bar wrapper
  const wrapper = document.getElementById('conversion-status-wrapper');

  if (!wrapper) {
    // Status bar not present on page - skip
    return;
  }

  // Get current format ID being displayed
  const formatId = getCurrentFormatId(state);

  if (!formatId) {
    // No format selected - hide status bar
    wrapper.classList.remove('active');
    return;
  }

  // Get conversion task for current format
  const task = state.conversionTasks[formatId];

  if (!task) {
    // No active conversion - hide status bar
    wrapper.classList.remove('active');
    return;
  }

  // Show status bar
  wrapper.classList.add('active');

  // Setup button handlers if not already set up
  setupButtonHandlers(wrapper, formatId);
  // Update status bar UI (with throttling)
  updateStatusBarUI(wrapper, task, formatId);
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

  // Build formatId (same logic as in content-renderer.ts)
  if (selectedFormat === 'mp4') {
    return `video|mp4-${state.videoQuality}`;
  } else {
    // Audio formats
    if (state.audioFormat === 'mp3') {
      return `audio|mp3-${state.audioBitrate}kbps`;
    } else {
      return `audio|${state.audioFormat}`;
    }
  }
}

/**
 * Update status bar UI based on conversion task state
 * Throttled to update max every 1 second to avoid excessive DOM updates
 *
 * @param wrapper - Status bar wrapper element
 * @param task - Conversion task with state
 * @param formatId - Format ID for throttle tracking
 */
function updateStatusBarUI(wrapper: HTMLElement, task: ConversionTask, formatId: string): void {
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
  const statusContainer = wrapper.querySelector('.status-container') as HTMLElement | null;
  const statusElement = wrapper.querySelector('.status');
  const statusTextElement = wrapper.querySelector('.status-text');
  const iconElement = wrapper.querySelector('.icon');
  const actionContainer = wrapper.querySelector('.action-container') as HTMLElement | null;
  const downloadBtn = wrapper.querySelector('#conversion-download-btn') as HTMLElement | null;
  const retryBtn = wrapper.querySelector('#conversion-retry-btn') as HTMLElement | null;

  if (!statusContainer || !statusElement || !statusTextElement || !iconElement || !actionContainer) {
    console.warn('[renderConversionStatus] Required DOM elements not found');
    return;
  }

  // Update status text
  statusTextElement.textContent = task.statusText || 'Processing...';

  // Update progress fill background
  const progress = task.progress ?? 0;
  statusContainer.style.setProperty('--progress-width', `${progress}%`);

  // Remove all state classes
  statusElement.classList.remove('status--extracting', 'status--processing', 'status--success', 'status--error');
  iconElement.classList.remove('spinner', 'checkmark', 'error');
  iconElement.textContent = ''; // Clear icon content

  // Add appropriate state class based on task state
  switch (task.state) {
    case TaskState.EXTRACTING:
      statusElement.classList.add('status--extracting');
      iconElement.classList.add('spinner');
      break;

    case TaskState.PROCESSING:
    case TaskState.POLLING:
      statusElement.classList.add('status--processing');
      iconElement.classList.add('spinner');
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
  if (task.state === TaskState.SUCCESS || task.state === TaskState.FAILED) {
    actionContainer.classList.add('active');

    // Cleanup throttle map when task completes (prevent memory leak)
    lastUpdateTimes.delete(formatId);
  } else {
    actionContainer.classList.remove('active');
  }
}

/**
 * Setup button click handlers (idempotent - safe to call multiple times)
 */
function setupButtonHandlers(wrapper: HTMLElement, formatId: string): void {
  // Use a flag to prevent duplicate setup
  if (wrapper.dataset.handlersAttached === 'true') {
    return;
  }

  const downloadBtn = wrapper.querySelector('#conversion-download-btn');
  const retryBtn = wrapper.querySelector('#conversion-retry-btn');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => handleDownloadButtonClick(formatId));
    addRippleEffect(downloadBtn as HTMLElement);
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => handleRetryButtonClick(formatId));
    addRippleEffect(retryBtn as HTMLElement);
  }

  wrapper.dataset.handlersAttached = 'true';
}

/**
 * Handle download button click
 */
async function handleDownloadButtonClick(formatId: string): Promise<void> {
  console.log('[renderConversionStatus] Download button clicked for:', formatId);

  const { handleDownloadClick } = await import('../logic/conversion/convert-logic-v2');
  const result = handleDownloadClick(formatId);

  if (result === 'expired') {
    alert('Download link has expired. Please refresh the page and try again.');
  } else if (result === 'error') {
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

  const { startConversion } = await import('../logic/conversion/convert-logic-v2');
  const videoTitle = state.youtubePreview?.title || 'Video';
  const videoUrl = state.youtubePreview?.url || '';

  await startConversion({
    formatId,
    formatData: task.formatData,
    videoTitle,
    videoUrl
  });
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
