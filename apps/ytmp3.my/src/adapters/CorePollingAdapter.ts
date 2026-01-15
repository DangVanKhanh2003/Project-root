/**
 * CorePollingAdapter
 *
 * Adapter that bridges @downloader/core PollingStrategy to app's polling infrastructure.
 * Implements IPollingManager interface for dependency injection.
 *
 * Phase 3A Integration - ytmp3-clone-3
 */

import type {
  IPollingManager,
  PollingOptions,
  PollingProgressData,
  PollingStatusResult
} from '@downloader/core/conversion';
import { getPollingManager } from '../features/downloader/logic/concurrent-polling';

/**
 * Adapter: Core PollingStrategy → App polling infrastructure
 *
 * This adapter receives polling requests from core PollingStrategy
 * and forwards them to the app's ConcurrentPollingManager.
 */
export class CorePollingAdapter implements IPollingManager {
  /**
   * Start polling for a task
   *
   * Core PollingStrategy calls this to start server-side polling.
   * We forward this to the app's polling manager.
   */
  startPolling(taskId: string, options: PollingOptions): void {
    const appPollingManager = getPollingManager();

    // Forward to app's polling manager with callback mapping
    appPollingManager.startPolling(taskId, {
      progressUrl: options.progressUrl,

      // Map core callback → app callback
      onProgressUpdate: (data) => {
        // Forward progress updates to core strategy
        options.onProgressUpdate({
          videoProgress: data.videoProgress || 0,
          audioProgress: data.audioProgress || 0,
          status: data.status || 'processing',
          mergedUrl: data.mergedUrl
        });
      },

      // Map core callback → app callback
      onStatusUpdate: (result) => {
        // Forward status updates to core strategy
        options.onStatusUpdate({
          mergedUrl: result.mergedUrl || result.url
        });
      }
    });
  }

  /**
   * Stop polling for a task
   *
   * Core PollingStrategy calls this when:
   * - Conversion completes
   * - Task is cancelled
   * - Error occurs
   */
  stopPolling(taskId: string): void {
    const appPollingManager = getPollingManager();
    appPollingManager.stopPolling(taskId);
  }
}
