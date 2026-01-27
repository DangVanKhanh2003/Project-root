/**
 * V3 Polling Logic
 * Simple polling for job status using statusUrl
 * With consecutive error tracking for retry logic
 */

import { apiV3, v3Config } from '../../../../../api/v3';
import type { StatusResponse } from '@downloader/core';
import { RETRY_CONFIGS, isTimeoutError } from '../retry-helper';

const LOG_PREFIX = '[V3 Polling]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);

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
 * With consecutive error tracking - fails after maxConsecutiveErrors
 * Timeout errors do NOT count towards consecutive errors (unlimited retries)
 */
export async function startPolling(options: PollingOptions): Promise<void> {
  const { statusUrl, onProgress, onComplete, onError, signal } = options;

  const pollingInterval = v3Config.timeout.pollingInterval;
  const { maxConsecutiveErrors } = RETRY_CONFIGS.polling;

  let consecutiveErrors = 0;

  while (!signal.aborted) {
    try {
      const status = await apiV3.getStatusByUrl(statusUrl);

      // Reset consecutive errors on successful response
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
          // API returned error - stop polling
          onError(status.jobError || 'Conversion failed');
          return;

        default:
          // Unknown status - continue polling
          log('Unknown status:', status.status);
          break;
      }
    } catch (error) {
      if (signal.aborted) return;

      // Timeout is NOT an error - continue polling immediately
      if (isTimeoutError(error)) {
        log('Timeout error, continuing polling...');
        continue;
      }

      // Check for Job Error (from service) - Stop immediately
      if ((error as any).isJobError) {
        log('Job failed logic error, stopping:', (error as any).message);
        onError((error as any).message);
        return;
      }

      // Network/API error - increment consecutive errors
      consecutiveErrors++;
      log(`Error (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);

      // Check if max consecutive errors reached
      if (consecutiveErrors >= maxConsecutiveErrors) {
        log('Max consecutive errors reached, failing...');
        onError('Network error - please try again');
        return;
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
