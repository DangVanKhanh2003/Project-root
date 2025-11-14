/**
 * Concurrent Polling Manager
 *
 * Manages multiple simultaneous conversion polling operations
 * with proper cleanup, rate limiting, and error isolation.
 */

import { updateConversionTask, getConversionTask } from './state.js';
import { createVerifiedService } from '../../libs/downloader-lib-standalone/index.js';
import { getApiBaseUrl, getTimeout } from '../../environment.js';
import { withCaptchaProtection } from '../../libs/captcha-core/captcha-ui.js';
import { getConversionModal } from './conversion-modal.js';

class ConcurrentPollingManager {
  constructor(config = {}) {
    this.maxConcurrent = config.maxConcurrent || 5;
    // Base poll interval; a small jitter will be added per tick
    this.pollInterval = config.pollInterval || 1000; // 1 second polling as requested
    // Maximum total time to poll a task before timing out (separate from HTTP timeouts)
    this.maxPollingDuration = config.maxPollingDuration || 10 * 60 * 1000; // 10 minutes default

    // Track active polling operations
    this.activePolls = new Map(); // formatId -> { intervalId, timeoutId, startTime, errorCount, taskData }
    this.pollQueue = []; // Queued polling operations

    // Track ALL intervals for force cleanup (race condition protection)
    this.allIntervals = new Set(); // Set of all intervalIds ever created
    this.allTimeouts = new Set(); // Set of all timeoutIds ever created

    // Service instance with CAPTCHA protection
    this.service = createVerifiedService({
      apiBaseUrl: getApiBaseUrl(),
      timeout: getTimeout('default')
    }, {}, withCaptchaProtection);

  }

  /**
   * Start polling for a conversion task
   * @param {string} formatId - Unique format identifier
   * @param {Object} taskData - Task data from /convert API response
   */
  startPolling(formatId, taskData) {

    // Check if already polling this format
    if (this.activePolls.has(formatId)) {
      return;
    }

    // Check concurrent limit
    if (this.activePolls.size >= this.maxConcurrent) {
      this.pollQueue.push({ formatId, taskData });
      return;
    }

    this._startPollingImmediate(formatId, taskData);
  }

  /**
   * Immediately start polling without queue checks
   * @private
   */
  _startPollingImmediate(formatId, taskData) {
    const startTime = Date.now();

    // Create polling interval
    const jitter = Math.floor(Math.random() * 500); // 0-500ms jitter to avoid sync spikes
    const intervalId = setInterval(() => {
      this._checkTaskStatus(formatId, taskData);
    }, this.pollInterval + jitter);

    // Create timeout for cleanup
    const timeoutId = setTimeout(() => {
      this._handlePollingTimeout(formatId);
    }, this.maxPollingDuration);

    // Track ALL intervals/timeouts for force cleanup
    this.allIntervals.add(intervalId);
    this.allTimeouts.add(timeoutId);

    // ALSO register globally for race condition protection
    GLOBAL_INTERVAL_REGISTRY.register(intervalId, timeoutId);


    // Track polling operation
    this.activePolls.set(formatId, {
      intervalId,
      timeoutId,
      startTime,
      errorCount: 0,
      taskData
    });

  }

  /**
   * Check conversion task status via API
   * @private
   */
  async _checkTaskStatus(formatId, taskData) {
    try {
      const task = getConversionTask(formatId);

      // Check if task was canceled
      if (!task || task.abortController.signal.aborted) {
        this.stopPolling(formatId);
        return;
      }

      // ONLY progressUrl polling - no checkTask fallbacks
      if (!taskData.progressUrl) {
        throw new Error(`No progressUrl provided for format: ${formatId}`);
      }

      // Handle progressUrl polling
      await this._handleProgressPolling(formatId, taskData);

    } catch (error) {
      await this._handlePollingError(formatId, error);
    }
  }

  /**
   * Handle rich progress polling with progressUrl
   * @private
   */
  async _handleProgressPolling(formatId, taskData) {

    try {
      // Direct HTTP GET to progressUrl
      const response = await fetch(taskData.progressUrl);

      if (!response.ok) {
        throw new Error(`Progress API error: ${response.status} ${response.statusText}`);
      }

      const progressData = await response.json();

      // Expected format: { cacheId, videoProgress, audioProgress, status, mergedUrl, filename }
      const { videoProgress, audioProgress, status, mergedUrl, filename } = progressData;

      // Call progress update callback from convert logic
      if (taskData.onProgressUpdate) {
        await taskData.onProgressUpdate({
          videoProgress: videoProgress || 0,
          audioProgress: audioProgress || 0,
          status: status,
          mergedUrl: mergedUrl,
          filename: filename
        });
      }

      // Check completion based on mergedUrl availability
      if (mergedUrl) {

        // Stop polling and mark as complete
        this.stopPolling(formatId);

        // The onProgressUpdate callback will handle the completion
        // via completePolling() function in convert-logic.js

        this._processQueue();
      }

    } catch (error) {
      throw error; // Let _checkTaskStatus handle the error
    }
  }

  /**
   * OBSOLETE: Handle simple status polling with checkTask API
   * This function is no longer used - only progressUrl polling is supported
   * @deprecated Use _handleProgressPolling instead
   * @private
   */
  async _handleStatusPolling(formatId, taskData) 
    {

      // Call check-task API
      const result = await this.service.checkTask({
        vid: taskData.vid,
        b_id: taskData.bId
      });

      if (!result.ok) {
        throw new Error(result.message || 'Failed to check task status');
      }

      const { c_status, downloadUrl, dlink } = result.data;
      const actualDownloadUrl = downloadUrl || dlink; // API might use 'dlink' field

      // Update status text based on elapsed time
      const statusText = this._getRotatingStatusText(formatId);

      // Check if conversion is completed by presence of downloadUrl
      if (actualDownloadUrl) {
        // Stop polling, mark as completed
        this.stopPolling(formatId);

        // Check if auto-download is requested
        const shouldAutoDownload = task.autoDownloadOnComplete;

        updateConversionTask(formatId, {
          state: 'Success',
          statusText: 'Ready',
          showProgressBar: false,
          downloadUrl: actualDownloadUrl,
          completedAt: Date.now(),
          autoDownloadOnComplete: false  // Reset flag
        });

        // Transition modal to success state
        const conversionModal = getConversionModal();
        conversionModal.transitionToSuccess(actualDownloadUrl);

        // Auto-download if requested (for retry flow)
        if (shouldAutoDownload) {
          // Small delay to let UI update
          setTimeout(() => {
            import('../../utils.js').then(module => {
              // Extract filename from URL or use default
              let filename = 'download';
              try {
                const urlParts = actualDownloadUrl.split('/');
                const lastPart = urlParts[urlParts.length - 1];
                if (lastPart && lastPart.includes('.')) {
                  filename = lastPart.split('?')[0]; // Remove query params
                }
              } catch (error) {
              }

              module.triggerDownload(actualDownloadUrl, filename);
              conversionModal.close();
            });
          }, 300);
        }

        // Process next in queue
        this._processQueue();

      } else if (c_status && ['success', 'converted'].includes(c_status.toLowerCase())) {
        // Stop polling, mark as completed (legacy c_status check)
        this.stopPolling(formatId);

        updateConversionTask(formatId, {
          state: 'Success',
          statusText: 'Ready',
          showProgressBar: false,
          downloadUrl: actualDownloadUrl,
          completedAt: Date.now()
        });

        // Transition modal to success state
        const conversionModal = getConversionModal();
        conversionModal.transitionToSuccess(actualDownloadUrl);

        // Call status update callback if provided
        if (taskData.onStatusUpdate) {
          await taskData.onStatusUpdate(result);
        }

        // Process next in queue
        this._processQueue();

      } else {
        // Continue polling - no downloadUrl yet
        updateConversionTask(formatId, {
          statusText: statusText,
          showProgressBar: true
        });

        // Call status update callback if provided
        if (taskData.onStatusUpdate) {
          await taskData.onStatusUpdate(result);
        }
      }

      // Legacy checks for backwards compatibility
      if (c_status && c_status.toLowerCase() === 'failed') {
        // Stop polling, mark as failed
        this.stopPolling(formatId);

        const errorMessage = result.data.message || 'Conversion failed';

        updateConversionTask(formatId, {
          state: 'Failed',
          statusText: 'Conversion failed',
          showProgressBar: false,
          completedAt: Date.now(),
          error: errorMessage
        });

        // Transition modal to error state
        const conversionModal = getConversionModal();
        conversionModal.transitionToError(errorMessage);


        // Process next in queue
        this._processQueue();
      }

    } 
    catch (error) {
      // Allow a few transient errors before failing the task
      const poll = this.activePolls.get(formatId);
      if (poll) {
        poll.errorCount = (poll.errorCount || 0) + 1;
        // On Abort, fail fast as it is a user/system cancel
        if (error.name === 'AbortError') {
          this._handlePollingError(formatId, error);
          return;
        }
        if (poll.errorCount <= 3) {
          return; // keep interval running
        }
      }
      this._handlePollingError(formatId, error);
    }
  

  /**
   * Get rotating status text based on elapsed time
   * @private
   */
  _getRotatingStatusText(formatId) {
    const poll = this.activePolls.get(formatId);
    if (!poll) return 'Converting...';

    const elapsedTime = Date.now() - poll.startTime;
    const statusMessages = [
      'Preparing...',
      'Converting...',
      'Processing...',
      'Optimizing...',
      'Finalizing...'
    ];

    // Rotate every 3 seconds
    const index = Math.floor(elapsedTime / 3000) % statusMessages.length;
    return statusMessages[index];
  }

  /**
   * Stop polling for a specific format
   * @param {string} formatId - Format identifier
   */
  stopPolling(formatId) {

    const poll = this.activePolls.get(formatId);
    if (!poll) {

      // Check global registry for leaked intervals
      const globalStatus = GLOBAL_INTERVAL_REGISTRY.getStatus();

      // Race condition protection: Force cleanup ALL remaining timers
      // This handles the case where _checkTaskStatus() cleared activePolls but intervals are still running
      this._forceCleanupAllTimers();
      return;
    }


    // Clear interval and timeout
    clearInterval(poll.intervalId);
    clearTimeout(poll.timeoutId);

    // Remove from tracking sets
    this.allIntervals.delete(poll.intervalId);
    this.allTimeouts.delete(poll.timeoutId);

    // ALSO unregister from global registry
    GLOBAL_INTERVAL_REGISTRY.unregister(poll.intervalId, poll.timeoutId);

    // Remove from active polls
    this.activePolls.delete(formatId);

  }

  /**
   * Handle polling timeout
   * @private
   */
  _handlePollingTimeout(formatId) {
    this.stopPolling(formatId);

    updateConversionTask(formatId, {
      state: 'Failed',
      statusText: 'Conversion timeout',
      showProgressBar: false,
      error: 'Conversion took too long',
      completedAt: Date.now()
    });

    this._processQueue();
  }

  /**
   * Handle polling error
   * @private
   */
  _handlePollingError(formatId, error) {
    this.stopPolling(formatId);

    let errorMessage = 'Conversion failed';
    if (error.name === 'AbortError') {
      errorMessage = 'Conversion was canceled';
    } else if (error.message) {
      errorMessage = error.message;
    }

    updateConversionTask(formatId, {
      state: 'Failed',
      statusText: errorMessage,
      showProgressBar: false,
      error: errorMessage,
      completedAt: Date.now()
    });

    // Transition modal to error state (unless it's user cancellation)
    if (error.name !== 'AbortError') {
      const conversionModal = getConversionModal();
      conversionModal.transitionToError(errorMessage);
    }

    this._processQueue();
  }

  /**
   * Process queued polling operations
   * @private
   */
  _processQueue() {
    while (this.pollQueue.length > 0 && this.activePolls.size < this.maxConcurrent) {
      const { formatId, taskData } = this.pollQueue.shift();

      // Check if task still exists and is valid
      const task = getConversionTask(formatId);
      if (task && task.state === 'Converting') {
        this._startPollingImmediate(formatId, taskData);
      }
    }
  }

  /**
   * Cancel polling for a format (user cancellation)
   * @param {string} formatId - Format identifier
   */
  cancelPolling(formatId) {

    // Remove from queue if present
    const initialQueueLength = this.pollQueue.length;
    this.pollQueue = this.pollQueue.filter(item => item.formatId !== formatId);
    const removedFromQueue = initialQueueLength !== this.pollQueue.length;

    // Stop active polling
    this.stopPolling(formatId);

    // Fallback: If there are still intervals running, force cleanup all
    if (this.allIntervals.size > 0) {
      this._forceCleanupAllTimers();
    }

    // Process next in queue
    this._processQueue();

  }

  /**
   * Get queue position for a format
   * @param {string} formatId - Format identifier
   * @returns {number} Queue position (0-based, -1 if not in queue)
   */
  getQueuePosition(formatId) {
    return this.pollQueue.findIndex(item => item.formatId === formatId);
  }

  /**
   * Get current status info
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      activeCount: this.activePolls.size,
      queueCount: this.pollQueue.length,
      maxConcurrent: this.maxConcurrent,
      activeFormats: Array.from(this.activePolls.keys()),
      queuedFormats: this.pollQueue.map(item => item.formatId)
    };
  }

  /**
   * Force cleanup ALL timers (race condition protection)
   * @private
   */
  _forceCleanupAllTimers() {

    // Clear local intervals first
    let clearedIntervalsCount = 0;
    for (const intervalId of this.allIntervals) {
      clearInterval(intervalId);
      clearedIntervalsCount++;
    }

    // Clear local timeouts
    let clearedTimeoutsCount = 0;
    for (const timeoutId of this.allTimeouts) {
      clearTimeout(timeoutId);
      clearedTimeoutsCount++;
    }

    // Clear tracking sets
    this.allIntervals.clear();
    this.allTimeouts.clear();

    // Clear active polls (they're all invalid now)
    this.activePolls.clear();

    // FALLBACK: Use global registry to catch leaked intervals
    const globalClearedCount = GLOBAL_INTERVAL_REGISTRY.forceCleanupAll();

  }

  /**
   * Cleanup all polling operations
   */
  cleanup() {

    // Stop all active polls
    for (const formatId of this.activePolls.keys()) {
      this.stopPolling(formatId);
    }

    // Force cleanup any remaining timers
    this._forceCleanupAllTimers();

    // Clear queue
    this.pollQueue = [];
  }
}

// Global instance
let pollingManager = null;

// Global interval registry for race condition protection
// This persists across pollingManager instances
const GLOBAL_INTERVAL_REGISTRY = {
  intervals: new Set(),
  timeouts: new Set(),

  register(intervalId, timeoutId) {
    this.intervals.add(intervalId);
    this.timeouts.add(timeoutId);
  },

  unregister(intervalId, timeoutId) {
    this.intervals.delete(intervalId);
    this.timeouts.delete(timeoutId);
  },

  forceCleanupAll() {

    let clearedCount = 0;
    for (const intervalId of this.intervals) {
      clearInterval(intervalId);
      clearedCount++;
    }

    for (const timeoutId of this.timeouts) {
      clearTimeout(timeoutId);
    }

    this.intervals.clear();
    this.timeouts.clear();
    return clearedCount;
  },

  getStatus() {
    return {
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      intervalIds: Array.from(this.intervals),
      timeoutIds: Array.from(this.timeouts)
    };
  }
};

/**
 * Get or create the global polling manager instance
 * @param {Object} config - Configuration options
 * @returns {ConcurrentPollingManager}
 */
export function getPollingManager(config = {}) {
  if (!pollingManager) {
    pollingManager = new ConcurrentPollingManager(config);
  }
  return pollingManager;
}

/**
 * Cleanup the global polling manager
 */
export function cleanupPollingManager() {
  if (pollingManager) {
    pollingManager.cleanup();
    pollingManager = null;
  } else {
  }

  // Always check global registry for leaked intervals (race condition protection)
  const globalStatus = GLOBAL_INTERVAL_REGISTRY.getStatus();
  if (globalStatus.intervals > 0 || globalStatus.timeouts > 0) {
    GLOBAL_INTERVAL_REGISTRY.forceCleanupAll();
  }
}

/**
 * Force cleanup all intervals globally (emergency cleanup)
 */
export function forceCleanupAllIntervals() {
  return GLOBAL_INTERVAL_REGISTRY.forceCleanupAll();
}

/**
 * Get global registry status for debugging
 */
export function getGlobalRegistryStatus() {
  return GLOBAL_INTERVAL_REGISTRY.getStatus();
}

// Export class for direct usage if needed
export { ConcurrentPollingManager };
