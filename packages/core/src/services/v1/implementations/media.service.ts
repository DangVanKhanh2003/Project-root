/**
 * Media Service Implementation (V1)
 * Handles media extraction for YouTube and direct download platforms
 */

import type { MediaDto } from '../../../models/dto/media.dto';
import type {
  ExtractResponse,
  YouTubeExtractData,
  DirectExtractData,
} from '../../../models/remote/v1/responses/extract.response';
import type { ExtractRequest, ExtractNonEncodePostRequest } from '../../../models/remote/v1/requests/extract.request';
import type { ProtectionPayload } from '../../types/protection.types';
import type { IMediaService, JwtSaveCallback } from '../interfaces/media.interface';
import { BaseService } from '../../base/base-service';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';
import { mapYouTubeExtractResponse } from '../../../mappers/v1/media/youtube.mapper';
import { mapDirectExtractResponse } from '../../../mappers/v1/media/direct.mapper';
import { mapInstagramResponse } from '../../../mappers/v1/media/instagram.mapper';

/**
 * Media Service Implementation
 * Extends BaseService for centralized request handling with JWT support
 */
class MediaServiceImpl extends BaseService implements IMediaService {
  /**
   * Extract media information from a URL
   * For YouTube: returns encrypted URLs that need conversion
   * For direct platforms: returns direct download URLs
   *
   * @param params - Extract request parameters
   * @param protectionPayload - Optional JWT/CAPTCHA protection
   * @returns Normalized MediaDto
   */
  async extractMedia(
    params: ExtractRequest,
    protectionPayload?: ProtectionPayload
  ): Promise<MediaDto> {
    const response = await this.makeRequest<ExtractResponse>({
      method: 'POST',
      url: API_ENDPOINTS.EXTRACT,
      data: {
        url: params.url,
        ...(params.from && { from: params.from }),
      },
      timeout: getTimeout(this.config, 'extract'),
    }, protectionPayload);

    const unwrapped = this.unwrapNestedResponse<YouTubeExtractData | DirectExtractData>(response);

    // Detect response type and use appropriate mapper
    if ('convert_links' in unwrapped) {
      return mapYouTubeExtractResponse(unwrapped as YouTubeExtractData);
    }

    // Check if Instagram carousel
    if (unwrapped.extractor?.toLowerCase() === 'instagram' && unwrapped.gallery) {
      return mapInstagramResponse(unwrapped as DirectExtractData);
    }

    return mapDirectExtractResponse(unwrapped as DirectExtractData);
  }

  /**
   * Extract media with direct download URLs
   * No decrypt step needed - single API call returns download links
   * Used for TikTok, Facebook, Instagram, X, etc.
   *
   * @param params - Extract non-encode request parameters
   * @param protectionPayload - JWT or CAPTCHA token (required)
   * @returns Normalized MediaDto with direct URLs
   */
  async extractMediaDirect(
    params: ExtractNonEncodePostRequest,
    protectionPayload?: ProtectionPayload
  ): Promise<any> {
    // Return RAW response - Domain Layer will:
    // 1. Extract JWT
    // 2. Unwrap nested response
    // 3. Pass unwrapped data to this service for mapping
    // So we receive ALREADY UNWRAPPED data from domain layer
    const response = await this.makeRequest<ExtractResponse>({
      method: 'POST',
      url: API_ENDPOINTS.EXTRACT_NON_ENCODE,
      data: {
        url: params.url,
        ...(params.from && { from: params.from }),
      },
      timeout: getTimeout(this.config, 'extractNonEncode'),
    }, protectionPayload);


    // Domain layer will unwrap this, so just return raw response
    // The unwrapped data will be in format: DirectExtractData
    return response;
  }
}

/**
 * Create media service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @returns Media service instance
 */
export function createMediaService(
  httpClient: any,
  config: any
): IMediaService {
  return new MediaServiceImpl(httpClient, config);
}
