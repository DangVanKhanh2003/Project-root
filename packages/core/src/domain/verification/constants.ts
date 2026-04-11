/**
 * Verification Constants
 * Standardized status and code constants for the verification domain.
 */

export const VERIFICATION_STATUS = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

export const VERIFICATION_CODE = {
  OK: 'OK',
  EMPTY_RESULTS: 'EMPTY_RESULTS',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  TASK_NOT_READY: 'TASK_NOT_READY',
  ERROR: 'ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  CAPTCHA_REQUIRED: 'CAPTCHA_REQUIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export const POLICY_NAME = {
  // Search V1
  SEARCH_TITLE: 'searchTitle',
  GET_SUGGESTIONS: 'getSuggestions',

  // Media
  EXTRACT_MEDIA: 'extractMedia',
  EXTRACT_MEDIA_DIRECT: 'extractMediaDirect',

  // Conversion
  CONVERT: 'convert',
  CHECK_TASK: 'checkTask',

  // Playlist
  EXTRACT_PLAYLIST: 'extractPlaylist',

  // Decrypt
  DECODE_URL: 'decodeUrl',
  DECODE_LIST: 'decodeList',

  // Feedback
  SEND_FEEDBACK: 'sendFeedback',
  SEND_FEEDBACK_WIDGET: 'sendFeedbackWidget',

  // Search V2
  SEARCH_V2: 'searchV2',

  // Queue
  ADD_VIDEO_TO_QUEUE: 'addVideoToQueue',

  // YouTube Download
  DOWNLOAD_YOUTUBE: 'downloadYouTube',
  GET_DOWNLOAD_PROGRESS: 'getDownloadProgress',



  // YouTube Public API
  GET_METADATA_YOUTUBE: 'getMetadataYoutube',
} as const;