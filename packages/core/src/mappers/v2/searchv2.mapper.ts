/**
 * Search V2 Mapper
 * Maps YouTube Search v2 API responses to SearchV2Dto
 * Pure data transformation only - direct field mapping
 */

import type { SearchV2Response, SearchV2ItemResponse } from '../../models/remote/v2/responses/search.response';
import type { SearchV2Dto, SearchV2ItemDto } from '../../models/dto/search.dto';

/**
 * Map single search v2 item
 * Direct field mapping only - no business logic
 */
function mapSearchV2Item(item: SearchV2ItemResponse): SearchV2ItemDto {
  return {
    // Direct field mapping from API response
    id: item.id, // Full YouTube URL (e.g., "https://www.youtube.com/watch?v=...")
    title: item.title,
    type: item.type,
    thumbnailUrl: item.thumbnailUrl,
    uploaderName: item.uploaderName,
    duration: item.duration,
    viewCount: item.viewCount,
    uploadDate: item.uploadDate,
  };
}

/**
 * Map search v2 response to SearchV2Dto
 *
 * @param data - Search v2 response from API
 * @returns Normalized SearchV2Dto with rich metadata
 */
export function mapSearchV2Response(data: SearchV2Response): SearchV2Dto {
  const items = (data.items || []).map(mapSearchV2Item);

  return {
    // Backward compatibility
    total: items.length,
    videos: items.filter(item => item.type === 'stream'),

    // Enhanced v2 capabilities
    items: items,
    streams: items.filter(item => item.type === 'stream'),
    channels: items.filter(item => item.type === 'channel'),

    // Pagination support
    pagination: {
      nextPageToken: data.nextPageToken || null,
      hasNextPage: data.hasNextPage || false,
    },
  };
}
