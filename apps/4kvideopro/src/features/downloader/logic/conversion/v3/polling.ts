/**
 * V3 Polling Logic
 * Simple polling for job status using statusUrl
 */

import { apiV3, v3Config } from '../../../../../api/v3';
import type { StatusResponse } from '@downloader/core';
import { RETRY_CONFIGS, isTimeoutError } from '../retry-helper';

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
 * Network errors are retried up to maxConsecutiveErrors times
 */
export async function startPolling(options: PollingOptions): Promise<void> {
  const { statusUrl, onProgress, onComplete, onError, signal } = options;

  const pollingInterval = v3Config.timeout.pollingInterval;
  const maxConsecutiveErrors = RETRY_CONFIGS.polling.maxConsecutiveErrors;
  let consecutiveErrors = 0;

  while (!signal.aborted) {
    try {
      const status = await apiV3.getStatusByUrl(statusUrl);

      // Reset error counter on successful response
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
          console.log('[V3 Polling] Unknown status:', status.status);
          break;
      }
    } catch (error) {
      if (signal.aborted) return;

      // Timeout is NOT an error - continue polling immediately
      if (isTimeoutError(error)) {
        console.log('[V3 Polling] Request timeout - continuing polling...');
        continue;
      }

      // Check for Job Error (from service) - Stop immediately
      if ((error as any).isJobError) {
        console.log('[V3 Polling] Job failed logic error, stopping:', (error as any).message);
        onError((error as any).message);
        return;
      }

      // Check for API-level Job Error (thrown by HttpClient)
      // HttpClient throws ApiError when response.status === 'error'
      // This is NOT a network error, it's a valid job failure response
      // Fix: Stop polling if API returns "status": "error"
      const apiResponse = (error as any).response;
      if (apiResponse && apiResponse.status === 'error') {
        const errorMessage = apiResponse.jobError || (error as any).message || 'Conversion failed';
        console.log('Job failed (API returned error status), stopping:', errorMessage);
        onError(errorMessage);
        return;
      }

      // Real network error - count it
      consecutiveErrors++;
      console.log(`[V3 Polling] Network error (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);

      // Check if max consecutive errors reached
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.log(`[V3 Polling] Max consecutive errors (${maxConsecutiveErrors}) reached. Stopping.`);
        onError(`Network error after ${maxConsecutiveErrors} retries`);
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

