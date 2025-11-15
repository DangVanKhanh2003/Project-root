/**
 * Search DTOs
 * Normalized search results after mapper + verification
 */

/**
 * Search v1 DTO (after normalizeSearchResults)
 */
export interface SearchDto {
  total: number;
  videos: SearchVideoDto[];
}

export interface SearchVideoDto {
  id: string;
  title: string;
}

/**
 * Search v2 DTO (after normalizeSearchV2Results)
 */
export interface SearchV2Dto {
  total: number;
  videos: SearchV2ItemDto[]; // Backward compatibility
  items: SearchV2ItemDto[]; // All items
  streams: SearchV2ItemDto[]; // Only streams
  channels: SearchV2ItemDto[]; // Only channels
  pagination: SearchPaginationDto;
}

export interface SearchV2ItemDto {
  // Backward compatibility fields
  id: string | null;
  title: string;

  // Enhanced v2 fields
  type: 'stream' | 'channel';
  fullUrl: string;
  thumbnailUrl: string;

  // Rich metadata
  metadata: {
    uploaderName: string;
    duration: number | null;
    viewCount: number | null;
    uploadDate: string | null;
  };

  // UI-ready formatted data
  displayDuration: string | null;
  displayViews: string | null;
  displayDate: string | null;
}

export interface SearchPaginationDto {
  nextPageToken: string | null;
  hasNextPage: boolean;
}

/**
 * Playlist DTO (after normalizePlaylist)
 */
export interface PlaylistDto {
  title: string;
  items: PlaylistItemDto[];
}

export interface PlaylistItemDto {
  id: string;
  title: string;
}
