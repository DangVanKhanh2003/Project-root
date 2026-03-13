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
import { showExpireModal } from '@downloader/ui-components';
import { logEvent } from '../../../libs/firebase';
import { LANGUAGES } from '../../downloader/data/languages';

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
    // IMPORTANT: Clear transitionInProgress to prevent updateStatusBarUI from being skipped
    // This can happen when API returns success very quickly after progress reaches 100%
    // (merging phase detection sets transitionInProgress=true, but callback hasn't run yet)
    if (transitionInProgress.get(formatId)) {
      transitionInProgress.set(formatId, false);
    }

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
        if (actionContainer) {
          positionActionContainer(actionContainer);
          actionContainer.classList.add('active'); // Hiện action container
        }

        // IMPORTANT: Ensure downloadBtn has active class
        // This is needed because updateStatusBarUI might have been skipped
        const downloadBtnInCallback = document.getElementById('conversion-download-btn');
        const retryBtnInCallback = document.getElementById('conversion-retry-btn');
        if (downloadBtnInCallback) {
          downloadBtnInCallback.classList.add('active');
        }
        if (retryBtnInCallback) {
          retryBtnInCallback.classList.remove('active');
        }

        delete statusContainer.dataset.completionState;
      }, 400);
    }
    // FAILED: Keep showing error, don't hide

    return;
  }

  // Show status bar for other states (processing, extracting, polling)
  statusContainer.style.display = 'flex';
  // Update status bar UI (with throttling)
  updateStatusBarUI(statusContainer, task, formatId);

  // Handle audio language warning
  if (task.audioLanguageChanged) {
    showAudioLanguageWarning(statusContainer, task.availableAudioLanguages || []);
  } else {
    hideAudioLanguageWarning(statusContainer);
  }
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

const previousMergingPhase = new Map<string, boolean>();
const transitionInProgress = new Map<string, boolean>();

function smoothTransitionTo100(
  statusContainer: HTMLElement,
  callback: () => void,
  totalDelay: number = 400
): void {
  statusContainer.style.setProperty('--progress-scale', '1');
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

  // Build formatId (same logic as in input-form.ts result)
  if (selectedFormat === 'mp4') {
    const videoQuality = state.videoQuality || '720p';

    // Check if explicit format (webm/mkv)
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
 * Includes smooth transition handling for processing → merging phase
 *
 * @param statusContainer - Status bar container element
 * @param task - Conversion task with state
 * @param formatId - Format ID for throttle tracking
 */
function updateStatusBarUI(statusContainer: HTMLElement, task: ConversionTask, formatId: string): void {
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
  const statusElement = statusContainer.querySelector('.status') as HTMLElement | null;
  const statusTextElement = statusContainer.querySelector('.status-text');
  const iconElement = statusContainer.querySelector('.icon') as HTMLElement | null;
  const actionContainer = document.getElementById('action-container') as HTMLElement | null;
  const downloadBtn = document.getElementById('conversion-download-btn') as HTMLElement | null;
  const retryBtn = document.getElementById('conversion-retry-btn') as HTMLElement | null;

  if (!statusElement || !statusTextElement || !iconElement || !actionContainer) {
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
      statusContainer.style.setProperty('--progress-scale', '0');

      // Force browser reflow to apply instant reset
      void statusElement.offsetWidth;

      // Setup for CSS @keyframes animation (0%→50% in 15s, 50%→98% in 25s)
      requestAnimationFrame(() => {
        // 1. Reset progress to 0% so animation starts from 0
        statusContainer.style.setProperty('--progress-scale', '0');

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
        estimator.start(() => { }); // CSS @keyframes handles animation
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

  // Update progress fill background (using scaleX for GPU-accelerated compositing)
  const currentScale = statusContainer.style.getPropertyValue('--progress-scale') || '0';

  // During merging phase, don't update progress (CSS animation handles it)
  if (!isMergingPhase) {
    const scale = progress / 100;
    // If jumping from 0 to 1, use requestAnimationFrame to ensure browser paints 0 first
    if (progress === 100 && (currentScale === '0' || currentScale === '')) {
      requestAnimationFrame(() => {
        statusContainer.style.setProperty('--progress-scale', `${scale}`);
      });
    } else {
      statusContainer.style.setProperty('--progress-scale', `${scale}`);
    }
  }

  // Remove all state classes
  statusElement.classList.remove('status--extracting', 'status--processing', 'status--success', 'status--error');
  iconElement.classList.remove('spinner', 'checkmark', 'error', 'active');
  iconElement.textContent = '';

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
      if (isMergingPhase) {
        // Merging phase: hide spinner (status--merging class added in transition handler)
        iconElement.style.display = 'none';
      } else {
        // Processing phase: show spinner
        iconElement.style.display = '';
        iconElement.classList.add('spinner', 'active');
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
      statusContainer.style.setProperty('--progress-scale', '1');
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
    positionActionContainer(actionContainer);
    actionContainer.classList.add('active');
    // Cleanup throttle map when task completes (prevent memory leak)
    lastUpdateTimes.delete(formatId);
    transitionInProgress.delete(formatId);

    // Show VidTool popup when download fails (after all retries exhausted)
    // showVidToolPopup({
    //   lang: document.documentElement.lang || 'en',
    //   logEvent
    // });
  } else if (task.state !== TaskState.SUCCESS) {
    // Hide for non-terminal states (SUCCESS is handled separately)
    actionContainer.classList.remove('active');
  } else {
    // SUCCESS: Cleanup throttle map (action-container handled in renderConversionStatus)
    lastUpdateTimes.delete(formatId);
    transitionInProgress.delete(formatId);
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

  // Use a flag to prevent duplicate setup for same formatId
  // If formatId changed, we need to re-attach handlers with new formatId
  if (actionContainer.dataset.handlersAttached === 'true' && actionContainer.dataset.formatId === formatId) {
    return;
  }

  const downloadBtn = document.getElementById('conversion-download-btn');
  const retryBtn = document.getElementById('conversion-retry-btn');
  const newConvertBtn = document.getElementById('btn-new-convert');

  // Clone and replace buttons to remove old listeners when formatId changes
  if (downloadBtn) {
    const newDownloadBtn = downloadBtn.cloneNode(true) as HTMLElement;
    downloadBtn.parentNode?.replaceChild(newDownloadBtn, downloadBtn);
    newDownloadBtn.addEventListener('click', () => handleDownloadButtonClick(formatId));
    addRippleEffect(newDownloadBtn);
  }

  if (retryBtn) {
    const newRetryBtn = retryBtn.cloneNode(true) as HTMLElement;
    retryBtn.parentNode?.replaceChild(newRetryBtn, retryBtn);
    newRetryBtn.addEventListener('click', () => handleRetryButtonClick(formatId));
    addRippleEffect(newRetryBtn);
  }

  if (newConvertBtn) {
    const newNewConvertBtn = newConvertBtn.cloneNode(true) as HTMLElement;
    newConvertBtn.parentNode?.replaceChild(newNewConvertBtn, newConvertBtn);
    newNewConvertBtn.addEventListener('click', handleNewConvertButtonClick);
    addRippleEffect(newNewConvertBtn);
  }

  actionContainer.dataset.handlersAttached = 'true';
  actionContainer.dataset.formatId = formatId;
}

/**
 * Handle download button click
 */
async function handleDownloadButtonClick(formatId: string): Promise<void> {
  console.log('[renderConversionStatus] Download button clicked for:', formatId);

  const { handleDownloadClick } = await import('../logic/conversion');
  const result = handleDownloadClick(formatId);

  if (result === 'expired') {
    showExpireModal({ onTryAgain: () => window.location.reload() });
    return;
  }

  if (result === 'error') {
    alert('Download failed. Please try again.');
  }
}

/**
 * Handle retry button click - resubmit the URL from scratch
 */
function handleRetryButtonClick(_formatId: string): void {
  console.log('[renderConversionStatus] Retry button clicked, resubmitting URL');

  const form = document.getElementById('downloadForm') as HTMLFormElement | null;
  if (form) {
    form.requestSubmit();
  }
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

/**
 * Map language code to human readable label
 */
function mapAudioLanguageLabel(code: string): string {
  if (!code || code === 'original') return 'Original';

  const lang = LANGUAGES.find(l => l.code === code);
  return lang ? lang.name : code;
}

/**
 * Show audio language warning message
 */
function showAudioLanguageWarning(statusContainer: HTMLElement, availableLanguages: string[]): void {
  // Find the wrapper (parent of status container)
  const wrapper = statusContainer.closest('.conversion-state-wrapper') as HTMLElement;
  if (!wrapper) return;

  // Check if warning already exists
  let warningDiv = wrapper.querySelector('.audio-language-warning') as HTMLElement;

  if (!warningDiv) {
    warningDiv = document.createElement('div');
    warningDiv.className = 'audio-language-warning';
    // Insert after status container
    statusContainer.insertAdjacentElement('afterend', warningDiv);
  }

  // Format available languages
  const languageLabels = availableLanguages
    .map(code => mapAudioLanguageLabel(code))
    .join(', ');

  warningDiv.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <span>This video only has audio in <strong>${escapeHtml(languageLabels || 'Original')}</strong> — automatically using original audio.</span>
  `;

  // Check if statusContainer is actually a child of this wrapper
  // Priority: Insert after action-container (if present), else status-container, else start
  const actionContainer = wrapper.querySelector('.action-container');
  
  if (actionContainer && wrapper.contains(actionContainer)) {
    actionContainer.insertAdjacentElement('afterend', warningDiv);
  } else if (wrapper.contains(statusContainer)) {
    statusContainer.insertAdjacentElement('afterend', warningDiv);
  } else {
    // Inject at START of wrapper
    wrapper.insertAdjacentElement('afterbegin', warningDiv);
  }

  // Ensure visible
  warningDiv.style.display = 'flex';
}

/**
 * Hide audio language warning message
 */
function hideAudioLanguageWarning(statusContainer: HTMLElement): void {
  const wrapper = statusContainer.closest('.conversion-state-wrapper') as HTMLElement;
  if (!wrapper) return;

  const warningDiv = wrapper.querySelector('.audio-language-warning') as HTMLElement;
  if (warningDiv) {
    warningDiv.style.display = 'none';
    warningDiv.remove();
  }
}

/**
 * Position action container based on status container presence
 * Logic:
 * 1. If status-container exists -> insert action-container AFTER it
 * 2. If status-container missing -> insert action-container at START of wrapper
 * 
 * Note: audio-language-warning will be positioned AFTER action-container by showAudioLanguageWarning
 */
function positionActionContainer(actionContainer: HTMLElement): void {
  const wrapper = actionContainer.closest('.conversion-state-wrapper');
  if (!wrapper) return;

  const statusContainer = wrapper.querySelector('.status-container');

  if (statusContainer) {
    // Always insert immediately after status-container
    // Any existing warning will be pushed down or repositioned by showAudioLanguageWarning
    statusContainer.insertAdjacentElement('afterend', actionContainer);
  } else {
    // Insert at beginning of wrapper
    wrapper.insertAdjacentElement('afterbegin', actionContainer);
  }
}
