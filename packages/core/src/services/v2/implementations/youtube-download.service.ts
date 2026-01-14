/**
 * YouTube Download Service Implementation (V2)
 * Handles YouTube video/audio downloads with progress tracking
 */

import type { StreamDto } from '../../../models/dto/stream.dto';
import type {
  StreamResponse,
  StaticResponse,
  ProgressResponse,
} from '../../../models/remote/v2/responses/download.response';
import type { DownloadRequest, ProgressRequest } from '../../../models/remote/v2/requests/download.request';
import type { IYouTubeDownloadService } from '../interfaces/youtube-download.interface';
import { BaseService } from '../../base/base-service';
import { YOUTUBE_DOWNLOAD_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';
import { mapStreamResponse, mapProgressResponse } from '../../../mappers/v2/stream.mapper';

/**
 * Extract cache ID from progress URL
 * @example extractCacheId("http://localhost:9000/api/download/progress/request_youtube_abc123") → "request_youtube_abc123"
 */
function extractCacheId(progressUrl: string): string {
  try {
    const url = new URL(progressUrl);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    // URL format: /api/download/progress/{cacheId}
    if (pathSegments.length >= 3 && pathSegments[0] === 'api' && pathSegments[1] === 'download' && pathSegments[2] === 'progress') {
      return pathSegments[3] || '';
    }
    // Fallback: try to get last segment
    return pathSegments[pathSegments.length - 1] || '';
  } catch (error) {
    throw new Error(`Invalid progress URL format: ${progressUrl}`);
  }
}

/**
 * YouTube Download Service Implementation
 * Extends BaseService for centralized request handling
 */
class YouTubeDownloadServiceImpl extends BaseService implements IYouTubeDownloadService {
  /**
   * Download YouTube video or audio
   *
   * @param params - Download request parameters
   * @param signal - Optional abort signal for cancellation
   * @returns Stream DTO with download URL and progress URL
   * @throws ValidationError if params are invalid
   */
  async downloadYouTube(
    params: DownloadRequest,
    signal?: AbortSignal
  ): Promise<StreamDto> {
    // Validate required fields
    if (!params.url || typeof params.url !== 'string') {
      throw new Error('Invalid URL: URL must be a non-empty string');
    }

    if (!params.downloadMode) {
      throw new Error('Invalid params: downloadMode is required');
    }

    if (!['video', 'audio'].includes(params.downloadMode)) {
      throw new Error('Invalid downloadMode: must be "video" or "audio"');
    }

    // Build request body based on API spec - include all fields from DownloadRequest
    const requestBody: Record<string, unknown> = {
      url: params.url,
      downloadMode: params.downloadMode,
    };

    // Add optional common fields
    if (params.filenameStyle) requestBody.filenameStyle = params.filenameStyle;
    if (params.disableMetadata !== undefined) requestBody.disableMetadata = params.disableMetadata;
    if (params.brandName) requestBody.brandName = params.brandName;
    if (params.autoMerge !== undefined) requestBody.autoMerge = params.autoMerge;

    // Add video-specific options
    if (params.downloadMode === 'video') {
      if (params.videoQuality) requestBody.videoQuality = params.videoQuality;
      if (params.youtubeVideoCodec) requestBody.youtubeVideoCodec = params.youtubeVideoCodec;
      if (params.youtubeVideoContainer) requestBody.youtubeVideoContainer = params.youtubeVideoContainer;
      if (params.youtubeDubLang) requestBody.youtubeDubLang = params.youtubeDubLang;
      if (params.subtitleLang) requestBody.subtitleLang = params.subtitleLang;
      if (params.youtubeHLS !== undefined) requestBody.youtubeHLS = params.youtubeHLS;
      if (params.youtubeBetterAudio !== undefined) requestBody.youtubeBetterAudio = params.youtubeBetterAudio;
    }

    // Add audio-specific options
    if (params.downloadMode === 'audio') {
      if (params.audioBitrate) requestBody.audioBitrate = params.audioBitrate;
      if (params.audioFormat) requestBody.audioFormat = params.audioFormat;
      if (params.youtubeBetterAudio !== undefined) requestBody.youtubeBetterAudio = params.youtubeBetterAudio;
    }

    // Make request to YouTube Download API (POST /)
    const response = await this.makeRequest<StreamResponse | StaticResponse>({
      method: 'POST',
      url: YOUTUBE_DOWNLOAD_ENDPOINTS.DOWNLOAD,
      data: requestBody,
      timeout: getTimeout(this.config, 'extractV2Stream'),
      signal, // Pass through external abort signal
    });

    return mapStreamResponse(response, {
      downloadMode: params.downloadMode,
      videoQuality: params.downloadMode === 'video' ? params.videoQuality : undefined,
      audioFormat: params.downloadMode === 'audio' ? params.audioFormat : undefined,
      url: params.url,
    });
  }

  /**
   * Get download progress for a cache ID
   * Poll this endpoint to track download progress in real-time
   *
   * @param params - Progress request parameters
   * @returns Progress response with download status
   * @throws Error if cacheId is invalid
   */
  async getDownloadProgress(params: ProgressRequest): Promise<ProgressResponse> {
    if (!params.cacheId || typeof params.cacheId !== 'string') {
      throw new Error('Invalid cacheId: must be a non-empty string');
    }

    // GET /api/download/progress/{cacheId}
    const response = await this.makeRequest<ProgressResponse>({
      method: 'GET',
      url: `${YOUTUBE_DOWNLOAD_ENDPOINTS.PROGRESS}/${params.cacheId}`,
      timeout: getTimeout(this.config, 'pollProgress'),
    });

    return mapProgressResponse(response);
  }
}

/**
 * Create YouTube download service
 *
 * @param httpClient - HTTP client instance for v2 API
 * @param config - API configuration
 * @returns YouTube download service instance
 */
export function createYouTubeDownloadService(
  httpClient: any,
  config: any
): IYouTubeDownloadService {
  return new YouTubeDownloadServiceImpl(httpClient, config);
}

/**
 * Helper: Extract cache ID from full progress URL
 * Useful when you have the full progressUrl from download response
 *
 * @param progressUrl - Full progress URL
 * @returns Cache ID to use with getDownloadProgress()
 */
export { extractCacheId };
