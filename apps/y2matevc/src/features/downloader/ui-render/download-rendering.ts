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
import { getMergingEstimator, clearMergingEstimator } from './merging-progress-estimator';
import { showVidToolPopup } from '@downloader/vidtool-popup';
import { logEvent } from '../../../libs/firebase';

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
// MERGING PHASE TRANSITION STATE
// ============================================================

// Track previous merging phase status per format ID to detect transitions
const previousMergingPhase = new Map<string, boolean>();

// Flag to prevent updates during smooth transition animation
const transitionInProgress = new Map<string, boolean>();

/**
 * Smooth transition helper - tween gradient to 100% before phase change
 * Mimics ytmp3.gg behavior for smooth UX when transitioning to merging phase
 * @param statusContainer - Status bar container element
 * @param callback - Execute after transition completes
 * @param totalDelay - Total delay in ms (default 400ms, includes CSS transition time)
 */
function smoothTransitionTo100(
  statusContainer: HTMLElement,
  callback: () => void,
  totalDelay: number = 400
): void {
  // Always set to 100% first (so UI displays it)
  statusContainer.style.setProperty('--progress-width', '100%');

  // Then delay 400ms for user to see 100%, then callback
  setTimeout(callback, totalDelay);
}

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

  // Build formatId (same logic as in input-form.ts)
  // IMPORTANT: Must use same fallback values to match formatId
  if (selectedFormat === 'mp4') {
    return `video|mp4-${state.videoQuality || '720p'}`;
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
 * Includes smooth transition handling for processing → merging phase
 *
 * @param wrapper - Status bar wrapper element
 * @param task - Conversion task with state
 * @param formatId - Format ID for throttle tracking
 */
function updateStatusBarUI(wrapper: HTMLElement, task: ConversionTask, formatId: string): void {
  // Skip if transition animation is in progress for this format
  if (transitionInProgress.get(formatId)) {
    return;
  }

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
  const statusElement = wrapper.querySelector('.status') as HTMLElement | null;
  const statusTextElement = wrapper.querySelector('.status-text');
  const iconElement = wrapper.querySelector('.icon') as HTMLElement | null;
  const actionContainer = wrapper.querySelector('.action-container') as HTMLElement | null;
  const downloadBtn = wrapper.querySelector('#conversion-download-btn') as HTMLElement | null;
  const retryBtn = wrapper.querySelector('#conversion-retry-btn') as HTMLElement | null;

  if (!statusContainer || !statusElement || !statusTextElement || !iconElement || !actionContainer) {
    console.warn('[renderConversionStatus] Required DOM elements not found');
    return;
  }

  // Calculate progress and detect merging phase
  const progress = task.progress ?? 0;
  const isMergingPhase = task.state === 'processing' && progress >= 100;

  // Detect transition from processing → merging phase
  const wasMergingPhase = previousMergingPhase.get(formatId) || false;
  const isTransitionToMerging = !wasMergingPhase && isMergingPhase;

  // Update previous merging phase status for next call
  previousMergingPhase.set(formatId, isMergingPhase);

  // If transitioning to merging phase, smooth tween to 100% first
  if (isTransitionToMerging) {
    transitionInProgress.set(formatId, true);

    // Hide spinner immediately (before delay)
    iconElement.style.display = 'none';

    smoothTransitionTo100(statusContainer, () => {
      // After transition, update text and reset gradient to 0%
      statusTextElement.textContent = 'Merging... 0%';

      // Temporarily disable transition for instant reset
      statusElement.classList.add('status--no-transition');
      statusContainer.style.setProperty('--progress-width', '0%');

      // Force browser reflow to apply instant reset
      void statusElement.offsetWidth;

      // Setup for CSS @keyframes animation (0%→50% in 15s, 50%→98% in 25s)
      requestAnimationFrame(() => {
        // 1. Reset progress to 0% so animation starts from 0
        statusContainer.style.setProperty('--progress-width', '0%');

        // 2. Remove no-transition, add merging class (triggers animation)
        statusElement.classList.remove('status--no-transition');
        statusElement.classList.add('status--merging');
        transitionInProgress.set(formatId, false);

        // 3. Update text
        if (statusTextElement) {
          statusTextElement.textContent = 'Merging...';
        }

        // 4. Mark estimator as running for complete() to work
        const estimator = getMergingEstimator(formatId);
        estimator.start(() => {}); // CSS @keyframes handles animation
      });
    });

    return; // Exit early, callback will handle UI update
  }

  // Update status text - show "Merging..." during merging phase
  if (isMergingPhase) {
    // During merging, estimator handles progress updates directly
    // Just ensure spinner is hidden
    const estimator = getMergingEstimator(formatId);
    if (!estimator.isRunning()) {
      // Estimator not running - show current progress from estimator
      const currentMergingProgress = estimator.getProgress();
      statusTextElement.textContent = `Merging... ${currentMergingProgress}%`;
    }
    // Don't update progress bar here - CSS animation handles it
  } else {
    statusTextElement.textContent = task.statusText || 'Processing...';
  }

  // Update progress fill background
  const currentWidth = statusContainer.style.getPropertyValue('--progress-width') || '0%';

  // During merging phase, don't update progress (CSS animation handles it)
  if (!isMergingPhase) {
    // If jumping from 0% to 100%, use requestAnimationFrame to ensure browser paints 0% first
    if (progress === 100 && (currentWidth === '0%' || currentWidth === '')) {
      requestAnimationFrame(() => {
        statusContainer.style.setProperty('--progress-width', `${progress}%`);
      });
    } else {
      statusContainer.style.setProperty('--progress-width', `${progress}%`);
    }
  }

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
    case TaskState.DOWNLOADING:
    case TaskState.POLLING:
      statusElement.classList.add('status--processing');
      if (isMergingPhase) {
        // Merging phase: hide spinner (status--merging class added in transition handler)
        iconElement.style.display = 'none';
      } else {
        // Processing phase: show spinner
        iconElement.style.display = '';
        iconElement.classList.add('spinner');
      }
      break;

    case TaskState.SUCCESS:
      statusElement.classList.add('status--success');
      iconElement.classList.add('checkmark');
      iconElement.textContent = '✓';
      iconElement.style.display = ''; // Show icon again
      // Add completing class for fast 0.5s transition to 100%
      statusElement.classList.add('status--completing');
      statusElement.classList.remove('status--no-transition', 'status--merging');
      // Complete merging estimator (jump to 100%) and cleanup
      {
        const estimator = getMergingEstimator(formatId);
        if (estimator.isRunning()) {
          estimator.complete(); // Jump to 100%
        }
        clearMergingEstimator(formatId);
      }
      // Set progress to 100%
      statusContainer.style.setProperty('--progress-width', '100%');
      // Cleanup merging phase tracking
      previousMergingPhase.delete(formatId);
      break;

    case TaskState.FAILED:
      statusElement.classList.add('status--error');
      iconElement.classList.add('error');
      iconElement.textContent = '✕';
      // Stop and cleanup merging estimator
      clearMergingEstimator(formatId);
      // Cleanup merging phase tracking
      previousMergingPhase.delete(formatId);

      // Show VidTool popup when download fails (after all retries exhausted)
      showVidToolPopup({
        lang: document.documentElement.lang || 'en',
        logEvent
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

  // Update action-container visibility and status-container hiding
  if (task.state === TaskState.SUCCESS || task.state === TaskState.FAILED) {
    // Prevent re-triggering setTimeout if already showing completion state
    if (statusContainer.dataset.completionState === task.state) {
      return;
    }
    statusContainer.dataset.completionState = task.state;

    if (task.state === TaskState.SUCCESS) {
      // SUCCESS: Wait for animation to complete before hiding status container
      // 200ms CSS transition + 150ms visible at 100% = 350ms
      setTimeout(() => {
        statusContainer.style.display = 'none';
        actionContainer.classList.add('active');
        delete statusContainer.dataset.completionState;
      }, 350);
    } else {
      // FAILED: Keep showing error, show action buttons immediately
      actionContainer.classList.add('active');
    }

    // Cleanup throttle map when task completes (prevent memory leak)
    lastUpdateTimes.delete(formatId);
    transitionInProgress.delete(formatId);
  } else {
    actionContainer.classList.remove('active');
    statusContainer.style.display = ''; // Ensure status container is visible
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

  const { handleDownloadClick } = await import('../logic/conversion');
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
