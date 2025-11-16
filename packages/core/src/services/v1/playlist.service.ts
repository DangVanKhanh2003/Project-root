/**
 * Playlist Service (V1)
 * Handles YouTube playlist extraction
 */

import type { IHttpClient } from '../../http/http-client.interface';
import type { ApiConfig } from '../../config/api-config.interface';
import type { PlaylistDto } from '../../models/dto/search.dto';
import type { PlaylistResponse, PlaylistResponseData } from '../../models/remote/v1/responses/playlist.response';
import type { PlaylistRequest } from '../../models/remote/v1/requests/playlist.request';
import { API_ENDPOINTS } from '../constants/endpoints';
import { getTimeout } from '../../config/api-config.interface';
import { mapPlaylistResponse } from '../../mappers/v1/playlist.mapper';

/**
 * Playlist service interface
 */
export interface IPlaylistService {
  extractPlaylist(params: PlaylistRequest): Promise<PlaylistDto>;
}

/**
 * Create playlist service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @returns Playlist service instance
 */
export function createPlaylistService(
  httpClient: IHttpClient,
  config: ApiConfig
): IPlaylistService {
  /**
   * Unwrap nested API response data
   */
  function unwrapResponse<T>(response: unknown): T {
    const data = response as any;
    return (data?.data || data) as T;
  }

  /**
   * Extract all videos from a playlist URL
   *
   * @param params - Playlist request parameters
   * @returns Playlist DTO with video list
   */
  async function extractPlaylist(params: PlaylistRequest): Promise<PlaylistDto> {
    const response = await httpClient.request<PlaylistResponse>({
      method: 'POST',
      url: API_ENDPOINTS.PLAYLIST,
      data: { url: params.url },
      timeout: getTimeout(config, 'playlist'),
    });

    const unwrapped = unwrapResponse<PlaylistResponseData>(response);
    return mapPlaylistResponse(unwrapped);
  }

  return {
    extractPlaylist,
  };
}
