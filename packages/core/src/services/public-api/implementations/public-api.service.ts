/**
 * YouTube Public API Service Implementation
 * Uses YouTube oEmbed API (no authentication required)
 */

import type { IHttpClient } from '../../../http/http-client.interface';
import type { ApiConfig } from '../../../config/api-config.interface';
import type { YouTubeMetadataDto } from '../../../models/dto/youtube.dto';
import type { OEmbedResponse } from '../../../models/remote/public-api/oembed.response';
import type { IYouTubePublicApiService } from '../interfaces/public-api.interface';
import { mapOEmbedResponse } from '../../../mappers/public-api/oembed.mapper';

const OEMBED_API_URL = 'https://www.youtube.com';
const OEMBED_TIMEOUT = 7000;

/**
 * Create YouTube public API service
 * Uses oEmbed API for basic video metadata (no auth required)
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration (optional)
 * @returns YouTube public API service instance
 */
export function createYouTubePublicApiService(
  httpClient: IHttpClient,
  config?: ApiConfig
): IYouTubePublicApiService {
  /**
   * Fetch basic YouTube video metadata from public oEmbed API
   * No authentication required
   *
   * @param url - YouTube URL (any format)
   * @returns Video metadata DTO
   * @throws Error if URL is invalid or video not found
   */
  async function getMetadata(url: string): Promise<YouTubeMetadataDto> {
    let lastError: Error | null = null;
    const maxRetries = 2; // 1 initial + 1 retry

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await httpClient.request<OEmbedResponse>({
          method: 'GET',
          url: `${OEMBED_API_URL}/oembed`,
          data: {
            url: url,
            format: 'json',
          },
          timeout: OEMBED_TIMEOUT,
        });

        return mapOEmbedResponse(response);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx - invalid video, not found, private)
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          throw error;
        }

        // Retry on network errors and 5xx server errors
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
      }
    }

    // All retries exhausted
    throw lastError;
  }

  return {
    getMetadata,
  };
}
