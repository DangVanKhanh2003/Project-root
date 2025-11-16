/**
 * Search Service Interface (V1)
 */

import type { SearchDto } from '../../../models/dto/search.dto';
import type { SearchTitleRequest, SuggestKeywordRequest } from '../../../models/remote/v1/requests/search.request';

/**
 * Search service interface
 */
export interface ISearchService {
  searchTitle(params: SearchTitleRequest): Promise<SearchDto>;
  getSuggestions(params: SuggestKeywordRequest): Promise<string[]>;
}
