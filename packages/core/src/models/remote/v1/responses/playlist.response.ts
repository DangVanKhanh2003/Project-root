/**
 * API v1 Playlist Response Models
 */

/**
 * Playlist response data (inside wrapper)
 */
export interface PlaylistResponseData {
  playlist_id: string;
  title: string;
  videos: PlaylistVideo[];
}

export interface PlaylistVideo {
  video_id: string;
  title: string;
}

/**
 * Playlist response wrapper (from API)
 */
export interface PlaylistResponse {
  success?: boolean;
  status?: string;
  data?: PlaylistResponseData;
  // Allow direct unwrapped format
  playlist_id?: string;
  title?: string;
  videos?: PlaylistVideo[];
}
