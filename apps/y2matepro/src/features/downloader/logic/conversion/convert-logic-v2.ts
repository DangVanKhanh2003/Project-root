/**
 * convert-logic-v2.ts - Simple Orchestrator using Strategy Pattern
 *
 * Clean replacement for convert-logic.ts (1100+ lines → ~150 lines)
 * Uses simple types and strategies.
 */

import { api } from '../../../../api';
import {
  setConversionTask,
  getConversionTask,
  clearConversionTask,
  updateVideoDetailFormat,
  clearVideoDetailFormat,
  getState
} from '../../state';
import { getConversionModal } from '../../../../ui-components/modal/conversion-modal';
import { triggerDownload } from '../../../../utils';
import { isLinkExpired } from '../../../../utils/link-validator';
import { isYouTubeUrl } from '@downloader/core';

// Types
import {
  FormatData,
  ExtractResult,
  RouteType,
  createExtractResult,
  determineRoute
} from './types';

// Strategy
import { createStrategy, StrategyContext } from './application';

// Retry helper
import { retryWithBackoff, RETRY_CONFIGS } from './retry-helper';

// Params interface
interface ConversionParams {
  formatId: string;
  formatData: FormatData;
  videoTitle: string;
  videoUrl: string;
}

// Singleton
let currentStrategy: ReturnType<typeof createStrategy> | null = null;

// Debug logger
const LOG_PREFIX = '[ConvertLogic]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

/**
 * Main entry point for conversion flow
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
  log('Setting conversion task state...');
  setConversionTask(formatId, {
    sourceId: formatData.vid || formatId,
    quality: formatData.quality,
    format: formatData.type,
    state: 'Extracting',
    statusText: 'Extracting...',
    showProgressBar: false,
    startedAt: Date.now(),
    formatData
  });

  // Open modal in extracting phase
  log('Opening modal in EXTRACTING phase...');
  modal.open({
    videoTitle,
    formatId,
    quality: formatData.quality,
    format: formatData.type,
    onCancel: () => {
      log('Cancel triggered by user');
      abortController.abort();
      currentStrategy?.cancel();
    }
  });

  try {
    // Phase 1: Extract - get download URL from API (with auto retry)
    log('Phase 1: Calling extractFormat API (with retry)...');
    const extractResult = await retryWithBackoff(
      () => extractFormat(formatData, abortController.signal, videoUrl),
      RETRY_CONFIGS.extracting
    );
    log('Extract result:', JSON.stringify(extractResult, null, 2));

    if (abortController.signal.aborted) {
      log('Aborted after extract');
      return;
    }

    // Determine routing based on platform/format/size
    const routing = determineRoute(extractResult, formatData);
    log('Routing decision:', JSON.stringify(routing, null, 2));

    // Transition modal to converting phase
    // Only for cases that need CONVERTING phase (Polling cases)
    // - Static Direct: Skip CONVERTING → SUCCESS
    // - iOS RAM: Double EXTRACTING trick (strategy handles transition)
    // - Other Stream: Skip CONVERTING → SUCCESS
    // - Polling cases: Need CONVERTING phase (direct transition)
    const needsConvertingPhase =
      routing.routeType === RouteType.IOS_POLLING ||
      routing.routeType === RouteType.WINDOWS_MP4_POLLING;

    if (needsConvertingPhase) {
      log('Transitioning modal to CONVERTING phase...');
      await modal.transitionToConvertingWithAnimation(); // Direct transition
    } else {
      log('Skipping CONVERTING phase for routeType:', routing.routeType);
    }

    // Create strategy context
    const context: StrategyContext = {
      formatId,
      formatData,
      extractResult,
      routing,
      abortSignal: abortController.signal,
      videoTitle,
      videoUrl
    };

    // Create and execute strategy
    log('Creating strategy for routeType:', routing.routeType);
    currentStrategy = createStrategy(context);
    log('Strategy created:', currentStrategy.getName());

    log('Executing strategy...');
    const result = await currentStrategy.execute();
    log('Strategy result:', JSON.stringify(result, null, 2));

    // Handle result
    if (result.success && result.downloadUrl) {
      log('Success! Updating format cache...');
      updateFormatCache(formatId, result.downloadUrl, formatData, extractResult);
    } else {
      log('Strategy completed but no success/downloadUrl');
    }

  } catch (error) {
    if (abortController.signal.aborted) {
      log('Caught error but was aborted, ignoring');
      return;
    }

    const errorMessage = (error as Error).message || 'Conversion failed';
    logError('Error in conversion:', errorMessage);
    logError('Full error:', error);
    modal.transitionToError(errorMessage);
  } finally {
    log('=== END CONVERSION ===');
    currentStrategy = null;
  }
}

/**
 * Cancel current conversion
 */
export function cancelConversion(): void {
  currentStrategy?.cancel();
  currentStrategy = null;
}

/**
 * Check if current video is YouTube based on originalUrl
 */
function isYouTubePlatform(): boolean {
  const state = getState();
  const originalUrl = state.videoDetail?.meta?.originalUrl || '';
  return isYouTubeUrl(originalUrl);
}

/**
 * Clear URL cache for social media formats when modal closes
 * YouTube formats keep cache, social media formats clear cache
 */
export function clearSocialMediaCache(formatId: string): void {
  // Only clear cache for non-YouTube formats (social media)
  if (!isYouTubePlatform()) {
    // Clear conversion task cache
    clearConversionTask(formatId);

    // Clear format URL in videoDetail
    clearVideoDetailFormat(formatId);
  }
}

/**
 * Extract format from API
 */
async function extractFormat(
  formatData: FormatData,
  signal: AbortSignal,
  videoUrl: string
): Promise<ExtractResult> {
  log('extractFormat called with formatData:', JSON.stringify(formatData, null, 2));

  // Get extractV2Options from formatData (YouTube V2 API)
  const extractOptions = formatData.extractV2Options;

  // YouTube format - use downloadYouTube API V2
  if (extractOptions) {
    log('Using YouTube V2 API with extractV2Options:', JSON.stringify(extractOptions, null, 2));

    // Build request based on downloadMode
    const downloadRequest = {
      url: videoUrl,
      downloadMode: extractOptions.downloadMode,
      brandName: 'y2matepro',
      videoQuality: extractOptions.videoQuality,
      youtubeVideoContainer: extractOptions.youtubeVideoContainer,
      audioBitrate: extractOptions.audioBitrate,
      audioFormat: extractOptions.audioFormat,
    };

    log('downloadRequest:', JSON.stringify(downloadRequest, null, 2));

    const result = await api.downloadYouTube(downloadRequest as Parameters<typeof api.downloadYouTube>[0], signal);
    log('downloadYouTube result:', JSON.stringify(result, null, 2));

    // Check if API returned error response (ok: false)
    if ('ok' in result && result.ok === false) {
      const errorMsg = (result as any).message || 'API request failed';
      log('API returned error response, throwing error for retry...');
      throw new Error(errorMsg);
    }

    const extractData = (result as { data?: unknown })?.data || result;
    return createExtractResult(extractData as { url: string; filename?: string; size?: number; status: string; progressUrl?: string });
  }

  // Social media format with encrypted URL - use decodeUrl
  if (formatData.encryptedUrl) {
    log('Using decodeUrl API for encrypted URL');
    const result = await api.decodeUrl({ encrypted_url: formatData.encryptedUrl });

    // Check if API returned error response (ok: false)
    if ('ok' in result && result.ok === false) {
      const errorMsg = (result as any).message || 'Decode URL failed';
      log('decodeUrl returned error response, throwing error for retry...');
      throw new Error(errorMsg);
    }

    const extractData = (result as { data?: unknown })?.data || result;
    return createExtractResult(extractData as { url: string; filename?: string; size?: number; status: string; progressUrl?: string });
  }

  // Direct URL format - already have URL
  if (formatData.url) {
    log('Using direct URL:', formatData.url);
    return createExtractResult({
      url: formatData.url,
      status: 'static',
      filename: formatData.filename
    });
  }

  // No valid extraction method found
  throw new Error(`No extractV2Options or URL found for format: ${formatData.id}`);
}

/**
 * Update format cache after successful extraction
 */
function updateFormatCache(
  formatId: string,
  downloadUrl: string,
  formatData: FormatData,
  extractResult: ExtractResult
): void {
  const completedAt = Date.now();

  // Update videoDetail.formats for reuse
  updateVideoDetailFormat(formatId, {
    url: downloadUrl,
    quality: formatData.quality,
    type: formatData.type,
    isFakeData: false,
    completedAt,
    updatedAt: completedAt,
    size: extractResult.size,
    status: extractResult.status,
    filename: extractResult.filename
  });
}

/**
 * Handle download button click (trigger actual download)
 * Returns 'expired' if YouTube link has expired (caller should show expired UI)
 */
export function handleDownloadClick(formatId: string): 'success' | 'expired' | 'error' {
  const task = getConversionTask(formatId);
  const modal = getConversionModal();

  if (!task?.downloadUrl) {
    console.error('No download URL available');
    return 'error';
  }

  // Check expire for YouTube only
  if (isYouTubePlatform()) {
    const completedAt = task.completedAt || 0;
    if (isLinkExpired(completedAt)) {
      // Get video title for expired modal
      const state = getState();
      const videoTitle = state.videoDetail?.meta?.title || 'Video';
      modal.transitionToExpired(videoTitle);
      return 'expired';
    }
  }

  // If RAM blob available (iOS RAM strategy), download from blob
  if (task.ramBlob) {
    downloadFromBlob(task.ramBlob, task.filename || 'download');
    return 'success';
  }

  // Otherwise trigger normal download
  triggerDownload(task.downloadUrl, task.filename);
  return 'success';
}

/**
 * Download from RAM blob (iOS)
 */
function downloadFromBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
