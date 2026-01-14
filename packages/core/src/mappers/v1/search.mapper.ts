/**
 * Search Mapper
 * Maps search API responses to SearchDto
 */

import type { SearchTitleResponseData } from '../../models/remote/v1/responses/search.response';
import type { SearchDto, SearchVideoDto } from '../../models/dto/search.dto';

/**
 * Map search title response to SearchDto
 *
 * @param data - Search title response data
 * @returns Normalized SearchDto
 */
export function mapSearchResponse(
  data: SearchTitleResponseData
): SearchDto {
  // Normalize video items
  const videos: SearchVideoDto[] = (data.videos || []).map((video) => ({
    id: video.v || '',
    title: video.t || '',
  }));

  return {
    total: data.total || 0,
    videos,
  };
}

/**
 * Map suggestions response
 * Suggestions API returns array of strings directly
 *
 * @param suggestions - Array of suggestion strings
 * @returns Normalized array of suggestions
 */
export function mapSuggestionsResponse(
  suggestions: string[] | unknown
): string[] {
  if (Array.isArray(suggestions)) {
    return suggestions.filter((s) => typeof s === 'string');
  }
  return [];
}
