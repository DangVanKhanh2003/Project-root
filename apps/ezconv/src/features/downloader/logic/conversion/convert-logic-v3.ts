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
import { mapToV3DownloadRequest, type CreateJobResponse } from '@downloader/core';
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
import { checkLimit, recordDownloadError, type DownloadMethod } from '../../../../features/download-limit';
import { showLimitReachedPopup, showVideoLimitPopup } from '@downloader/ui-shared';
import { POPUP_CONFIG } from '../../../../features/supporter-popup-config';
import { incrementDownloadCount } from '../../../../features/widget-level-manager';

// Retry helper
import { retryWithBackoff, RETRY_CONFIGS } from './retry-helper';

// Debug logger
const LOG_PREFIX = '[ConvertLogicV3]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

/**
 * Main entry point for V3 conversion flow
 */
export async function startConversion(params: V3ConversionParams): Promise<void> {
  const { formatId, videoUrl, videoTitle, extractV2Options } = params;
  const maxJobAttempts = Math.max(1, params.maxJobAttempts ?? 2);
  const downloadMethod = resolveSingleDownloadMethod(extractV2Options);
  let lastRequestPayload: unknown = null;

  log('=== START CONVERSION V3 ===');
  log('formatId:', formatId);
  log('videoUrl:', videoUrl);
  log('extractV2Options:', JSON.stringify(extractV2Options, null, 2));

  // Setup abort controller
  const abortController = new AbortController();

  // Initialize task state
  setConversionTask(formatId, {
    state: TaskState.EXTRACTING,
    statusText: 'Creating download job...',
    showProgressBar: false,
    startedAt: Date.now(),
    abortController,
  });

  const limitResult = await checkLimit({
    kind: downloadMethod === 'trim' ? 'trim' : 'single',
  });

  if (!limitResult.allowed) {
    if (limitResult.type === 'daily_mode_limit') {
      showLimitReachedPopup(POPUP_CONFIG, limitResult.mode ?? undefined);
    } else if (limitResult.type === 'bulk_video_count') {
      showVideoLimitPopup(POPUP_CONFIG, limitResult.limit ?? undefined);
    }

    updateConversionTask(formatId, {
      state: TaskState.FAILED,
      statusText: 'Limit reached',
      error: 'Limit reached',
      completedAt: Date.now(),
    });
    return;
  }

  const FAKE_PROGRESS_MAX = 95;
  const FAKE_PROGRESS_STEP = 1;
  const FAKE_PROGRESS_INTERVAL_MS = 3000;
  let fakeProgress = 0;
  let fakeProgressInterval: number | null = null;
  let fakeProgressActive = false;

  const stopFakeProgress = () => {
    if (fakeProgressInterval !== null) {
      window.clearInterval(fakeProgressInterval);
      fakeProgressInterval = null;
    }
    fakeProgressActive = false;
  };

  const startFakeProgress = () => {
    if (fakeProgressActive) return;
    const currentTask = getConversionTask(formatId);
    fakeProgress = Math.min(currentTask?.progress ?? 0, FAKE_PROGRESS_MAX);
    fakeProgressActive = true;

    if (fakeProgressInterval !== null) {
      window.clearInterval(fakeProgressInterval);
    }

    fakeProgressInterval = window.setInterval(() => {
      if (!fakeProgressActive) return;
      if (fakeProgress >= FAKE_PROGRESS_MAX) return;
      fakeProgress = Math.min(fakeProgress + FAKE_PROGRESS_STEP, FAKE_PROGRESS_MAX);
      updateConversionTask(formatId, { progress: fakeProgress });
    }, FAKE_PROGRESS_INTERVAL_MS);
  };

  const handleProgressUpdate = (progress: number, detail?: { video: number; audio: number }) => {
    if (fakeProgressActive) {
      if (progress <= fakeProgress) {
        return;
      }
      stopFakeProgress();
    }

    log('Progress:', progress, detail);
    updateConversionTask(formatId, {
      progress,
      statusText: progress < 100 ? 'Processing...' : 'Finalizing...',
    });
  };

  try {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxJobAttempts; attempt++) {
      if (abortController.signal.aborted) {
        log('Aborted before attempt', attempt);
        stopFakeProgress();
        return;
      }
      try {
        // Phase 1: Create job (with retry)
        log('Phase 1: Creating job...');
        const request = mapToV3DownloadRequest(videoUrl, extractV2Options);
        lastRequestPayload = request;
        log('V3 Request:', JSON.stringify(request, null, 2));

        const jobResponse = await retryWithBackoff(
          () => apiV3.createJob(request, abortController.signal),
          RETRY_CONFIGS.extracting
        ) as CreateJobResponse;
        log('Job created:', JSON.stringify(jobResponse, null, 2));

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

        const downloadUrl = await pollOnce({
          statusUrl: jobResponse.statusUrl,
          signal: abortController.signal,
          onProgress: handleProgressUpdate,
        });

        log('Completed! Download URL:', downloadUrl);
        stopFakeProgress();
        updateConversionTask(formatId, {
          state: TaskState.SUCCESS,
          statusText: 'Merging...',
          progress: 100,
          downloadUrl,
          filename: generateFilename(videoTitle, extractV2Options),
          completedAt: Date.now(),
        });
        await incrementDownloadCount(downloadMethod, videoUrl);

        return;
      } catch (error) {
        if (abortController.signal.aborted) {
          log('Caught error but was aborted, ignoring');
          stopFakeProgress();
          return;
        }

        lastError = error;
        logError(`Job attempt ${attempt} failed:`, error);

        // Terminal job errors (status: error/not_found/failed/faild) should not retry full flow.
        if ((error as any)?.isJobError) {
          break;
        }

        if (attempt < maxJobAttempts) {
          startFakeProgress();
          continue;
        }
      }
    }

    const errorMessage = getErrorMessage(lastError);
    logError('Error in conversion:', errorMessage);
    stopFakeProgress();
    await recordDownloadError({
      method: 'extractV3_stream',
      url: videoUrl,
      endpoint: `${window.location.origin.includes('localhost') ? 'https://hub.ytconvert.org' : 'https://hub.ytconvert.org'}/api/download`,
      requestData: lastRequestPayload,
      errorData: normalizeErrorForLog(lastError, errorMessage),
    });

    updateConversionTask(formatId, {
      state: TaskState.FAILED,
      statusText: `Error: ${errorMessage}`,
      error: errorMessage,
      completedAt: Date.now(),
    });
  } finally {
    log('=== END CONVERSION V3 ===');
  }
}

function normalizeErrorForLog(error: unknown, fallbackMessage: string): Record<string, unknown> {
  const candidate = error as {
    status?: number;
    message?: string;
    response?: unknown;
    data?: unknown;
  } | null;

  const response = candidate?.response ?? candidate?.data ?? {};
  const status = typeof candidate?.status === 'number'
    ? candidate.status
    : typeof (response as { status?: unknown })?.status === 'number'
      ? ((response as { status: number }).status)
      : null;

  return {
    status,
    message: candidate?.message || fallbackMessage,
    response,
  };
}

function resolveSingleDownloadMethod(options: V3ConversionParams['extractV2Options']): DownloadMethod {
  const hasTrim =
    Number.isFinite(options?.trimStart) ||
    Number.isFinite(options?.trimEnd);

  return hasTrim ? 'trim' : 'single';
}

interface PollOnceOptions {
  statusUrl: string;
  signal: AbortSignal;
  onProgress: (progress: number, detail?: { video: number; audio: number }) => void;
}

function pollOnce(options: PollOnceOptions): Promise<string> {
  const { statusUrl, signal, onProgress } = options;

  return new Promise((resolve, reject) => {
    startPolling({
      statusUrl,
      signal,
      onProgress,
      onComplete: (downloadUrl) => resolve(downloadUrl),
      onError: (error) => reject(error),
    }).catch(reject);
  });
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
