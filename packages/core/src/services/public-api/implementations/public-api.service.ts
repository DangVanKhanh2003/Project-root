/**
 * YouTube Public API Service Implementation
 * Uses YouTube oEmbed API (no authentication required)
 */

import type { YouTubeMetadataDto } from '../../../models/dto/youtube.dto';
import type { OEmbedResponse } from '../../../models/remote/public-api/oembed.response';
import type { IYouTubePublicApiService } from '../interfaces/public-api.interface';
import { BaseService } from '../../base/base-service';
import { mapOEmbedResponse } from '../../../mappers/public-api/oembed.mapper';

const OEMBED_API_URL = 'https://www.youtube.com';
const OEMBED_TIMEOUT = 7000;

/**
 * YouTube Public API Service Implementation
 * Extends BaseService for centralized request handling
 */
class YouTubePublicApiServiceImpl extends BaseService implements IYouTubePublicApiService {
  /**
   * Fetch basic YouTube video metadata from public oEmbed API
   * No authentication required
   * Implements retry logic for network/server errors
   *
   * @param url - YouTube URL (any format)
   * @returns Video metadata DTO
   * @throws Error if URL is invalid or video not found
   */
  async getMetadata(url: string): Promise<YouTubeMetadataDto> {
    let lastError: Error | null = null;
    const maxRetries = 2; // 1 initial + 1 retry

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.makeRequest<OEmbedResponse>({
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

  /**
   * Get search suggestions from Google/YouTube public API
   * Uses JSONP-like endpoint that returns JSON (client=firefox)
   *
   * @param query - Search query
   * @returns List of suggestion strings
   */
  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      // Use Google suggestion API with client=firefox for JSON response
      // This is a direct public API call, bypassing our backend
      const response = await this.makeRequest<any>({
        method: 'GET',
        url: `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`,
        data: {},
        timeout: 3000, // Short timeout for suggestions
      });

      // Response format: ["query", ["suggestion1", "suggestion2", ...]]
      // We want the suggestions array at index 1
      if (Array.isArray(response) && response.length > 1 && Array.isArray(response[1])) {
        return response[1];
      }

      return [];
    } catch (error) {
      // Fail silently for suggestions - not critical
      return [];
    }
  }
}

/**
 * Create YouTube public API service
 * Uses oEmbed API for basic video metadata (no auth required)
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration (optional)
 * @returns YouTube public API service instance
 */
export function createYouTubePublicApiService(
  httpClient: any,
  config?: any
): IYouTubePublicApiService {
  return new YouTubePublicApiServiceImpl(httpClient, config);
}
