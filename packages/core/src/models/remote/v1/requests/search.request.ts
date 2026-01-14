/**
 * API v1 Search Request Models
 */

/**
 * Search videos by title
 * GET /api/v1/search-title
 */
export interface SearchTitleRequest {
  keyword: string;
  from?: string; // Optional source identifier
}

/**
 * Get search suggestions
 * GET /api/v1/suggest-keyword
 */
export interface SuggestKeywordRequest {
  q: string;
}
