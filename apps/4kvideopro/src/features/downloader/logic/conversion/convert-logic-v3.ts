/**
 * convert-logic-v3.ts - V3 API Conversion Logic
 *
 * Simplified conversion flow using V3 API:
 * 1. Create job (POST /api/download)
 * 2. Poll status (GET /api/status/:id)
 * 3. Get download URL when completed
 *
 * NO cross-imports with V2 - completely isolated
 */

import { apiV3 } from '../../../../api/v3';
import { mapToV3DownloadRequest } from '@downloader/core';
import {
  setConversionTask,
  getConversionTask,
  updateConversionTask,
  getState,
} from '../../state';
import { triggerDownload } from '../../../../utils';

// V3 specific imports
import { TaskState, type V3ConversionParams } from './v3/types';
import { startPolling } from './v3/polling';
import { getErrorMessage } from './v3/error-messages';
import { retryWithBackoff, RETRY_CONFIGS } from './retry-helper';

// Debug logger
const LOG_PREFIX = '[ConvertLogicV3]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

// Rotating extract messages (displayed every 2s during extract phase)
const EXTRACT_MESSAGES = [
  'Creating download job...',
  'Analyzing video source...',
  'Fetching media info...',
  'Preparing download...',
  'Connecting to server...',
];
const EXTRACT_MESSAGE_INTERVAL = 2000; // 2 seconds

/**
 * Main entry point for V3 conversion flow
 */
export async function startConversion(params: V3ConversionParams): Promise<void> {
  const { formatId, videoUrl, videoTitle, extractV2Options } = params;

  log('=== START CONVERSION V3 ===');
  log('formatId:', formatId);
  log('videoUrl:', videoUrl);
  log('extractV2Options:', JSON.stringify(extractV2Options, null, 2));

  // Setup abort controller
  const abortController = new AbortController();

  // Initialize task state
  setConversionTask(formatId, {
    state: TaskState.EXTRACTING,
    statusText: EXTRACT_MESSAGES[0],
    showProgressBar: false,
    startedAt: Date.now(),
    abortController,
  });

  // Start rotating extract messages every 2 seconds
  let messageIndex = 0;
  const messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % EXTRACT_MESSAGES.length;
    updateConversionTask(formatId, {
      statusText: EXTRACT_MESSAGES[messageIndex],
    });
  }, EXTRACT_MESSAGE_INTERVAL);

  try {
    // Phase 1: Create job
    log('Phase 1: Creating job...');
    const request = mapToV3DownloadRequest(videoUrl, extractV2Options);
    log('V3 Request:', JSON.stringify(request, null, 2));

    // Cast response to CreateJobResponse to access audio fields
    const jobResponse = await retryWithBackoff(
      () => apiV3.createJob(request, abortController.signal),
      RETRY_CONFIGS.extracting
    ) as any;
    log('Job created:', JSON.stringify(jobResponse, null, 2));

    // Stop rotating messages when job is created
    clearInterval(messageInterval);

    if (abortController.signal.aborted) {
      log('Aborted after job creation');
      return;
    }

    // Update state with job info
    updateConversionTask(formatId, {
      state: TaskState.PROCESSING,
      statusText: 'Processing...',
      showProgressBar: true,
      sourceId: jobResponse.statusUrl,
      audioLanguageChanged: jobResponse.audioLanguageChanged,
      availableAudioLanguages: jobResponse.availableAudioLanguages,
    });

    // Phase 2: Poll for status using statusUrl
    log('Phase 2: Starting polling with statusUrl:', jobResponse.statusUrl);

    await startPolling({
      statusUrl: jobResponse.statusUrl,

      onProgress: (progress, detail) => {
        log('Progress:', progress, detail);
        updateConversionTask(formatId, {
          progress,
          statusText: progress < 100 ? 'Processing...' : 'Finalizing...',
        });
      },

      onComplete: (downloadUrl) => {
        log('Completed! Download URL:', downloadUrl);
        updateConversionTask(formatId, {
          state: TaskState.SUCCESS,
          statusText: 'Merging...',
          progress: 100,
          downloadUrl,
          filename: generateFilename(videoTitle, extractV2Options),
          completedAt: Date.now(),
        });
      },

      onError: (error) => {
        logError('Polling error:', error);
        updateConversionTask(formatId, {
          state: TaskState.FAILED,
          statusText: `Error: ${getErrorMessage(error)}`,
          error: getErrorMessage(error),
          completedAt: Date.now(),
        });
      },

      signal: abortController.signal,
    });

  } catch (error) {
    // Always clear interval on error
    clearInterval(messageInterval);

    if (abortController.signal.aborted) {
      log('Caught error but was aborted, ignoring');
      return;
    }

    const errorMessage = getErrorMessage(error);
    logError('Error in conversion:', errorMessage);

    updateConversionTask(formatId, {
      state: TaskState.FAILED,
      statusText: `Error: ${errorMessage}`,
      error: errorMessage,
      completedAt: Date.now(),
    });
  } finally {
    // Ensure interval is always cleared
    clearInterval(messageInterval);
    log('=== END CONVERSION V3 ===');
  }
}

/**
 * Cancel current conversion
 */
export function cancelConversion(formatId: string): void {
  const task = getConversionTask(formatId);
  if (task?.abortController) {
    log('Canceling conversion:', formatId);
    task.abortController.abort();
    updateConversionTask(formatId, {
      state: TaskState.CANCELED,
      statusText: 'Canceled',
      completedAt: Date.now(),
    });
  }
}

/**
 * Handle download button click
 * Returns 'success', 'error', or 'expired' for UI compatibility
 */
export function handleDownloadClick(formatId: string): 'success' | 'error' | 'expired' {
  const task = getConversionTask(formatId);

  if (!task?.downloadUrl) {
    logError('No download URL available for:', formatId);
    return 'error';
  }

  // Check if download URL has expired (V3 URLs typically expire after some time)
  // For now, we don't have expiration tracking, so just try to download
  // TODO: Add expiration check if V3 API provides expiration info

  log('Triggering download:', task.downloadUrl);
  triggerDownload(task.downloadUrl, task.filename || 'download');
  return 'success';
}

/**
 * Generate filename from title and options
 */
function generateFilename(
  title: string,
  options: V3ConversionParams['extractV2Options']
): string {
  const sanitizedTitle = title
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .substring(0, 100); // Limit length

  const isVideo = options.downloadMode === 'video';

  if (isVideo) {
    const quality = options.videoQuality || '720';
    const format = options.youtubeVideoContainer || 'mp4';
    return `${sanitizedTitle}_${quality}p.${format}`;
  } else {
    const format = options.audioFormat || 'mp3';
    const bitrate = options.audioBitrate || '128';
    return `${sanitizedTitle}_${bitrate}kbps.${format}`;
  }
}
