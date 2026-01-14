/**
 * API v1 Search Response Models
 */

/**
 * Search title response data (inside wrapper)
 */
export interface SearchTitleResponseData {
  videos: SearchTitleVideo[];
  total: number;
}

export interface SearchTitleVideo {
  v: string; // Video ID
  t: string; // Video title
}

/**
 * Suggest keyword response data
 * Note: This endpoint returns array directly, not wrapped in success/data structure
 */
export type SuggestKeywordResponseData = string[];

/**
 * Search title response wrapper (from API)
 */
export interface SearchTitleResponse {
  success?: boolean;
  status?: string;
  data?: SearchTitleResponseData;
  // Allow direct unwrapped format
  videos?: SearchTitleVideo[];
  total?: number;
}
