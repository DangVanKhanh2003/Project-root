/**
 * YouTube API Constants
 * Constants for YouTube URL handling and API interactions
 */

export const YOUTUBE_API_CONSTANTS = {
  // URL patterns
  YOUTUBE_DOMAINS: ['youtube.com', 'youtu.be', 'm.youtube.com', 'youtube-nocookie.com', 'youtubekids.com'],

  // Video ID regex patterns
  VIDEO_ID_PATTERNS: {
    SHORT_URL: /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    SHORTS: /\/shorts\/([a-zA-Z0-9_-]{11})/,
    WATCH: /[?&]v=([a-zA-Z0-9_-]{11})/,
    EMBED: /\/embed\/([a-zA-Z0-9_-]{11})/,
  },

  // Playlist ID regex
  PLAYLIST_ID_REGEX: /[?&]list=([\w-]+)/,

  // Max video duration for free tier (in seconds)
  MAX_FREE_DURATION: 3600, // 1 hour

  // Quality preferences (ordered by priority)
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
