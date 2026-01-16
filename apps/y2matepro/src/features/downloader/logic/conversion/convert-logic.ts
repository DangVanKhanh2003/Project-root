/**
 * convert-logic.ts - Simple V3 Conversion Flow
 *
 * Unified flow for all devices:
 * 1. Create job (POST /api/download)
 * 2. Poll status (GET statusUrl)
 * 3. Get download URL when completed
 *
 * No device-specific routing or strategies - same flow for iOS, Windows, Mac, Android.
 */

import { api } from '../../../../api';
import { apiV3 } from '../../../../api/v3';
import {
  setConversionTask,
  getConversionTask,
  updateConversionTask,
  clearConversionTask,
  updateVideoDetailFormat,
  clearVideoDetailFormat,
  getState
} from '../../state';
import { getConversionModal } from '../../../../ui-components/modal/conversion-modal';
import { triggerDownload } from '../../../../utils';
import { isLinkExpired } from '../../../../utils/link-validator';
import { isYouTubeUrl, mapToV3DownloadRequest, type CreateJobResponse } from '@downloader/core';

// V3 helpers
import { startPolling } from './v3/polling';
import { getErrorMessage } from './v3/error-messages';

// Retry helper
import { retryWithBackoff, RETRY_CONFIGS } from './retry-helper';

// Types
import { FormatData } from './types';

// Params interface
interface ConversionParams {
  formatId: string;
  formatData: FormatData;
  videoTitle: string;
  videoUrl: string;
}

// Debug logger
const LOG_PREFIX = '[ConvertLogic]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

/**
 * Main entry point for conversion flow
 * Same flow for ALL devices (iOS, Windows, Mac, Android)
 */
export async function startConversion(params: ConversionParams): Promise<void> {
  const { formatId, formatData, videoTitle, videoUrl } = params;
  const modal = getConversionModal();

  log('=== START CONVERSION ===');
  log('formatId:', formatId);
  log('formatData:', JSON.stringify(formatData, null, 2));
  log('videoTitle:', videoTitle);
  log('videoUrl:', videoUrl);

  // Setup abort controller
  const abortController = new AbortController();

  // Initialize task state
  setConversionTask(formatId, {
    sourceId: formatData.vid || formatId,
    quality: formatData.quality,
    format: formatData.type,
    state: 'Extracting',
    statusText: 'Creating job...',
    showProgressBar: false,
    startedAt: Date.now(),
    formatData,
    abortController,
  });

  // Open modal in EXTRACTING phase
  log('Opening modal in EXTRACTING phase...');
  modal.open({
    videoTitle,
    formatId,
    quality: formatData.quality,
    format: formatData.type,
    onCancel: () => {
      log('Cancel triggered by user');
      abortController.abort();
      updateConversionTask(formatId, {
        state: 'Canceled',
        statusText: 'Canceled',
      });
    }
  });

  try {
    // Get extractV2Options (YouTube) or handle social media
    const extractOptions = formatData.extractV2Options;

    // ============ YouTube Format - V3 API ============
    if (extractOptions) {
      log('YouTube format detected - using V3 API');

      // Phase 1: Create job
      log('Phase 1: Creating job...');
      const v3Request = mapToV3DownloadRequest(videoUrl, {
        downloadMode: (extractOptions.downloadMode as 'video' | 'audio') || 'audio',
        videoQuality: extractOptions.videoQuality,
        youtubeVideoContainer: extractOptions.youtubeVideoContainer,
        audioBitrate: extractOptions.audioBitrate,
        audioFormat: extractOptions.audioFormat,
      });

      log('V3 Request:', JSON.stringify(v3Request, null, 2));

      const jobResponse = await retryWithBackoff(
        () => apiV3.createJob(v3Request, abortController.signal),
        RETRY_CONFIGS.extracting
      ) as CreateJobResponse;

      log('Job created:', JSON.stringify(jobResponse, null, 2));

      if (abortController.signal.aborted) {
        log('Aborted after job creation');
        return;
      }

      // Transition modal to CONVERTING phase
      log('Transitioning to CONVERTING phase...');
      await modal.transitionToConvertingWithAnimation();

      updateConversionTask(formatId, {
        state: 'Processing',
        statusText: 'Processing...',
        showProgressBar: true,
        sourceId: jobResponse.statusUrl,
      });

      // Phase 2: Poll for status
      log('Phase 2: Starting polling with statusUrl:', jobResponse.statusUrl);

      await startPolling({
        statusUrl: jobResponse.statusUrl,

        onProgress: (progress, detail) => {
          log('Progress:', progress, detail);
          modal.updateConversionProgress(progress, 'Processing...');
          updateConversionTask(formatId, {
            progress,
            statusText: progress < 100 ? 'Processing...' : 'Finalizing...',
          });
        },

        onComplete: (downloadUrl) => {
          log('Completed! Download URL:', downloadUrl);

          // Update task state
          updateConversionTask(formatId, {
            state: 'Success',
            statusText: 'Ready to download',
            progress: 100,
            downloadUrl,
            filename: generateFilename(videoTitle, extractOptions),
            completedAt: Date.now(),
          });

          // Update format cache for reuse
          updateFormatCache(formatId, downloadUrl, formatData);

          // Show success in modal
          modal.showDownloadButton(downloadUrl);
        },

        onError: (error) => {
          logError('Polling error:', error);
          const errorMessage = getErrorMessage(error);

          updateConversionTask(formatId, {
            state: 'Failed',
            statusText: `Error: ${errorMessage}`,
            error: errorMessage,
            completedAt: Date.now(),
          });

          modal.transitionToError(errorMessage);
        },

        signal: abortController.signal,
      });

      return;
    }

    // ============ Social Media - Direct URL ============
    if (formatData.encryptedUrl) {
      log('Social media format with encrypted URL');

      const result = await retryWithBackoff(
        () => api.decodeUrl({ encrypted_url: formatData.encryptedUrl! }),
        RETRY_CONFIGS.extracting
      );

      // Check if API returned error
      if ('ok' in result && result.ok === false) {
        throw new Error((result as any).message || 'Decode URL failed');
      }

      const extractData = (result as { data?: unknown })?.data || result;
      const downloadUrl = (extractData as { url?: string })?.url;

      if (!downloadUrl) {
        throw new Error('No download URL returned');
      }

      // Direct download for social media
      log('Social media URL decoded:', downloadUrl);

      updateConversionTask(formatId, {
        state: 'Success',
        downloadUrl,
        completedAt: Date.now(),
      });

      updateFormatCache(formatId, downloadUrl, formatData);
      modal.showDownloadButton(downloadUrl);
      return;
    }

    // ============ Direct URL Format ============
    if (formatData.url) {
      log('Direct URL format:', formatData.url);

      updateConversionTask(formatId, {
        state: 'Success',
        downloadUrl: formatData.url,
        completedAt: Date.now(),
      });

      updateFormatCache(formatId, formatData.url, formatData);
      modal.showDownloadButton(formatData.url);
      return;
    }

    // No valid format found
    throw new Error(`No valid format options found for: ${formatData.id}`);

  } catch (error) {
    if (abortController.signal.aborted) {
      log('Caught error but was aborted, ignoring');
      return;
    }

    const errorMessage = getErrorMessage(error);
    logError('Error in conversion:', errorMessage);

    updateConversionTask(formatId, {
      state: 'Failed',
      statusText: `Error: ${errorMessage}`,
      error: errorMessage,
      completedAt: Date.now(),
    });

    modal.transitionToError(errorMessage);
  } finally {
    log('=== END CONVERSION ===');
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
      state: 'Canceled',
      statusText: 'Canceled',
      completedAt: Date.now(),
    });
  }
}

/**
 * Check if current video is YouTube
 */
function isYouTubePlatform(): boolean {
  const state = getState();
  const originalUrl = state.videoDetail?.meta?.originalUrl || '';
  return isYouTubeUrl(originalUrl);
}

/**
 * Clear URL cache for social media formats
 */
export function clearSocialMediaCache(formatId: string): void {
  if (!isYouTubePlatform()) {
    clearConversionTask(formatId);
    clearVideoDetailFormat(formatId);
  }
}

/**
 * Update format cache after successful conversion
 */
function updateFormatCache(
  formatId: string,
  downloadUrl: string,
  formatData: FormatData
): void {
  const completedAt = Date.now();

  updateVideoDetailFormat(formatId, {
    url: downloadUrl,
    quality: formatData.quality,
    type: formatData.type,
    isFakeData: false,
    completedAt,
    updatedAt: completedAt,
  });
}

/**
 * Generate filename from title and options
 */
function generateFilename(
  title: string,
  options: NonNullable<FormatData['extractV2Options']>
): string {
  const sanitizedTitle = title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);

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

/**
 * Handle download button click
 * Returns 'success', 'expired', or 'error' for UI handling
 */
export function handleDownloadClick(formatId: string): 'success' | 'expired' | 'error' {
  const task = getConversionTask(formatId);
  const modal = getConversionModal();

  if (!task?.downloadUrl) {
    logError('No download URL available');
    return 'error';
  }

  // Check expiry for YouTube only
  if (isYouTubePlatform()) {
    const completedAt = task.completedAt || 0;
    if (isLinkExpired(completedAt)) {
      const state = getState();
      const videoTitle = state.videoDetail?.meta?.title || 'Video';
      modal.transitionToExpired(videoTitle);
      return 'expired';
    }
  }

  // Trigger download
  triggerDownload(task.downloadUrl, task.filename);
  return 'success';
}
