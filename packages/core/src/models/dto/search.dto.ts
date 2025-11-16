/**
 * Search DTOs
 * Normalized search responses (after mapper + verification)
 */

/**
 * Search V1 Response DTO
 * Returned from searchTitle() service method
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
 * Search V2 Response DTO
 * Returned from searchV2() service method with rich metadata
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
  // YouTube URL (e.g., "https://www.youtube.com/watch?v=dP6e17UlF8U" or "https://www.youtube.com/channel/...")
  id: string;
  title: string;
  type: 'stream' | 'channel';
  thumbnailUrl: string;
  uploaderName: string;
  duration: number | null; // Seconds
  viewCount: number | null;
  uploadDate: string | null; // ISO date string
}

export interface SearchPaginationDto {
  nextPageToken: string | null;
  hasNextPage: boolean;
}

/**
 * Playlist Response DTO
 * Returned from extractPlaylist() service method
 */
export interface PlaylistDto {
  title: string;
  items: PlaylistItemDto[];
}

export interface PlaylistItemDto {
  id: string;
  title: string;
}
