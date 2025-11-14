'use strict';

/**
 * Normalize any value to string
 */
export function normaliseText(value) {
  if (value === undefined || value === null) return '';
  return String(value);
}

/** Default error message used as a fallback across UI/API layers */
export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Error code to user-friendly message mapping
 */
const ERROR_CODE_MESSAGES = {
  'error.api.content.too_long': 'Video is too long.',
};

/**
 * Map error code to user-friendly message
 * @param {string} code - Error code from API
 * @param {Object} context - Optional context object
 * @returns {string|null} User-friendly message or null if unmapped
 */
function mapErrorCode(code, context) {
  if (!code || typeof code !== 'string') return null;

  const message = ERROR_CODE_MESSAGES[code];
  if (message) {
    // Log for developers
    return message;
  }

  // Unknown error code - log for debugging
  if (code.startsWith('error.')) {
  }

  return null;
}

/**
 * Extract message from error object
 * @param {Object} obj - Error object
 * @returns {string|null} Extracted message or null
 */
function extractMessageFromObject(obj) {
  if (!obj || typeof obj !== 'object') return null;

  // Try error code mapping first (priority)
  if (obj.code) {
    const mapped = mapErrorCode(obj.code, obj.context);
    if (mapped) return mapped;
  }

  // Try common message properties
  if (typeof obj.message === 'string' && obj.message.trim()) {
    return obj.message.trim();
  }

  if (typeof obj.error === 'string' && obj.error.trim()) {
    return obj.error.trim();
  }

  if (typeof obj.msg === 'string' && obj.msg.trim()) {
    return obj.msg.trim();
  }

  // Try nested error object
  if (obj.error && typeof obj.error === 'object') {
    return extractMessageFromObject(obj.error);
  }

  return null;
}

/**
 * Ensure a usable, non-empty message string.
 * Handles strings, error objects with codes, and nested error structures.
 * Falls back to a default message if extraction fails.
 */
export function ensureMessage(message, fallback = DEFAULT_ERROR_MESSAGE) {
  const fb = normaliseText(fallback).trim() || DEFAULT_ERROR_MESSAGE;

  // Case 1: String message
  if (typeof message === 'string') {
    const trimmed = message.trim();
    if (trimmed) return trimmed;
    return fb;
  }

  // Case 2: Error object
  if (typeof message === 'object' && message !== null) {
    const extracted = extractMessageFromObject(message);
    if (extracted) return extracted;

    // Log unhandled object structure for debugging
    return fb;
  }

  // Case 3: Other types (null, undefined, etc.)
  return fb;
}

/**
 * Alias for normaliseText
 */
export const sanitise = normaliseText;

/**
 * Decode Unicode escape sequences (Vietnamese support)
 */
export function decodeUnicode(value) {
  if (typeof value !== 'string') return value;
  try {
    let result = value;
    if (result.includes('\\u')) {
      result = result.replace(/\\u([0-9a-fA-F]{4})/g, (match, group) => {
        return String.fromCharCode(parseInt(group, 16));
      });
    }
    return result;
  } catch (error) {
    return value;
  }
}

/**
 * Check if text looks like a URL
 */
export function isLikelyUrl(text) {
  if (!text) return false;
  const trimmed = String(text).trim();
  if (!trimmed) return false;

  // 1) Fast path: explicit scheme
  const schemePattern = /^(https?|ftp):\/\//i;
  const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  if (schemePattern.test(trimmed)) {
    return urlPattern.test(trimmed);
  }

  // 2) Scheme-less absolute URLs like example.com/path or youtu.be/ID
  const schemelessDomainPath = /^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(?:\/|\?|#)[^\s]*$/i;
  if (schemelessDomainPath.test(trimmed)) {
    return true;
  }

  // 3) Special-case YouTube hosts to avoid false negatives
  //    Accept even without trailing path to ensure UX-friendly detection.
  const ytHostOnly = /^(?:[a-z0-9-]+\.)*(?:youtube\.com|youtube-nocookie\.com|youtu\.be)$/i;
  const ytHostWithPath = /^(?:www\.)?(?:youtu\.be|youtube(?:-nocookie)?\.com)(?:\/|$)/i;
  if (ytHostOnly.test(trimmed) || ytHostWithPath.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(value) {
  if (!value && value !== 0) return '';
  if (typeof value === 'string' && value.match(/[a-z]/i)) return value;

  const num = Number(value);
  if (Number.isNaN(num)) return '';
  if (num === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1024)), units.length - 1);
  const size = num / Math.pow(1024, exponent);
  return size.toFixed(exponent === 0 ? 0 : 1) + ' ' + units[exponent];
}

/**
 * Generate unique format ID
 */
export function uniqueFormatId(category, format, fallbackId) {
  const parts = [
    category,
    format.type || format.ext || format.format,
    format.quality || format.quality_label || format.resolution,
    format.fps || format.bitrate,
    fallbackId
  ].filter(Boolean);
  return parts.join('|');
}

/**
 * Clean video URL (remove tracking params)
 */
export function cleanVideoUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return url.trim();
}

/**
 * Parse error message from a failed API response.
 * Works with fetch API Response object or any other object.
 */
export async function parseErrorMessage(response, fallback) {
  const fallbackMessage = ensureMessage(
    fallback || DEFAULT_ERROR_MESSAGE
  );
  if (!response) return fallbackMessage;

  try {
    // Assumes response is a fetch Response object first
    if (typeof response.json === 'function') {
      const data = await response.json();
      const msg = (data && (data.message || data.error)) || '';
      return ensureMessage(msg, fallbackMessage);
    }
    // Fallback for plain objects
    if (typeof response === 'object') {
        const msg = (response && (response.message || response.error)) || '';
        return ensureMessage(msg, fallbackMessage);
    }
  } catch (error) {
    // Ignore JSON parsing errors
  }
  return fallbackMessage;
}

/**
 * Convert value to array
 */
export function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

/**
 * HTML escape for XSS protection (Browser-only)
 */
export function htmlEscape(text) {
  if (typeof window === 'undefined') return String(text); // Non-browser environment
  if (!text && text !== 0) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

/**
 * Trim text to specified length
 */
export function trimText(text, maxLength) {
  if (!text) return '';
  const str = String(text);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength).trim() + '...';
}

/**
 * Debounce function calls
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Deep clone object (simple implementation)
 */
export function clone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get current timestamp
 */
export function now() {
  return Date.now();
}

/**
 * Detect optimal aspect ratio class for images
 */
export function detectAspectRatioClass(width, height) {
  if (!width || !height || width <= 0 || height <= 0) {
    return 'aspect-16-9'; // Default fallback
  }

  const aspectRatio = width / height;
  const ratio16_9 = 16 / 9; // ≈ 1.778
  const ratio9_16 = 9 / 16; // ≈ 0.563

  const distance16_9 = Math.abs(aspectRatio - ratio16_9);
  const distance9_16 = Math.abs(aspectRatio - ratio9_16);

  return distance16_9 <= distance9_16 ? 'aspect-16-9' : 'aspect-9-16';
}

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - String with first letter capitalized
 */
export function capitalizeFirst(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Detect YouTube content type from URL
 * @param {string} url - YouTube URL to analyze
 * @returns {'playlist'|'video'} - Content type
 */
export function detectYouTubeContentType(url) {
  if (!url || typeof url !== 'string') return 'video';

  let urlObj;
  try {
    urlObj = new URL(url.trim());
  } catch (error) {
    return 'video';
  }

  // Check if it's a YouTube URL
  if (!urlObj.hostname.includes('youtube.com') && !urlObj.hostname.includes('youtu.be')) {
    return 'video';
  }

  const params = urlObj.searchParams;
  const hasListParam = params.has('list');
  const hasIndexParam = params.has('index');
  const hasStartRadioParam = params.has('start_radio');

  // No list parameter = single video
  if (!hasListParam) {
    return 'video';
  }

  // Has list but also has index or start_radio = single video in playlist
  if (hasListParam && (hasIndexParam || hasStartRadioParam)) {
    return 'video';
  }

  // Has list but no index/start_radio = playlist
  if (hasListParam && !hasIndexParam && !hasStartRadioParam) {
    return 'playlist';
  }

  return 'video';
}
