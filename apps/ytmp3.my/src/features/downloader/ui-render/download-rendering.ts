/**
 * Download Rendering Utilities
 *
 * Handles rendering of conversion status bar based on state changes.
 * This module integrates with the main render flow (ui-renderer.ts) to provide
 * consistent, state-driven UI updates without polling.
 */

import { initExpandableText } from '../../../utils';
import { LANGUAGES } from '../data/languages';
import { addRippleEffect } from '@downloader/core/utils';
import { TaskState } from '../logic/conversion/types';
import type { AppState, ConversionTask } from '../state/types';
import { getMergingEstimator, clearMergingEstimator } from './merging-progress-estimator';
import { showVidToolPopup } from '@downloader/vidtool-popup';
import { showExpireModal } from '@downloader/ui-components';
import { logEvent } from '../../../libs/firebase';
import { reloadIfStale } from '../../../utils/page-freshness';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface VideoMeta {
  title?: string;
  originalUrl?: string;
}

// ============================================================
// PENDING TIMERS — cleared on reset to prevent race conditions
// ============================================================

let pendingTimers: ReturnType<typeof setTimeout>[] = [];

function schedulePendingTimer(callback: () => void, delay: number): void {
  const id = setTimeout(() => {
    pendingTimers = pendingTimers.filter(t => t !== id);
    callback();
  }, delay);
  pendingTimers.push(id);
}

function clearPendingTimers(): void {
  pendingTimers.forEach(id => clearTimeout(id));
  pendingTimers = [];
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
      schedulePendingTimer(() => {
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
  const statusElement = statusContainer.querySelector('.status') as HTMLElement | null;
  if (!statusElement) {
    callback();
    return;
  }

  // Always set to 100% first (so UI displays it)
  statusContainer.style.setProperty('--progress-scale', '1');

  // Then delay 400ms for user to see 100%, then callback
  schedulePendingTimer(callback, totalDelay);
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
    // Note: videoQuality stores the raw value "webm" or "mkv" when selected
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

  // Audio language warning (insert after .status)
  if (task.audioLanguageChanged) {
    showAudioLanguageWarning(statusContainer, task.availableAudioLanguages || []);
  } else {
    hideAudioLanguageWarning(statusContainer);
  }

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

      // Setup for CSS @keyframes animation (0%→50% in 20s, 50%→98% in 30s)
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

  // Update status text - show "Merging... X%" during merging phase (from estimator)
  if (isMergingPhase) {
    // During merging, estimator handles progress updates directly
    // Just ensure spinner is active
    const estimator = getMergingEstimator(formatId);
    if (!estimator.isRunning()) {
      // Estimator not running - show current progress from estimator
      const currentMergingProgress = estimator.getProgress();
      statusTextElement.textContent = `Merging... ${currentMergingProgress}%`;
    }
    // Don't update progress bar here - estimator handles it
  } else {
    statusTextElement.textContent = task.statusText || 'Processing...';
  }

  // Update progress fill background (using scaleX for GPU-accelerated compositing)
  const currentScale = statusContainer.style.getPropertyValue('--progress-scale') || '0';

  // During merging phase, don't update progress (already at 0 after transition)
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
      // Add completing class for fast 0.3s transition to 100%
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

      // Show VidTool popup when download fails (after all retries exhausted)
      // showVidToolPopup({
      //   lang: document.documentElement.lang || 'en',
      //   logEvent
      // });
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
  } else if (task.state !== TaskState.SUCCESS) {
    // Hide for non-terminal states (SUCCESS is handled separately)
    actionContainer.classList.remove('active');
  } else {
    // SUCCESS: Cleanup throttle map (action-container handled in renderConversionStatus)
    lastUpdateTimes.delete(formatId);
    transitionInProgress.delete(formatId);
  }
}

function mapAudioLanguageLabel(code: string): string {
  const normalized = code.trim().toLowerCase();
  const match = LANGUAGES.find((lang) => lang.code.toLowerCase() === normalized);
  return match?.name || code;
}

function showAudioLanguageWarning(statusContainer: HTMLElement, availableLanguages: string[]): void {
  // Logic:
  // 1. Try to find parent wrapper (.conversion-state-wrapper)
  // 2. If wrapper exists:
  //    a. Check if warning already exists inside wrapper -> remove it
  //    b. Use statusContainer as reference (it IS the status element passed in)
  //    c. If statusContainer is in wrapper, inject AFTER statusContainer
  //    d. If not, inject at BEGINNING of wrapper

  const wrapper = statusContainer.closest('.conversion-state-wrapper') || statusContainer.parentElement;
  if (!wrapper) return;

  const existing = wrapper.querySelector('.audio-language-warning');
  if (existing) {
    existing.remove();
  }

  const languageLabels = availableLanguages
    .filter(Boolean)
    .map(mapAudioLanguageLabel)
    .join(', ');

  const warningDiv = document.createElement('div');
  warningDiv.className = 'audio-language-warning';
  warningDiv.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
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
  clearPendingTimers();
  if (reloadIfStale()) return;
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
