/**
 * Search Service Implementation (V1)
 * Handles keyword search and search suggestions
 */

import type { SearchDto } from '../../../models/dto/search.dto';
import type { SearchTitleResponse, SearchTitleResponseData } from '../../../models/remote/v1/responses/search.response';
import type { SearchTitleRequest, SuggestKeywordRequest } from '../../../models/remote/v1/requests/search.request';
import type { ISearchService } from '../interfaces/search.interface';
import { BaseService } from '../../base/base-service';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';
import { mapSearchResponse } from '../../../mappers/v1/search.mapper';

/**
 * Search Service Implementation
 * Extends BaseService for centralized request handling
 */
class SearchServiceImpl extends BaseService implements ISearchService {
  /**
   * Search videos by keyword
   *
   * @param params - Search request parameters
   * @returns Search results with video list
   */
  async searchTitle(params: SearchTitleRequest): Promise<SearchDto> {
    const response = await this.makeRequest<SearchTitleResponse>({
      method: 'GET',
      url: API_ENDPOINTS.SEARCH_TITLE,
      data: {
        keyword: params.keyword,
        ...(params.from && { from: params.from }),
      },
      timeout: getTimeout(this.config, 'searchTitle'),
    });

    const unwrapped = this.unwrapSimpleResponse<SearchTitleResponseData>(response);
    return mapSearchResponse(unwrapped);
  }

  /**
   * Get search suggestions for query
   *
   * @param params - Suggest request parameters
   * @returns Array of suggestion strings
   */
  async getSuggestions(params: SuggestKeywordRequest): Promise<string[]> {
    const response = await this.makeRequest<{ suggestions?: string[] }>({
      method: 'GET',
      url: API_ENDPOINTS.SUGGEST_KEYWORD,
      data: { q: params.q },
      timeout: getTimeout(this.config, 'suggest'),
    });

    const unwrapped = this.unwrapSimpleResponse<{ suggestions?: string[] }>(response);
    return unwrapped.suggestions || [];
  }
}

/**
 * Create search service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @returns Search service instance
 */
export function createSearchService(
  httpClient: any,
  config: any
): ISearchService {
  return new SearchServiceImpl(httpClient, config);
}
