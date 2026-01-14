/**
 * Playlist Mapper
 * Maps playlist API responses to PlaylistDto
 */

import type { PlaylistResponseData } from '../../models/remote/v1/responses/playlist.response';
import type { PlaylistDto, PlaylistItemDto } from '../../models/dto/search.dto';

/**
 * Map playlist response to PlaylistDto
 *
 * @param data - Playlist response data
 * @returns Normalized PlaylistDto
 */
export function mapPlaylistResponse(
  data: PlaylistResponseData
): PlaylistDto {
  // Normalize playlist videos (match PlaylistItemDto structure)
  const items: PlaylistItemDto[] = (data.videos || []).map((video) => ({
    id: video.video_id || '',
    title: video.title || '',
  }));

  return {
    title: data.title || 'Playlist',
    items,
  };
}
