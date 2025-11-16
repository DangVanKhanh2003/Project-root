/**
 * Search Service (V1)
 * Handles keyword search and search suggestions
 */

import type { IHttpClient } from '../../http/http-client.interface';
import type { ApiConfig } from '../../config/api-config.interface';
import type { SearchDto } from '../../models/dto/search.dto';
import type { SearchTitleResponse, SearchTitleResponseData } from '../../models/remote/v1/responses/search.response';
import type { SearchTitleRequest, SuggestKeywordRequest } from '../../models/remote/v1/requests/search.request';
import { API_ENDPOINTS } from '../constants/endpoints';
import { getTimeout } from '../../config/api-config.interface';
import { mapSearchResponse } from '../../mappers/v1/search.mapper';

/**
 * Search service interface
 */
export interface ISearchService {
  searchTitle(params: SearchTitleRequest): Promise<SearchDto>;
  getSuggestions(params: SuggestKeywordRequest): Promise<string[]>;
}

/**
 * Create search service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @returns Search service instance
 */
export function createSearchService(
  httpClient: IHttpClient,
  config: ApiConfig
): ISearchService {
  /**
   * Unwrap nested API response data
   */
  function unwrapResponse<T>(response: unknown): T {
    const data = response as any;
    return (data?.data || data) as T;
  }

  /**
   * Search videos by keyword
   *
   * @param params - Search request parameters
   * @returns Search results with video list
   */
  async function searchTitle(params: SearchTitleRequest): Promise<SearchDto> {
    const response = await httpClient.request<SearchTitleResponse>({
      method: 'GET',
      url: API_ENDPOINTS.SEARCH_TITLE,
      data: {
        keyword: params.keyword,
        ...(params.from && { from: params.from }),
      },
      timeout: getTimeout(config, 'searchTitle'),
    });

    const unwrapped = unwrapResponse<SearchTitleResponseData>(response);
    return mapSearchResponse(unwrapped);
  }

  /**
   * Get search suggestions for query
   *
   * @param params - Suggest request parameters
   * @returns Array of suggestion strings
   */
  async function getSuggestions(params: SuggestKeywordRequest): Promise<string[]> {
    const response = await httpClient.request<{ suggestions?: string[] }>({
      method: 'GET',
      url: API_ENDPOINTS.SUGGEST_KEYWORD,
      data: { q: params.q },
      timeout: getTimeout(config, 'suggest'),
    });

    const unwrapped = unwrapResponse<{ suggestions?: string[] }>(response);
    return unwrapped.suggestions || [];
  }

  return {
    searchTitle,
    getSuggestions,
  };
}
