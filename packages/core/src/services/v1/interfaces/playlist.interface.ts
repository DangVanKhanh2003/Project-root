/**
 * Playlist Service Interface (V1)
 */

import type { PlaylistDto } from '../../../models/dto/search.dto';
import type { PlaylistRequest } from '../../../models/remote/v1/requests/playlist.request';

/**
 * Playlist service interface
 */
export interface IPlaylistService {
  extractPlaylist(params: PlaylistRequest): Promise<PlaylistDto>;
}
