/**
 * V3 Playlist Service Interface
 */

import type { PlaylistDto } from '../../../models/dto/search.dto';

/**
 * V3 Playlist Service Interface
 */
export interface IV3PlaylistService {
    /**
     * Extract playlist videos
     * @param url - Playlist URL
     * @param signal - Abort signal
     */
    extractPlaylist(url: string, signal?: AbortSignal): Promise<PlaylistDto>;
}
