/**
 * Search V2 Service Implementation
 * Handles YouTube search with rich metadata and pagination
 */

import type { SearchV2Dto } from '../../../models/dto/search.dto';
import type { SearchV2Response } from '../../../models/remote/v2/responses/search.response';
import type { SearchV2Options } from '../../types/service-options.types';
import type { ISearchV2Service } from '../interfaces/searchv2.interface';
import { BaseService } from '../../base/base-service';
import { SEARCH_V2_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';
import { mapSearchV2Response } from '../../../mappers/v2/searchv2.mapper';

/**
 * Search V2 Service Implementation
 * Extends BaseService for centralized request handling
 */
class SearchV2ServiceImpl extends BaseService implements ISearchV2Service {
  /**
   * Search videos using YouTube Search v2 API with rich metadata
   * Handles both fresh search and pagination
   *
   * @param query - Search keyword
   * @param options - Optional pagination parameters
   * @returns Search results with pagination support
   */
  async searchV2(
    query: string,
    options: SearchV2Options = {}
  ): Promise<SearchV2Dto> {
    const { pageToken, limit } = options;

    const params: Record<string, unknown> = { q: query };

    if (pageToken) {
      params.page = pageToken;
    }

    if (limit && typeof limit === 'number' && limit > 0) {
      params.limit = limit;
    }

    const response = await this.makeRequest<SearchV2Response>({
      method: 'GET',
      url: SEARCH_V2_ENDPOINTS.SEARCH,
      data: params,
      timeout: getTimeout(this.config, 'searchV2'),
    });

    return mapSearchV2Response(response);
  }
}

/**
 * Create search v2 service
 *
 * @param httpClient - HTTP client instance for search v2 API
 * @param config - API configuration
 * @returns Search V2 service instance
 */
export function createSearchV2Service(
  httpClient: any,
  config: any
): ISearchV2Service {
  return new SearchV2ServiceImpl(httpClient, config);
}
