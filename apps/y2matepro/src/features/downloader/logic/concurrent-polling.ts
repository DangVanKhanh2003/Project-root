/**
 * Concurrent Polling Manager
 *
 * Manages multiple simultaneous conversion polling operations
 * with proper cleanup, rate limiting, and error isolation.
 */

import { updateConversionTask, getConversionTask } from '../state';
import { apiV3 } from '../../../api/v3';
import { getConversionModal } from '../../../ui-components/modal/conversion-modal.js';
import { getTimeout } from '../../../environment';

// Type definitions
interface PollingConfig {
    maxConcurrent?: number;
    pollInterval?: number;
    maxPollingDuration?: number;
}

interface TaskData {
    progressUrl?: string;
    vid?: string;
    bId?: string;
    onProgressUpdate?: (data: ProgressUpdateData) => Promise<void> | void;
    onStatusUpdate?: (result: any) => Promise<void> | void;
}

interface ProgressUpdateData {
    videoProgress: number;
    audioProgress: number;
    status: string;
    mergedUrl?: string;
    filename?: string;
}

interface PollData {
    intervalId: number;
    timeoutId: number;
    startTime: number;
    errorCount: number;
    taskData: TaskData;
}

interface QueueItem {
    formatId: string;
    taskData: TaskData;
}

interface StatusInfo {
    activeCount: number;
    queueCount: number;
    maxConcurrent: number;
    activeFormats: string[];
    queuedFormats: string[];
}

interface GlobalRegistryStatus {
    intervals: number;
    timeouts: number;
    intervalIds: number[];
    timeoutIds: number[];
}

class ConcurrentPollingManager {
    private maxConcurrent: number;
    private pollInterval: number;
    private maxPollingDuration: number;
    private activePolls: Map<string, PollData>;
    private pollQueue: QueueItem[];
    private allIntervals: Set<number>;
    private allTimeouts: Set<number>;

    constructor(config: PollingConfig = {}) {
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
    }

    /**
     * Start polling for a conversion task
     * @param formatId - Unique format identifier
     * @param taskData - Task data from /convert API response
     */
    startPolling(formatId: string, taskData: TaskData): void {
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
    private _startPollingImmediate(formatId: string, taskData: TaskData): void {
        const startTime = Date.now();

        // Call IMMEDIATELY on start (don't wait for first interval)
        this._checkTaskStatus(formatId, taskData);

        // Create polling interval for subsequent checks
        const jitter = Math.floor(Math.random() * 500); // 0-500ms jitter to avoid sync spikes
        const intervalId = window.setInterval(() => {
            this._checkTaskStatus(formatId, taskData);
        }, this.pollInterval + jitter);

        // Create timeout for cleanup
        const timeoutId = window.setTimeout(() => {
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
    private async _checkTaskStatus(formatId: string, taskData: TaskData): Promise<void> {
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

        } catch (error: any) {
            await this._handlePollingError(formatId, error);
        }
    }

    /**
     * Handle progress polling with V3 API
     * @private
     */
    private async _handleProgressPolling(formatId: string, taskData: TaskData): Promise<void> {
        const statusUrl = taskData.progressUrl!;

        // Call V3 getStatusByUrl
        const statusResponse = await apiV3.getStatusByUrl(statusUrl);

        // Extract progress from V3 response
        const videoProgress = statusResponse.detail?.video ?? statusResponse.progress ?? 0;
        const audioProgress = statusResponse.detail?.audio ?? statusResponse.progress ?? 0;

        // Map V3 status
        let status = 'processing';
        if (statusResponse.status === 'completed') {
            status = 'completed';
        } else if (statusResponse.status === 'error') {
            throw new Error(statusResponse.jobError || 'Conversion failed');
        } else if (statusResponse.progress >= 100) {
            status = 'merging';
        }

        // Call progress update callback
        if (taskData.onProgressUpdate) {
            await taskData.onProgressUpdate({
                videoProgress,
                audioProgress,
                status,
                mergedUrl: statusResponse.downloadUrl,
                filename: statusResponse.title
            });
        }

        // Success - reset error counter
        const poll = this.activePolls.get(formatId);
        if (poll) {
            poll.errorCount = 0;
        }

        // Check completion
        if (statusResponse.downloadUrl) {
            this.stopPolling(formatId);
            this._processQueue();
        }
    }

    /**
     * Get rotating status text based on elapsed time
     * @private
     */
    private _getRotatingStatusText(formatId: string): string {
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
     * @param formatId - Format identifier
     */
    stopPolling(formatId: string): void {

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
    private _handlePollingTimeout(formatId: string): void {
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
     * Only stop when API returns status === 'error'
     * Network/timeout errors just continue polling
     * @private
     */
    private async _handlePollingError(formatId: string, error: any): Promise<void> {
        const poll = this.activePolls.get(formatId);
        if (!poll) {
            return;
        }

        // Check if user canceled
        if (error.name === 'AbortError') {
            this.stopPolling(formatId);
            return;
        }

        // Check if this is an API error (status === 'error' from server)
        const isApiError = error.message && error.message.includes('Conversion failed');

        if (isApiError) {
            // API returned error status - stop polling and show error
            console.error(`[Polling] API error for ${formatId}:`, error.message);
            this.stopPolling(formatId);

            updateConversionTask(formatId, {
                state: 'Failed',
                statusText: error.message,
                showProgressBar: false,
                error: error.message,
                completedAt: Date.now()
            });

            const conversionModal = getConversionModal();
            conversionModal.transitionToError(error.message);
            this._processQueue();
            return;
        }

        // Network/timeout error - just log and continue polling
        console.log(`[Polling] Network error for ${formatId}, continuing...`, error.message);
    }

    /**
     * Process queued polling operations
     * @private
     */
    private _processQueue(): void {
        while (this.pollQueue.length > 0 && this.activePolls.size < this.maxConcurrent) {
            const item = this.pollQueue.shift();
            if (!item) break;

            const { formatId, taskData } = item;

            // Check if task still exists and is valid
            const task = getConversionTask(formatId);
            if (task && task.state === 'Converting') {
                this._startPollingImmediate(formatId, taskData);
            }
        }
    }

    /**
     * Cancel polling for a format (user cancellation)
     * @param formatId - Format identifier
     */
    cancelPolling(formatId: string): void {
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
     * @param formatId - Format identifier
     * @returns Queue position (0-based, -1 if not in queue)
     */
    getQueuePosition(formatId: string): number {
        return this.pollQueue.findIndex(item => item.formatId === formatId);
    }

    /**
     * Get current status info
     * @returns Status information
     */
    getStatus(): StatusInfo {
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
    private _forceCleanupAllTimers(): void {
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
    cleanup(): void {
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
let pollingManager: ConcurrentPollingManager | null = null;

// Global interval registry for race condition protection
// This persists across pollingManager instances
const GLOBAL_INTERVAL_REGISTRY = {
    intervals: new Set<number>(),
    timeouts: new Set<number>(),

    register(intervalId: number, timeoutId: number): void {
        this.intervals.add(intervalId);
        this.timeouts.add(timeoutId);
    },

    unregister(intervalId: number, timeoutId: number): void {
        this.intervals.delete(intervalId);
        this.timeouts.delete(timeoutId);
    },

    forceCleanupAll(): number {
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

    getStatus(): GlobalRegistryStatus {
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
 * @param config - Configuration options
 * @returns ConcurrentPollingManager instance
 */
export function getPollingManager(config: PollingConfig = {}): ConcurrentPollingManager {
    if (!pollingManager) {
        pollingManager = new ConcurrentPollingManager(config);
    }
    return pollingManager;
}

/**
 * Cleanup the global polling manager
 */
export function cleanupPollingManager(): void {
    if (pollingManager) {
        pollingManager.cleanup();
        pollingManager = null;
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
export function forceCleanupAllIntervals(): number {
    return GLOBAL_INTERVAL_REGISTRY.forceCleanupAll();
}

/**
 * Get global registry status for debugging
 */
export function getGlobalRegistryStatus(): GlobalRegistryStatus {
    return GLOBAL_INTERVAL_REGISTRY.getStatus();
}

// Export class for direct usage if needed
export { ConcurrentPollingManager };
