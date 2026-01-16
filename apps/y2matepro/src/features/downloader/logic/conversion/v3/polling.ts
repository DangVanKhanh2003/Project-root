/**
 * V3 Polling Logic
 * Simple polling for job status using statusUrl
 */

import { apiV3, v3Config } from '../../../../../api/v3';
import type { StatusResponse } from '@downloader/core';
import { ApiError, NetworkError, TimeoutError } from '@downloader/core';

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
 * Polls until API returns completed or error
 * Network errors are ignored - only stop when API explicitly returns error
 */
export async function startPolling(options: PollingOptions): Promise<void> {
  const { statusUrl, onProgress, onComplete, onError, signal } = options;

  const pollingInterval = v3Config.timeout.pollingInterval;

  while (!signal.aborted) {
    try {
      const status = await apiV3.getStatusByUrl(statusUrl);

      // Handle different statuses
      switch (status.status) {
        case 'pending':
          // Update progress
          onProgress(
            status.progress,
            status.detail ? { video: status.detail.video, audio: status.detail.audio } : undefined
          );
          break;

        case 'completed':
          // Success - download URL available
          if (status.downloadUrl) {
            onProgress(100);
            onComplete(status.downloadUrl);
            return;
          } else {
            onError('Completed but no download URL');
            return;
          }

        case 'error':
          // API returned error - stop polling
          onError(status.jobError || 'Conversion failed');
          return;

        default:
          // Unknown status - continue polling
          console.log('[V3 Polling] Unknown status:', status.status);
          break;
      }
    } catch (error) {
      if (signal.aborted) return;

      // API errors (HTTP 4xx/5xx or status:"error") should STOP polling
      // Only NetworkError/TimeoutError should continue polling
      if (error instanceof ApiError && !(error instanceof NetworkError) && !(error instanceof TimeoutError)) {
        console.error('[V3 Polling] API error, stopping polling:', error.message);
        onError(error.message || 'Conversion failed');
        return;
      }

      // Network/Timeout errors - log and continue polling
      console.log('[V3 Polling] Temporary error, continuing...', error);
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
