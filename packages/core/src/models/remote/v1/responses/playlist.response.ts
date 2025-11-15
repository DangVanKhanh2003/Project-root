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
