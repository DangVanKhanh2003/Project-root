/**
 * Playlist Service Implementation (V1)
 * Handles YouTube playlist extraction
 */

import type { PlaylistDto } from '../../../models/dto/search.dto';
import type { PlaylistResponse, PlaylistResponseData } from '../../../models/remote/v1/responses/playlist.response';
import type { PlaylistRequest } from '../../../models/remote/v1/requests/playlist.request';
import type { IPlaylistService } from '../interfaces/playlist.interface';
import { BaseService } from '../../base/base-service';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';
import { mapPlaylistResponse } from '../../../mappers/v1/playlist.mapper';

/**
 * Playlist Service Implementation
 * Extends BaseService for centralized request handling
 */
class PlaylistServiceImpl extends BaseService implements IPlaylistService {
  /**
   * Extract all videos from a playlist URL
   *
   * @param params - Playlist request parameters
   * @returns Playlist DTO with video list
   */
  async extractPlaylist(params: PlaylistRequest): Promise<PlaylistDto> {
    const response = await this.makeRequest<PlaylistResponse>({
      method: 'POST',
      url: API_ENDPOINTS.PLAYLIST,
      data: { url: params.url },
      timeout: getTimeout(this.config, 'playlist'),
    });

    const unwrapped = this.unwrapSimpleResponse<PlaylistResponseData>(response);
    return mapPlaylistResponse(unwrapped);
  }
}

/**
 * Create playlist service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @returns Playlist service instance
 */
export function createPlaylistService(
  httpClient: any,
  config: any
): IPlaylistService {
  return new PlaylistServiceImpl(httpClient, config);
}
