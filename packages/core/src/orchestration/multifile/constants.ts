/**
 * Multifile Download Constants
 * Centralized configuration for multifile download feature
 * All constants should be defined here and imported where needed
 */

// ============================================================
// ENDPOINTS
// ============================================================

export const MULTIFILE_ENDPOINTS = {
  START: '/api/v2/multifile/start',
  STATUS: '/api/v2/multifile/status',
  STREAM: '/api/v2/multifile/stream',
} as const;

// ============================================================
// TIMEOUTS & LIMITS
// ============================================================

/**
 * Timeout configurations (in milliseconds)
 */
export const MULTIFILE_TIMEOUTS = {
  START_REQUEST: 15000, // 15 seconds for start request
  SESSION_EXPIRE: 30 * 60 * 1000, // 30 minutes session lifetime
  DOWNLOAD_LINK_EXPIRE: 25 * 60 * 1000, // 25 minutes download link expiry (from complete)
  SSE_HEARTBEAT: 30000, // 30 seconds between heartbeats
  SSE_TIMEOUT: 2 * 60 * 1000, // 2 minutes SSE connection timeout
  COUNTDOWN_CHECK_INTERVAL: 60000, // 1 minute countdown check interval
} as const;

/**
 * Request limits
 */
export const MULTIFILE_LIMITS = {
  MAX_URLS: 100, // Maximum URLs per request
  MIN_URLS: 1, // Minimum URLs required
} as const;

// ============================================================
// STATE CONSTANTS
// ============================================================

/**
 * Multifile download session states
 * Maps to server-side processing phases
 */
export const MULTIFILE_STATES = {
  IDLE: 'idle',
  PREPARING: 'preparing', // Initial + decrypting phase
  CONVERTING: 'converting', // Downloading phase
  ZIPPING: 'zipping', // ZIP creation phase
  READY: 'ready', // Complete, download link available
  EXPIRED: 'expired', // Download link expired
  ERROR: 'error', // Critical error occurred
} as const;

export type MultifileState = (typeof MULTIFILE_STATES)[keyof typeof MULTIFILE_STATES];

/**
 * SSE event types from server
 */
export const SSE_EVENTS = {
  CONNECTED: 'connected',
  DECRYPT_PROGRESS: 'decrypt_progress',
  DOWNLOAD_PROGRESS: 'download_progress',
  ZIP_PROGRESS: 'zip_progress',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const;

export type SSEEvent = (typeof SSE_EVENTS)[keyof typeof SSE_EVENTS];

// ============================================================
// PROGRESS WEIGHTS
// ============================================================

/**
 * Progress calculation weights
 * Each phase contributes to overall progress with different weight
 */
export const PROGRESS_WEIGHTS = {
  DECRYPT: 0.2, // 20% of total progress
  DOWNLOAD: 0.6, // 60% of total progress
  ZIP: 0.2, // 20% of total progress
} as const;

// ============================================================
// UI TEXT CONSTANTS
// ============================================================

/**
 * User-facing messages for each state
 */
export const UI_MESSAGES: Record<MultifileState, string> = {
  [MULTIFILE_STATES.IDLE]: 'Ready to start',
  [MULTIFILE_STATES.PREPARING]: 'Preparing...',
  [MULTIFILE_STATES.CONVERTING]: 'Converting...',
  [MULTIFILE_STATES.ZIPPING]: 'Zipping...',
  [MULTIFILE_STATES.READY]: 'Ready',
  [MULTIFILE_STATES.EXPIRED]: 'Link Expired',
  [MULTIFILE_STATES.ERROR]: 'Error occurred',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  // Input validation errors
  EMPTY_URLS: 'Please select at least 1 file to download',
  MAX_URLS_EXCEEDED: 'Maximum 50 files allowed per download',

  // Session errors
  SESSION_NOT_FOUND: 'Session not found or has been removed',
  SESSION_EXPIRED: 'Your session has expired. Please try again.',
  SESSION_LIMIT_REACHED: 'Server is busy. Please try again in a moment.',

  // Processing errors
  DOWNLOAD_FAILED: 'Download failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',

  // Validation
  INVALID_URL_COUNT: 'Invalid number of URLs',

  // Expire popup
  LINK_EXPIRED_TITLE: 'Download Link Expired',
  LINK_EXPIRED_MESSAGE:
    'Your download link has expired after 30 minutes. Please request a new download to continue.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  DOWNLOAD_STARTED: 'Download started successfully',
  PREPARING_FILES: 'Preparing to download {{count}} files. Please wait...',
  DOWNLOAD_READY: 'ZIP file is Ready',
  PARTIAL_SUCCESS: '{{success}}/{{total}} files ready. Some files could not be processed.',
} as const;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculate overall progress from individual phase progress
 */
export function calculateOverallProgress(
  decryptProgress: number,
  downloadProgress: number,
  zipProgress: number
): number {
  return Math.round(
    decryptProgress * PROGRESS_WEIGHTS.DECRYPT +
      downloadProgress * PROGRESS_WEIGHTS.DOWNLOAD +
      zipProgress * PROGRESS_WEIGHTS.ZIP
  );
}

/**
 * Format template string with variables
 */
export function formatMessage(template: string, vars: Record<string, any>): string {
  if (!template || typeof template !== 'string') return '';

  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return result;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

/**
 * Check if URLs count is valid
 */
export function validateUrlCount(count: number): ValidationResult {
  if (count < MULTIFILE_LIMITS.MIN_URLS) {
    return {
      valid: false,
      error: ERROR_MESSAGES.EMPTY_URLS,
    };
  }

  if (count > MULTIFILE_LIMITS.MAX_URLS) {
    return {
      valid: false,
      error: ERROR_MESSAGES.MAX_URLS_EXCEEDED,
    };
  }

  return {
    valid: true,
    error: null,
  };
}

/**
 * Get remaining time in milliseconds
 */
export function getRemainingTime(expireTimestamp: number): number {
  const remaining = expireTimestamp - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Check if timestamp has expired
 */
export function isExpired(expireTimestamp: number): boolean {
  return Date.now() >= expireTimestamp;
}

/**
 * Format remaining time for display
 */
export function formatRemainingTime(milliseconds: number): string {
  const minutes = Math.ceil(milliseconds / 60000);

  if (minutes <= 0) {
    return 'Expired';
  }

  if (minutes === 1) {
    return '1 minute';
  }

  return `${minutes} minutes`;
}
