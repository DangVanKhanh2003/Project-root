/**
 * API Endpoints Constants
 * Centralized configuration for all API endpoints
 * All endpoints should be defined here and imported where needed
 */

// ============================================================
// CORE API ENDPOINTS (API v1)
// ============================================================

/**
 * Main downloader API endpoints
 * Base URL will be prepended from httpClient.js (default: /api/v1)
 */
export const API_ENDPOINTS = {
    // Media extraction
    EXTRACT: '/extract',
    EXTRACT_NON_ENCODE: '/extract-non-encode',

    // Search & suggestions
    SEARCH_TITLE: '/search-title',
    SUGGEST_KEYWORD: '/suggest-keyword',

    // Playlist
    PLAYLIST: '/playlist',

    // Conversion & tasks
    CONVERT: '/convert',
    CHECK_TASK: '/check-task',

    // Decoding (old decrypt endpoints)
    DECRYPT: '/decrypt',
    DECRYPT_LIST: '/decrypt/list',

    // Feedback
    FEEDBACK: '/feedback',
};

// ============================================================
// MULTIFILE DOWNLOAD ENDPOINTS
// ============================================================

/**
 * Multifile download API endpoints
 * Base URL will be prepended from environment.js
 */
export const MULTIFILE_ENDPOINTS = {
    START: '/download/multifile-non-encode/start',
    STREAM: '/download/multifile/stream',
    STATUS: '/download/multifile/status',
};

// ============================================================
// YOUTUBE STREAM API ENDPOINTS
// ============================================================

/**
 * YouTube Stream API endpoints
 * Base URL comes from environment.js (getYouTubeStreamApiUrl)
 */
export const YOUTUBE_STREAM_ENDPOINTS = {
    EXTRACT_V2: '/api/v1/youtube-stream/extract',
    POLL_PROGRESS: '/poll-progress', // Relative to specific progress URL
};

// ============================================================
// SEARCH V2 API ENDPOINTS
// ============================================================

/**
 * Search v2 API endpoints (YouTube search with rich metadata)
 * Uses different domain than main API
 */
export const SEARCH_V2_CONFIG = {
    BASE_URL: 'https://yt-extractor.y2mp3.co',
    ENDPOINT: '/api/youtube/search',
};

// ============================================================
// QUEUE API ENDPOINTS
// ============================================================

/**
 * Queue API endpoints (YouTube add queue)
 * Base URL comes from environment.js (getQueueApiUrl)
 */
export const QUEUE_ENDPOINTS = {
    ADD_VIDEO_QUEUE: '/api/add-video-queue',
};
