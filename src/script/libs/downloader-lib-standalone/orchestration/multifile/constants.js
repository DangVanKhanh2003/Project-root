/**
 * Multifile Download Constants
 * Centralized configuration for multifile download feature
 * All constants should be defined here and imported where needed
 */

// Re-export endpoints from centralized location
export { MULTIFILE_ENDPOINTS } from '../../api/endpoints.js';

// ============================================================
// TIMEOUTS & LIMITS
// ============================================================

/**
 * Timeout configurations (in milliseconds)
 */
export var MULTIFILE_TIMEOUTS = {
    START_REQUEST: 15000,        // 15 seconds for start request
    SESSION_EXPIRE: 30 * 60 * 1000,  // 30 minutes session lifetime
    DOWNLOAD_LINK_EXPIRE: 25 * 60 * 1000,  // 25 minutes download link expiry (from complete)
    SSE_HEARTBEAT: 30000,        // 30 seconds between heartbeats
    SSE_TIMEOUT: 2 * 60 * 1000,  // 2 minutes SSE connection timeout
    COUNTDOWN_CHECK_INTERVAL: 60000,  // 1 minute countdown check interval
};

/**
 * Request limits
 */
export var MULTIFILE_LIMITS = {
    MAX_URLS: 100,              // Maximum URLs per request
    MIN_URLS: 1,                // Minimum URLs required
};

// ============================================================
// STATE CONSTANTS
// ============================================================

/**
 * Multifile download session states
 * Maps to server-side processing phases
 */
export var MULTIFILE_STATES = {
    IDLE: 'idle',
    PREPARING: 'preparing',      // Initial + decrypting phase
    CONVERTING: 'converting',    // Downloading phase
    ZIPPING: 'zipping',          // ZIP creation phase
    READY: 'ready',              // Complete, download link available
    EXPIRED: 'expired',          // Download link expired
    ERROR: 'error',              // Critical error occurred
};

/**
 * SSE event types from server
 */
export var SSE_EVENTS = {
    CONNECTED: 'connected',
    DECRYPT_PROGRESS: 'decrypt_progress',
    DOWNLOAD_PROGRESS: 'download_progress',
    ZIP_PROGRESS: 'zip_progress',
    COMPLETE: 'complete',
    ERROR: 'error',
};

// ============================================================
// PROGRESS WEIGHTS
// ============================================================

/**
 * Progress calculation weights
 * Each phase contributes to overall progress with different weight
 */
export var PROGRESS_WEIGHTS = {
    DECRYPT: 0.2,    // 20% of total progress
    DOWNLOAD: 0.6,   // 60% of total progress
    ZIP: 0.2,        // 20% of total progress
};

// ============================================================
// UI TEXT CONSTANTS
// ============================================================

/**
 * User-facing messages for each state
 */
export var UI_MESSAGES = {
    [MULTIFILE_STATES.IDLE]: 'Ready to start',
    [MULTIFILE_STATES.PREPARING]: 'Preparing...',
    [MULTIFILE_STATES.CONVERTING]: 'Converting...',
    [MULTIFILE_STATES.ZIPPING]: 'Zipping...',
    [MULTIFILE_STATES.READY]: 'Ready ',
    [MULTIFILE_STATES.EXPIRED]: 'Link Expired',
    [MULTIFILE_STATES.ERROR]: 'Error occurred',
};

/**
 * Error messages
 */
export var ERROR_MESSAGES = {
    // Input validation errors
    EMPTY_URLS: 'Please select at least 1 file to download',
    MAX_URLS_EXCEEDED: 'Maximum 100 files allowed per download',

    // Session errors
    SESSION_NOT_FOUND: 'Session not found or has been removed',
    SESSION_EXPIRED: 'Your session has expired. Please try again.',
    SESSION_LIMIT_REACHED: 'Server is busy. Please try again in a moment.',

    // Processing errors
    DOWNLOAD_FAILED: 'Download failed. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',

    // Expire popup
    LINK_EXPIRED_TITLE: 'Download Link Expired',
    LINK_EXPIRED_MESSAGE: 'Your download link has expired after 30 minutes. Please request a new download to continue.',
};

/**
 * Success messages
 */
export var SUCCESS_MESSAGES = {
    DOWNLOAD_STARTED: 'Download started successfully',
    PREPARING_FILES: 'Preparing to download {{count}} files. Please wait...',
    DOWNLOAD_READY: 'ZIP file is Ready',
    PARTIAL_SUCCESS: '{{success}}/{{total}} files ready. Some files could not be processed.',
};

// ============================================================
// STORAGE KEYS
// ============================================================

/**
 * LocalStorage keys for persistence
 */
export var STORAGE_KEYS = {
    SESSION_ID: 'multifile_session_id',
    DOWNLOAD_URL: 'multifile_download_url',
    EXPIRE_TIME: 'multifile_expire_time',
    SELECTED_URLS: 'multifile_selected_urls',
};

// ============================================================
// CSS CLASSES
// ============================================================

/**
 * CSS class names for multifile UI
 */
export var CSS_CLASSES = {
    // Container
    MODAL: 'multifile-modal',
    MODAL_VISIBLE: 'multifile-modal--visible',
    OVERLAY: 'multifile-overlay',

    // Content
    CONTENT: 'multifile-content',
    HEADER: 'multifile-header',
    BODY: 'multifile-body',
    FOOTER: 'multifile-footer',

    // States
    STATE_PREPARING: 'multifile--preparing',
    STATE_CONVERTING: 'multifile--converting',
    STATE_ZIPPING: 'multifile--zipping',
    STATE_READY: 'multifile--ready',
    STATE_EXPIRED: 'multifile--expired',
    STATE_ERROR: 'multifile--error',

    // Components
    PROGRESS_BAR: 'multifile-progress-bar',
    PROGRESS_FILL: 'multifile-progress-fill',
    STATUS_TEXT: 'multifile-status-text',
    SPINNER: 'multifile-spinner',
    BUTTON_PRIMARY: 'multifile-btn-primary',
    BUTTON_SECONDARY: 'multifile-btn-secondary',

    // Expire popup
    EXPIRE_POPUP: 'multifile-expire-popup',
    EXPIRE_POPUP_VISIBLE: 'multifile-expire-popup--visible',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculate overall progress from individual phase progress
 * @param {number} decryptProgress - Progress 0-100
 * @param {number} downloadProgress - Progress 0-100
 * @param {number} zipProgress - Progress 0-100
 * @returns {number} Overall progress 0-100
 */
export function calculateOverallProgress(decryptProgress, downloadProgress, zipProgress) {
    return Math.round(
        decryptProgress * PROGRESS_WEIGHTS.DECRYPT +
        downloadProgress * PROGRESS_WEIGHTS.DOWNLOAD +
        zipProgress * PROGRESS_WEIGHTS.ZIP
    );
}

/**
 * Format template string with variables
 * @param {string} template - Template string with {{variable}} placeholders
 * @param {Object} vars - Variables to replace
 * @returns {string} Formatted string
 */
export function formatMessage(template, vars) {
    if (!template || typeof template !== 'string') return '';

    let result = template;
    for (var [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
}

/**
 * Check if URLs count is valid
 * @param {number} count - Number of URLs
 * @returns {{valid: boolean, error: string|null}} Validation result
 */
export function validateUrlCount(count) {
    if (count < MULTIFILE_LIMITS.MIN_URLS) {
        return {
            valid: false,
            error: ERROR_MESSAGES.EMPTY_URLS
        };
    }

    if (count > MULTIFILE_LIMITS.MAX_URLS) {
        return {
            valid: false,
            error: ERROR_MESSAGES.MAX_URLS_EXCEEDED
        };
    }

    return {
        valid: true,
        error: null
    };
}

/**
 * Get remaining time in milliseconds
 * @param {number} expireTimestamp - Expire timestamp (Date.now() format)
 * @returns {number} Remaining milliseconds (0 if expired)
 */
export function getRemainingTime(expireTimestamp) {
    var remaining = expireTimestamp - Date.now();
    return remaining > 0 ? remaining : 0;
}

/**
 * Check if timestamp has expired
 * @param {number} expireTimestamp - Expire timestamp (Date.now() format)
 * @returns {boolean} True if expired
 */
export function isExpired(expireTimestamp) {
    return Date.now() >= expireTimestamp;
}

/**
 * Format remaining time for display
 * @param {number} milliseconds - Remaining time in milliseconds
 * @returns {string} Formatted string (e.g., "15 minutes", "2 minutes")
 */
export function formatRemainingTime(milliseconds) {
    var minutes = Math.ceil(milliseconds / 60000);

    if (minutes <= 0) {
        return 'Expired';
    }

    if (minutes === 1) {
        return '1 minute';
    }

    return `${minutes} minutes`;
}
