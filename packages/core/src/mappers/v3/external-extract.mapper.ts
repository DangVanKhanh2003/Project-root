/**
 * External Extract Mapper
 * Maps between app-layer options and External Extract API format.
 */

import type { ExternalExtractRequest } from '../../models/remote/v3/requests';
import type { ExternalExtractResponse } from '../../models/remote/v3/responses';
import type { ExtractV2Options } from './download.mapper';

/**
 * Convert app-layer ExtractV2Options → ExternalExtractRequest
 */
export function mapToExternalExtractRequest(
  url: string,
  options: ExtractV2Options
): ExternalExtractRequest {
  const type = options.downloadMode === 'video' ? 'video' : 'audio';

  if (type === 'video') {
    const format = options.youtubeVideoContainer || 'mp4';
    const quality = options.videoQuality ? `${options.videoQuality}p` : undefined;
    return { url, output: { type, format, ...(quality && { quality }) } };
  }

  const format = options.audioFormat || 'mp3';
  const quality = options.audioBitrate ? `${options.audioBitrate}kbps` : undefined;
  return { url, output: { type, format, ...(quality && { quality }) } };
}

/**
 * Normalized result from External Extract API
 */
export interface NormalizedExternalExtractResult {
  /** Direct download URL */
  url: string;
  /** Suggested filename */
  filename: string;
  /** Always 'static' — no polling needed */
  status: 'static';
  /** Original YouTube URL */
  youtubeUrl: string;
  /** Timestamp when completed */
  completedAt: number;
  /** Duration in seconds */
  duration: number;
  /** Original quality options */
  qualityOptions: ExtractV2Options;
  /** Video/audio title */
  title: string | null;
  /** Whether quality was changed from requested */
  qualityChanged: boolean;
  /** Actual quality used */
  selectedQuality: string | null;
  /** Originally requested quality */
  requestedQuality: string | null;
}

/**
 * Normalize External Extract API response → app-friendly format.
 * Returns null if response is invalid (not completed or no downloadUrl).
 */
export function mapExternalExtractResponse(
  response: ExternalExtractResponse,
  youtubeUrl: string,
  qualityOptions: ExtractV2Options
): NormalizedExternalExtractResult | null {
  if (!response || response.status !== 'completed' || !response.downloadUrl) {
    return null;
  }

  return {
    url: response.downloadUrl,
    filename: response.filename || 'download',
    status: 'static',
    youtubeUrl,
    completedAt: Date.now(),
    duration: response.duration || 0,
    qualityOptions,
    title: response.title || null,
    qualityChanged: response.qualityChanged || false,
    selectedQuality: response.selectedQuality || null,
    requestedQuality: response.requestedQuality || null,
  };
}
