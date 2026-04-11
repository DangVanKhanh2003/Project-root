/**
 * Playlist Mapper V3
 * Maps V3 playlist API responses to PlaylistDto
 */

import type { PlaylistDto, PlaylistItemDto } from '../../models/dto/search.dto';

interface V3PlaylistItem {
  id: string;
  title: string;
  channel?: string;
  thumbnail?: string;
  duration?: number;
}

interface V3PlaylistResponse {
  nextPageToken?: string;
  items: V3PlaylistItem[];
  playlist?: {
    title?: string;
    thumbnail?: string;
  };
}

/**
 * Map V3 playlist response to PlaylistDto
 *
 * @param data - V3 Playlist response data
 * @returns Normalized PlaylistDto
 */
export function mapV3PlaylistResponse(
  data: any
): PlaylistDto {
  // Normalize playlist videos
  const items: PlaylistItemDto[] = (data.items || []).map((video: any) => ({
    id: video.id || '',
    title: video.title || '',
    thumbnail: video.thumbnail,
    author: video.channel,
    duration: video.duration || 0,
  }));

  // Attempt to find playlist metadata if available (might need adjustment based on full API response)
  const title = data.playlist?.title || 'Unknown Playlist';
  const thumbnail = data.playlist?.thumbnail || items[0]?.thumbnail;

  return {
    title,
    thumbnail,
    items,
  };
}
