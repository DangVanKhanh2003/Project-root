/**
 * convert-logic-v3.ts - V3 API Conversion Logic
 *
 * Conversion flow with Priority Extract Router:
 * - Resolves strategy (external-first or v3-first) based on country/format
 * - External Extract: 1 request -> direct download URL (no polling)
 * - V3 flow: create job -> poll status -> download URL
 * - Silent fallback between APIs on failure
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
import { isLinkExpired } from '../../../../utils/link-validator';

// V3 specific imports
import { TaskState, type V3ConversionParams } from './v3/types';
import { startPolling } from './v3/polling';
import { getErrorMessage } from './v3/error-messages';

// Retry helper
import { retryWithBackoff, RETRY_CONFIGS } from './retry-helper';

// Priority Extract Router
import { resolveExtractStrategy, callExternalExtract, EXTRACT_STRATEGY } from '../priority-extract-router';

// Debug logger
const LOG_PREFIX = '[ConvertLogicV3]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

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
    statusText: 'Creating download job...',
    showProgressBar: false,
    startedAt: Date.now(),
    abortController,
  });

  try {
    // ── Resolve extract strategy ──
    const strategy = resolveExtractStrategy(extractV2Options);
    log('Extract strategy:', strategy);

    if (strategy === EXTRACT_STRATEGY.EXTERNAL_FIRST) {
      // Try External Extract first -> V3 fallback
      const extResult = await tryExternalExtract(
        formatId, videoUrl, videoTitle, extractV2Options, abortController
      );
      if (extResult === 'success' || extResult === 'aborted') return;

      // External failed -> silent fallback to V3
      log('External extract failed, falling back to V3...');
    }

    // ── V3 flow (primary or fallback) ──
    const v3Result = await runV3Flow(
      formatId, videoUrl, videoTitle, extractV2Options, abortController
    );

    if (v3Result === 'success' || v3Result === 'aborted') return;

    // V3 failed -> try External Extract as fallback (only if v3-first strategy)
    if (strategy === EXTRACT_STRATEGY.V3_FIRST) {
      const outputFormat = extractV2Options.downloadMode === 'video'
        ? (extractV2Options.youtubeVideoContainer || 'mp4')
        : (extractV2Options.audioFormat || 'mp3');

      if (outputFormat === 'mp3' || outputFormat === 'mp4') {
        log('V3 failed, trying external extract fallback...');
        const extResult = await tryExternalExtract(
          formatId, videoUrl, videoTitle, extractV2Options, abortController
        );
        if (extResult === 'success' || extResult === 'aborted') return;
      }
    }

    // Both failed
    const errorMessage = getErrorMessage(v3Result);
    logError('All extract paths failed:', errorMessage);

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

/**
 * Try External Extract API — direct download, no polling.
 * Returns 'success', 'aborted', or the error.
 */
async function tryExternalExtract(
  formatId: string,
  videoUrl: string,
  videoTitle: string,
  extractV2Options: V3ConversionParams['extractV2Options'],
  abortController: AbortController,
): Promise<'success' | 'aborted' | unknown> {
  if (abortController.signal.aborted) return 'aborted';

  log('Trying External Extract API...');
  const extResult = await callExternalExtract(videoUrl, extractV2Options, abortController.signal);

  if (abortController.signal.aborted) return 'aborted';

  if (extResult.ok && extResult.data) {
    const data = extResult.data;
    log('External extract succeeded:', data.url);

    const resolvedTitle = data.title || videoTitle;

    updateConversionTask(formatId, {
      state: TaskState.SUCCESS,
      statusText: 'Download ready',
      progress: 100,
      downloadUrl: data.url,
      filename: data.filename || generateFilename(resolvedTitle, extractV2Options),
      completedAt: Date.now(),
    });

    return 'success';
  }

  log('External extract failed:', extResult.error);
  return extResult.error;
}

/**
 * Run V3 flow (create job -> poll status).
 * Returns 'success', 'aborted', or the last error.
 */
async function runV3Flow(
  formatId: string,
  videoUrl: string,
  videoTitle: string,
  extractV2Options: V3ConversionParams['extractV2Options'],
  abortController: AbortController,
): Promise<'success' | 'aborted' | unknown> {
  try {
    // Phase 1: Create job (with retry — reduced to 3 total attempts)
    log('V3 Phase 1: Creating job...');
    const request = mapToV3DownloadRequest(videoUrl, extractV2Options);
    log('V3 Request:', JSON.stringify(request, null, 2));

    const jobResponse = await retryWithBackoff(
      () => apiV3.createJob(request, abortController.signal),
      RETRY_CONFIGS.extracting
    ) as CreateJobResponse;
    log('Job created:', JSON.stringify(jobResponse, null, 2));

    if (abortController.signal.aborted) return 'aborted';

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
    log('V3 Phase 2: Starting polling with statusUrl:', jobResponse.statusUrl);

    const downloadUrl = await pollOnce({
      statusUrl: jobResponse.statusUrl,
      signal: abortController.signal,
      onProgress: (progress, _detail) => {
        log('Progress:', progress, _detail);
        updateConversionTask(formatId, {
          progress,
          statusText: progress < 100 ? 'Processing...' : 'Finalizing...',
        });
      },
    });

    log('V3 Completed! Download URL:', downloadUrl);

    updateConversionTask(formatId, {
      state: TaskState.SUCCESS,
      statusText: 'Merging...',
      progress: 100,
      downloadUrl,
      filename: generateFilename(videoTitle, extractV2Options),
      completedAt: Date.now(),
    });

    return 'success';
  } catch (error) {
    if (abortController.signal.aborted) return 'aborted';

    logError('V3 flow failed:', error);
    return error;
  }
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

  if (isLinkExpired(task.completedAt)) {
    log('Download URL expired for:', formatId);
    return 'expired';
  }

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
