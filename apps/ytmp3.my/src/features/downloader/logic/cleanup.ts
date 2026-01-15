/**
 * Cleanup Logic - Destroy Old Processes
 *
 * Centralized cleanup function to destroy all old processes before starting new ones.
 * Called at the beginning of form submission to prevent race conditions.
 */

import { cleanupPollingManager } from './concurrent-polling';
import { clearConversionTasks } from '../state/conversion-state';
import { clearDownloadStates } from '../state/download-state';
import { clearDetailStates } from '../state/media-detail-state';
import { clearYouTubePreview } from '../state/youtube-preview-state';

/**
 * Destroy all old processes before starting new submission
 *
 * This function ensures clean state when user submits a new URL:
 * 1. Stops all polling intervals/timeouts (prevent memory leaks)
 * 2. Aborts all conversion tasks (triggers AbortControllers)
 * 3. Clears all related states
 *
 * IMPORTANT: Call this FIRST in handleSubmit() before any new operations
 */
export function destroyOldProcesses(): void {
  console.log('[Cleanup] 🧹 Destroying all old processes...');

  // ═══════════════════════════════════════════════════════
  // 1. STOP POLLING MANAGER
  // ═══════════════════════════════════════════════════════
  // - Clears all setInterval() for progress polling
  // - Clears all setTimeout() for polling timeouts
  // - Uses global registry to catch leaked intervals
  console.log('[Cleanup] 1/5 Stopping polling manager...');
  cleanupPollingManager();

  // ═══════════════════════════════════════════════════════
  // 2. ABORT CONVERSION TASKS
  // ═══════════════════════════════════════════════════════
  // - Triggers AbortController.abort() for each active task
  // - Stops iOS RAM downloads (downloadStreamToRAM)
  // - Stops polling strategies
  // - Clears conversion tasks from state
  console.log('[Cleanup] 2/5 Aborting conversion tasks...');
  clearConversionTasks();

  // ═══════════════════════════════════════════════════════
  // 3. CLEAR DOWNLOAD STATES
  // ═══════════════════════════════════════════════════════
  // - Clears download button states
  console.log('[Cleanup] 3/5 Clearing download states...');
  clearDownloadStates();

  // ═══════════════════════════════════════════════════════
  // 4. CLEAR MEDIA DETAIL STATES
  // ═══════════════════════════════════════════════════════
  // - Clears videoDetail/galleryDetail
  console.log('[Cleanup] 4/5 Clearing detail states...');
  clearDetailStates();

  // ═══════════════════════════════════════════════════════
  // 5. CLEAR YOUTUBE PREVIEW
  // ═══════════════════════════════════════════════════════
  // - Clears YouTube preview data
  console.log('[Cleanup] 5/5 Clearing YouTube preview...');
  clearYouTubePreview();

  console.log('[Cleanup] ✅ All old processes destroyed');
}

/**
 * Legacy Note:
 *
 * Previously, these cleanup calls were scattered in handleSubmit():
 * - clearDetailStates()
 * - clearConversionTasks()
 * - clearDownloadStates()
 * - clearYouTubePreview()
 *
 * Problems:
 * 1. Polling manager was NOT cleaned up → memory leaks
 * 2. No clear order of cleanup → potential race conditions
 * 3. Cleanup logic mixed with submission logic → hard to maintain
 *
 * Solution:
 * - Centralized cleanup in destroyOldProcesses()
 * - Called FIRST in handleSubmit()
 * - Clear separation of concerns
 */
