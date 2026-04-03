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
import { mapToV3DownloadRequest, type CreateJobResponse, FEATURE_KEYS } from '@downloader/core';
import {
  setConversionTask,
  getConversionTask,
  updateConversionTask,
  getState,
} from '../../state';
import { triggerDownload } from '../../../../utils';
import { isLinkExpired } from '../../../../utils/link-validator';

import { recordUsage } from '../../../download-limit';

// V3 specific imports
import { TaskState, type V3ConversionParams } from './v3/types';
import { startPolling } from './v3/polling';
import { getErrorMessage } from './v3/error-messages';
import { extractMediaInfoFromCreateJob, hasExtractedMediaInfo } from './v3/extract-media-info';

// Retry helper
import { retryWithBackoff, RETRY_CONFIGS } from './retry-helper';

// Priority Extract Router
import { resolveExtractStrategy, callExternalExtract, EXTRACT_STRATEGY } from '../priority-extract-router';

// Debug logger
const LOG_PREFIX = '[ConvertLogicV3]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

function normalizeVideoResolution(videoQuality: string | undefined): string {
  const normalized = (videoQuality || '').toLowerCase();
  const grouped = normalized.match(/^(?:mp4|webm|mkv)-(\d+)p$/);
  if (grouped) return `${grouped[1]}p`;

  const plain = normalized.match(/^(\d+)p$/);
  if (plain) return `${plain[1]}p`;

  const numeric = normalized.match(/^(\d+)$/);
  if (numeric) return `${numeric[1]}p`;

  return '';
}

/**
 * Main entry point for V3 conversion flow
 */
export async function startConversion(params: V3ConversionParams): Promise<void> {
  const { formatId, videoUrl, videoTitle, extractV2Options, onExtracted } = params;
  const maxJobAttempts = Math.max(1, params.maxJobAttempts ?? 2);

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
    // ── Resolve extract strategy ──
    const strategy = resolveExtractStrategy(extractV2Options);
    log('Extract strategy:', strategy);

    if (strategy === EXTRACT_STRATEGY.EXTERNAL_FIRST) {
      // Try External Extract first -> V3 fallback
      const extResult = await tryExternalExtract(
        formatId, videoUrl, videoTitle, extractV2Options, abortController, onExtracted
      );
      if (extResult === 'success' || extResult === 'aborted') return;

      // External failed -> silent fallback to V3
      log('External extract failed, falling back to V3...');
    }

    // ── V3 flow (primary or fallback) ──
    const v3Result = await runV3Flow(
      formatId, videoUrl, videoTitle, extractV2Options,
      maxJobAttempts, abortController, onExtracted,
      handleProgressUpdate, startFakeProgress, stopFakeProgress
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
          formatId, videoUrl, videoTitle, extractV2Options, abortController, onExtracted
        );
        if (extResult === 'success' || extResult === 'aborted') return;
      }
    }

    // Both failed
    const errorMessage = getErrorMessage(v3Result);
    logError('All extract paths failed:', errorMessage);
    stopFakeProgress();

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
 * Try External Extract API -- direct download, no polling.
 * Returns 'success', 'aborted', or the error.
 */
async function tryExternalExtract(
  formatId: string,
  videoUrl: string,
  videoTitle: string,
  extractV2Options: V3ConversionParams['extractV2Options'],
  abortController: AbortController,
  onExtracted?: V3ConversionParams['onExtracted'],
): Promise<'success' | 'aborted' | unknown> {
  if (abortController.signal.aborted) return 'aborted';

  log('Trying External Extract API...');
  const extResult = await callExternalExtract(videoUrl, extractV2Options, abortController.signal);

  if (abortController.signal.aborted) return 'aborted';

  if (extResult.ok && extResult.data) {
    const data = extResult.data;
    log('External extract succeeded:', data.url);

    // Record usage
    const isVideoDownload = extractV2Options?.downloadMode === 'video';
    const selectedResolution = normalizeVideoResolution(extractV2Options?.videoQuality);
    const is4K = isVideoDownload && selectedResolution === '2160p';
    const is2K = isVideoDownload && selectedResolution === '1440p';
    const is320kbps = extractV2Options?.downloadMode === 'audio' && extractV2Options?.audioBitrate === '320';
    const isCutVideo = typeof extractV2Options?.trimStart === 'number' && typeof extractV2Options?.trimEnd === 'number';

    if (is4K) recordUsage(FEATURE_KEYS.HIGH_QUALITY_4K);
    if (is2K) recordUsage(FEATURE_KEYS.HIGH_QUALITY_2K);
    if (is320kbps) recordUsage(FEATURE_KEYS.HIGH_QUALITY_320K);
    if (isCutVideo) recordUsage(FEATURE_KEYS.CUT_VIDEO_YOUTUBE);

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
  maxJobAttempts: number,
  abortController: AbortController,
  onExtracted: V3ConversionParams['onExtracted'] | undefined,
  handleProgressUpdate: (progress: number, detail?: { video: number; audio: number }) => void,
  startFakeProgress: () => void,
  stopFakeProgress: () => void,
): Promise<'success' | 'aborted' | unknown> {
  let lastError: unknown = null;
  let resolvedVideoTitle = videoTitle;

  for (let attempt = 1; attempt <= maxJobAttempts; attempt++) {
    if (abortController.signal.aborted) {
      stopFakeProgress();
      return 'aborted';
    }
    try {
      log('V3 Phase 1: Creating job...');
      const request = mapToV3DownloadRequest(videoUrl, extractV2Options);

      const jobResponse = await retryWithBackoff(
        () => apiV3.createJob(request, abortController.signal),
        RETRY_CONFIGS.extracting
      ) as CreateJobResponse;
      log('Job created:', JSON.stringify(jobResponse, null, 2));

      const extractedInfo = extractMediaInfoFromCreateJob(jobResponse);
      if (extractedInfo.title) {
        resolvedVideoTitle = extractedInfo.title;
      }
      if (onExtracted && hasExtractedMediaInfo(extractedInfo)) {
        try { onExtracted(extractedInfo); } catch (e) { logError('onExtracted callback failed:', e); }
      }

      if (abortController.signal.aborted) return 'aborted';

      updateConversionTask(formatId, {
        state: TaskState.PROCESSING,
        statusText: 'Processing...',
        showProgressBar: true,
        sourceId: extractedInfo.statusUrl || jobResponse.statusUrl,
        extractResponse: extractedInfo,
        audioLanguageChanged: jobResponse.audioLanguageChanged,
        availableAudioLanguages: jobResponse.availableAudioLanguages,
      });

      log('V3 Phase 2: Polling statusUrl:', jobResponse.statusUrl);
      const downloadUrl = await pollOnce({
        statusUrl: jobResponse.statusUrl,
        signal: abortController.signal,
        onProgress: handleProgressUpdate,
      });

      log('V3 Completed! Download URL:', downloadUrl);
      stopFakeProgress();

      // Record usage
      const isVideoDownload = extractV2Options?.downloadMode === 'video';
      const selectedResolution = normalizeVideoResolution(extractV2Options?.videoQuality);
      const is4K = isVideoDownload && selectedResolution === '2160p';
      const is2K = isVideoDownload && selectedResolution === '1440p';
      const is320kbps = extractV2Options?.downloadMode === 'audio' && extractV2Options?.audioBitrate === '320';
      const isCutVideo = typeof extractV2Options?.trimStart === 'number' && typeof extractV2Options?.trimEnd === 'number';

      if (is4K) recordUsage(FEATURE_KEYS.HIGH_QUALITY_4K);
      if (is2K) recordUsage(FEATURE_KEYS.HIGH_QUALITY_2K);
      if (is320kbps) recordUsage(FEATURE_KEYS.HIGH_QUALITY_320K);
      if (isCutVideo) recordUsage(FEATURE_KEYS.CUT_VIDEO_YOUTUBE);

      updateConversionTask(formatId, {
        state: TaskState.SUCCESS,
        statusText: 'Merging...',
        progress: 100,
        downloadUrl,
        filename: generateFilename(resolvedVideoTitle, extractV2Options),
        completedAt: Date.now(),
      });

      return 'success';
    } catch (error) {
      if (abortController.signal.aborted) {
        stopFakeProgress();
        return 'aborted';
      }

      lastError = error;
      logError(`V3 job attempt ${attempt} failed:`, error);

      if (attempt < maxJobAttempts) {
        startFakeProgress();
        continue;
      }
    }
  }

  stopFakeProgress();
  return lastError;
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

  // Check if download URL has expired using local completedAt + configured TTL.
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
    const format = (options.audioFormat || 'mp3').toLowerCase();
    if (format === 'mp3') {
      const bitrate = options.audioBitrate || '128';
      return `${sanitizedTitle}_${bitrate}kbps.${format}`;
    }

    return `${sanitizedTitle}.${format}`;
  }
}
