/**
 * API Endpoints Constants
 * Centralized configuration for all API endpoints
 */

/**
 * Main downloader API endpoints (v1)
 * Base URL will be prepended from ApiConfig.v1.baseUrl
 */
export const API_ENDPOINTS = {
  /** Media extraction (YouTube - encrypted URLs) */
  EXTRACT: '/extract',

  /** Media extraction (Direct downloads - TikTok, Facebook, etc.) */
  EXTRACT_NON_ENCODE: '/extract-non-encode',

  /** Search videos by keyword */
  SEARCH_TITLE: '/search-title',

  /** Get search suggestions */
  SUGGEST_KEYWORD: '/suggest-keyword',

  /** Extract playlist videos */
  PLAYLIST: '/playlist',

  /** Convert/decrypt YouTube format */
  CONVERT: '/convert',

  /** Check conversion task status */
  CHECK_TASK: '/check-task',

  /** Decode single encrypted URL */
  DECRYPT: '/decrypt',

  /** Decode multiple encrypted URLs */
  DECRYPT_LIST: '/decrypt/list',

  /** Send user feedback */
  FEEDBACK: '/feedback',
} as const;

/**
 * Multifile download API endpoints (v1)
 */
export const MULTIFILE_ENDPOINTS = {
  /** Start multifile download session */
  START: '/download/multifile-non-encode/start',

  /** Stream multifile download */
  STREAM: '/download/multifile/stream',

  /** Get multifile session status */
  STATUS: '/download/multifile/status',
} as const;

/**
 * YouTube Download API endpoints (v2)
 * Uses ApiConfig.v2.baseUrl
 */
export const YOUTUBE_DOWNLOAD_ENDPOINTS = {
  /** Download YouTube video or audio */
  DOWNLOAD: '/',

  /** Get download progress by cache ID */
  PROGRESS: '/api/download/progress',
} as const;

/**
 * Search v2 API endpoints
 * Uses ApiConfig.search.baseUrl if provided, otherwise ApiConfig.v2.baseUrl
 */
export const SEARCH_V2_ENDPOINTS = {
  /** Search YouTube with rich metadata */
  SEARCH: '/api/youtube/search',
} as const;

/**
 * Queue API endpoints
 * Uses ApiConfig.queue.baseUrl
 */
export const QUEUE_ENDPOINTS = {
  /** Add video to extraction queue */
  ADD_VIDEO_QUEUE: '/api/add-video-queue',
} as const;

/**
 * V3 Download API endpoints
 * Base URL: https://api.ytconvert.org
 */
export const V3_ENDPOINTS = {
  /** Create download job - POST /api/download */
  DOWNLOAD: '/api/download',

  /** V3 Playlist extraction - GET /playlist?id={playlistId} (yt-meta) */
  PLAYLIST: '/playlist',

  /** Get job status - GET /api/status/:id */
  STATUS: '/api/status',

  /** Download file - GET /files/:id/:filename */
  FILES: '/files',

  /** Stream file - GET /stream/:id */
  STREAM: '/stream',

  /** Delete job - DELETE /api/jobs/:id */
  DELETE_JOB: '/api/jobs',

  /** Health check - GET /health */
  HEALTH: '/health',
} as const;
