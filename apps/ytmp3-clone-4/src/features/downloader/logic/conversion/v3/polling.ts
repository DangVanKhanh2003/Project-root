/**
 * V3 Polling Logic
 * Simple polling for job status using statusUrl
 */

import { apiV3, v3Config } from '../../../../../api/v3';
import type { StatusResponse } from '@downloader/core';

/**
 * Polling options
 */
export interface PollingOptions {
  /** Full status URL from createJob response (includes token & expires) */
  statusUrl: string;

  /** Callback when progress updates */
  onProgress: (progress: number, detail?: { video: number; audio: number }) => void;

  /** Callback when completed */
  onComplete: (downloadUrl: string) => void;

  /** Callback when error occurs */
  onError: (error: string) => void;

  /** Abort signal for cancellation */
  signal: AbortSignal;
}

/**
 * Start polling for job status
 * Polls every 1 second until completed or error
 */
export async function startPolling(options: PollingOptions): Promise<void> {
  const { statusUrl, onProgress, onComplete, onError, signal } = options;

  const pollingInterval = v3Config.timeout.pollingInterval;
  const maxDuration = v3Config.timeout.maxPollingDuration;
  const startTime = Date.now();

  while (!signal.aborted) {
    // Check max duration
    if (Date.now() - startTime > maxDuration) {
      onError('Polling timeout: exceeded maximum duration');
      return;
    }

    try {
      const status = await apiV3.getStatusByUrl(statusUrl);

      // Handle different statuses
      switch (status.status) {
        case 'pending':
          // Update progress
          console.log('[Polling] 📡 pending - progress:', status.progress);
          onProgress(
            status.progress,
            status.detail ? { video: status.detail.video, audio: status.detail.audio } : undefined
          );
          break;

        case 'completed':
          // Success - download URL available
          console.log('[Polling] 📡 completed - calling onProgress(100) then onComplete');
          if (status.downloadUrl) {
            onProgress(100);
            console.log('[Polling] 📡 onProgress(100) done, now calling onComplete');
            onComplete(status.downloadUrl);
            return;
          } else {
            onError('Completed but no download URL');
            return;
          }

        case 'error':
          // Error occurred
          onError(status.jobError || 'Unknown error');
          return;

        default:
          // Unknown status
          onError(`Unknown status: ${status.status}`);
          return;
      }
    } catch (error) {
      // Network or API error
      if (signal.aborted) return;

      const errorMessage = error instanceof Error ? error.message : 'Polling failed';
      onError(errorMessage);
      return;
    }

    // Wait for next poll
    await sleep(pollingInterval);
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
