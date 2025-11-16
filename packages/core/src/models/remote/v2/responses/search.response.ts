/**
 * API v2 Search Response Models
 */

/**
 * Search v2 item from API
 */
export interface SearchV2ItemResponse {
  id: string; // Full YouTube URL
  title: string;
  type: 'stream' | 'channel';
  thumbnailUrl: string;
  uploaderName: string;
  duration: number | null; // Seconds
  viewCount: number | null;
  uploadDate: string | null; // ISO date string
}

/**
 * Search v2 response from API
 */
export interface SearchV2Response {
  items: SearchV2ItemResponse[];
  nextPageToken?: string | null;
  hasNextPage?: boolean;
}
