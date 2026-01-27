/**
 * V3 Polling Logic
 * Simple polling for job status using statusUrl
 */

import { apiV3, v3Config } from '../../../../../api/v3';
import type { StatusResponse } from '@downloader/core';
import { ApiError, NetworkError, TimeoutError } from '@downloader/core';
import { RETRY_CONFIGS } from '../retry-helper';

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
 *
 * Retry strategy:
 * - Timeout errors: do NOT count, can retry unlimited times
 * - Other errors: count towards consecutive error limit (3 max)
 * - Success: reset consecutive error count
 */
export async function startPolling(options: PollingOptions): Promise<void> {
  const { statusUrl, onProgress, onComplete, onError, signal } = options;

  const pollingInterval = v3Config.timeout.pollingInterval;
  const maxConsecutiveErrors = RETRY_CONFIGS.polling.maxConsecutiveErrors;

  let consecutiveErrors = 0;
  let lastErrorMessage = '';

  while (!signal.aborted) {
    try {
      const status = await apiV3.getStatusByUrl(statusUrl);

      // Success - reset consecutive errors
      consecutiveErrors = 0;

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
          // API returned error (job failed) - stop polling immediately
          onError(status.jobError || 'Conversion failed');
          return;

        default:
          // Unknown status - continue polling
          console.log('[V3 Polling] Unknown status:', status.status);
          break;
      }
    } catch (error) {
      if (signal.aborted) return;

      // Timeout errors do NOT count - continue polling immediately
      if (error instanceof TimeoutError) {
        console.log('[V3 Polling] Timeout, retrying (does not count as error)...');
        continue;
      }

      // Check for Job Error (from service) - Stop immediately
      if ((error as any).isJobError) {
        console.log('[V3 Polling] Job failed logic error, stopping:', (error as any).message);
        onError((error as any).message);
        return;
      }
      // Network errors and other retryable errors - count towards limit
      else if (error instanceof NetworkError) {
        consecutiveErrors++;
        lastErrorMessage = error.message || 'Network error';
        console.log(`[V3 Polling] Network error (${consecutiveErrors}/${maxConsecutiveErrors}):`, error.message);

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('[V3 Polling] Max consecutive errors reached, stopping');
          onError(lastErrorMessage);
          return;
        }
      }
      // API errors (HTTP 4xx/5xx) - count towards limit
      else if (error instanceof ApiError) {
        consecutiveErrors++;
        lastErrorMessage = error.message || 'Server error';
        console.log(`[V3 Polling] API error (${consecutiveErrors}/${maxConsecutiveErrors}):`, error.message);

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('[V3 Polling] Max consecutive errors reached, stopping');
          onError(lastErrorMessage);
          return;
        }
      }
      // Unknown errors - count towards limit
      else {
        consecutiveErrors++;
        lastErrorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`[V3 Polling] Unknown error (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('[V3 Polling] Max consecutive errors reached, stopping');
          onError(lastErrorMessage);
          return;
        }
      }
    }

    // Wait before next poll
    await sleep(pollingInterval);
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
