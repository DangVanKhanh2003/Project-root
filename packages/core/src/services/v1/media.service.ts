/**
 * Media Service (V1)
 * Handles media extraction for YouTube and direct download platforms
 */

import type { IHttpClient } from '../../http/http-client.interface';
import type { ApiConfig } from '../../config/api-config.interface';
import type { MediaDto } from '../../models/dto/media.dto';
import type {
  ExtractResponse,
  YouTubeExtractData,
  DirectExtractData,
} from '../../models/remote/v1/responses/extract.response';
import type { ExtractRequest, ExtractNonEncodePostRequest } from '../../models/remote/v1/requests/extract.request';
import type { ProtectionPayload } from '../types/protection.types';
import { API_ENDPOINTS } from '../constants/endpoints';
import { getTimeout } from '../../config/api-config.interface';
import { mapYouTubeExtractResponse } from '../../mappers/v1/media/youtube.mapper';
import { mapDirectExtractResponse } from '../../mappers/v1/media/direct.mapper';
import { mapInstagramResponse } from '../../mappers/v1/media/instagram.mapper';

/**
 * JWT save callback type
 */
export type JwtSaveCallback = (jwt: string) => void;

/**
 * Media service interface
 */
export interface IMediaService {
  extractMedia(params: ExtractRequest, protectionPayload?: ProtectionPayload): Promise<MediaDto>;
  extractMediaDirect(params: ExtractNonEncodePostRequest, protectionPayload?: ProtectionPayload): Promise<MediaDto>;
}

/**
 * Create media service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @param onJwtReceived - Callback when JWT is received from API
 * @returns Media service instance
 */
export function createMediaService(
  httpClient: IHttpClient,
  config: ApiConfig,
  onJwtReceived?: JwtSaveCallback
): IMediaService {
  /**
   * Unwrap nested API response data
   */
  function unwrapResponse<T>(response: unknown): T {
    let data = response as any;

    // Handle { success: true, data: {...} }
    if (data && data.success && data.data) {
      data = data.data;
    }

    // Handle double-nested { status: 'ok', data: {...} }
    if (data && data.status === 'ok' && data.data) {
      data = data.data;
    }

    return data as T;
  }

  /**
   * Save JWT if present in response
   */
  function handleJwt(response: any): void {
    if (response?.jwt && onJwtReceived) {
      onJwtReceived(response.jwt);
    }
  }

  /**
   * Extract media information from a URL
   * For YouTube: returns encrypted URLs that need conversion
   * For direct platforms: returns direct download URLs
   *
   * @param params - Extract request parameters
   * @param protectionPayload - Optional JWT/CAPTCHA protection
   * @returns Normalized MediaDto
   */
  async function extractMedia(
    params: ExtractRequest,
    protectionPayload: ProtectionPayload = {}
  ): Promise<MediaDto> {
    const headers: Record<string, string> = {};

    if (protectionPayload.jwt) {
      headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    }

    const response = await httpClient.request<ExtractResponse>({
      method: 'POST',
      url: API_ENDPOINTS.EXTRACT,
      data: {
        url: params.url,
        ...(params.from && { from: params.from }),
      },
      headers,
      timeout: getTimeout(config, 'extract'),
    });

    handleJwt(response);

    const unwrapped = unwrapResponse<YouTubeExtractData | DirectExtractData>(response);

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
  async function extractMediaDirect(
    params: ExtractNonEncodePostRequest,
    protectionPayload: ProtectionPayload = {}
  ): Promise<MediaDto> {
    const headers: Record<string, string> = {};
    const data: Record<string, unknown> = {
      url: params.url,
      ...(params.from && { from: params.from }),
    };

    if (protectionPayload.jwt) {
      headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    } else if (protectionPayload.captcha) {
      data.captcha_token = protectionPayload.captcha.token;
      data.provider = protectionPayload.captcha.type || protectionPayload.captcha.provider || 'recaptcha';
    }

    const response = await httpClient.request<ExtractResponse>({
      method: 'POST',
      url: API_ENDPOINTS.EXTRACT_NON_ENCODE,
      data,
      headers,
      timeout: getTimeout(config, 'extractNonEncode'),
    });

    handleJwt(response);

    const unwrapped = unwrapResponse<DirectExtractData>(response);

    // Check if Instagram carousel
    if (unwrapped.extractor?.toLowerCase() === 'instagram' && unwrapped.gallery) {
      return mapInstagramResponse(unwrapped);
    }

    return mapDirectExtractResponse(unwrapped);
  }

  return {
    extractMedia,
    extractMediaDirect,
  };
}
