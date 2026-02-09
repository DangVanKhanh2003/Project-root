/**
 * V3 Playlist Service Implementation
 * YouTube Download API (V3)
 */

import type { PlaylistDto } from '../../../models/dto/search.dto';
import type { V3ErrorResponse } from '../../../models/remote/v3/responses';
import type { IV3PlaylistService } from '../interfaces/playlist.interface';
import { BaseService } from '../../base/base-service';
import { V3_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';
import { mapV3PlaylistResponse } from '../../../mappers/v3/playlist.mapper';

/**
 * V3 Playlist Service Implementation
 */
class V3PlaylistServiceImpl extends BaseService implements IV3PlaylistService {
    /**
     * Extract playlist videos
     * POST /api/playlist
     */
    async extractPlaylist(url: string, signal?: AbortSignal): Promise<PlaylistDto> {
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid URL: URL must be a non-empty string');
        }

        const response = await this.makeRequest<any | V3ErrorResponse>({
            method: 'POST',
            url: V3_ENDPOINTS.PLAYLIST,
            data: { url },
            timeout: getTimeout(this.config, 'playlist'), // Reuse V1 playlist timeout or add new config
            signal,
        });

        if (this.isErrorResponse(response)) {
            throw new Error(response.error.message || response.error.code);
        }

        // Adapt response to PlaylistDto
        return mapV3PlaylistResponse(response);
    }

    /**
     * Type guard for error response
     */
    private isErrorResponse(response: unknown): response is V3ErrorResponse {
        return (
            typeof response === 'object' &&
            response !== null &&
            'error' in response &&
            typeof (response as V3ErrorResponse).error === 'object'
        );
    }
}

/**
 * Create V3 Playlist Service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @returns V3 Playlist Service instance
 */
export function createV3PlaylistService(
    httpClient: any,
    config: any
): IV3PlaylistService {
    return new V3PlaylistServiceImpl(httpClient, config);
}
