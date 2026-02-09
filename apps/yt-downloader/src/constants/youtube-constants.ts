/**
 * YouTube API Constants
 * Constants for YouTube URL handling and API interactions
 */

export const YOUTUBE_API_CONSTANTS = {
  // URL patterns
  YOUTUBE_DOMAINS: ['youtube.com', 'youtu.be', 'm.youtube.com', 'youtubekids.com'],

  // Video ID regex
  VIDEO_ID_REGEX: /(?:v=|\/)([\w-]{11})(?:\?|&|$)/,

  // Playlist ID regex
  PLAYLIST_ID_REGEX: /[?&]list=([\w-]+)/,

  // Max video duration for free tier (in seconds)
  MAX_FREE_DURATION: 3600, // 1 hour

  // Quality preferences
  QUALITY_PRIORITY: ['2160p', '1440p', '1080p', '720p', '480p', '360p', '144p'],

  // Format types
  FORMAT_TYPES: {
    VIDEO: 'video',
    AUDIO: 'audio',
    COMBINED: 'combined'
  },

  // API endpoints (relative)
  ENDPOINTS: {
    EXTRACT: '/extract',
    CONVERT: '/convert',
    CHECK_TASK: '/check-task',
    PLAYLIST: '/playlist'
  }
} as const;

/**
 * Extract video ID from YouTube URL
 * @param url - YouTube URL
 * @returns Video ID or null
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const match = url.match(YOUTUBE_API_CONSTANTS.VIDEO_ID_REGEX);
  return match ? match[1] : null;
}

/**
 * Extract playlist ID from YouTube URL
 * @param url - YouTube URL
 * @returns Playlist ID or null
 */
export function extractPlaylistId(url: string): string | null {
  if (!url) return null;

  const match = url.match(YOUTUBE_API_CONSTANTS.PLAYLIST_ID_REGEX);
  return match ? match[1] : null;
}

/**
 * Check if URL is a YouTube URL
 * @param url - URL to check
 * @returns True if YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;

  return YOUTUBE_API_CONSTANTS.YOUTUBE_DOMAINS.some(domain =>
    url.toLowerCase().includes(domain)
  );
}
