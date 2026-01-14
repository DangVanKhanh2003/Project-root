/**
 * Search V2 Service Interface
 */

import type { SearchV2Dto } from '../../../models/dto/search.dto';
import type { SearchV2Options } from '../../types/service-options.types';

/**
 * Search V2 service interface
 */
export interface ISearchV2Service {
  searchV2(query: string, options?: SearchV2Options): Promise<SearchV2Dto>;
}
