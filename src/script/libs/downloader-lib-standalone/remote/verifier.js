/**
 * Verification layer for service outputs.
 * Standardizes success/warning/error with stable codes and messages.
 */

import { createService } from './service.js';
import { createYouTubePublicApiService } from './youtube-public-api.js';
import { normalizeStreamResponse, normalizeYouTubeOembed } from './normalizers.js';

/**
 * Unified result envelope used by the Script/UI layer.
 * @typedef {Object} VerifiedResult
 * @property {boolean} ok - True for success only.
 * @property {'success'|'warning'|'error'} status
 * @property {string} code - Stable machine-readable code.
 * @property {string} message - Human-friendly message.
 * @property {any} data - Payload (normalized data from service) when applicable.
 * @property {any} raw - Raw error/response for diagnostics.
 */

/**
 * Create a standardized result.
 * @param {'success'|'warning'|'error'} status
 * @param {string} code
 * @param {string} message
 * @param {any} data
 * @param {any} raw
 * @returns {VerifiedResult}
 */
function makeResult(status, code, message, data = null, raw = null) {
  return {
    ok: status === 'success',
    status,
    code,
    message,
    data,
    raw,
  };
}

/** Default messages map (can be localized upstream) */
const M = {
  OK: 'Success',
  EMPTY_RESULTS: 'No results found',
  EMPTY_FORMATS: 'No available download formats',
  EMPTY_PLAYLIST: 'Playlist has no videos',
  TASK_FAILED: 'Processing failed',
  TASK_MISSING_URL: 'Missing download link',
  NETWORK_OR_API: 'Request failed. Please try again.',
  DECODE_FAILED: 'Failed to decode URL',
  DECODE_LIST_FAILED: 'Failed to decode one or more URLs',
  OEMBED_NO_DATA: 'Failed to fetch video information',
  FEEDBACK_SENT: 'Feedback sent successfully',
  FEEDBACK_FAILED: 'Failed to send feedback',
  INVALID_RESULTS: 'Search returned invalid data',
  EMPTY_PAGE: 'This page contains no results',
  MISSING_PAGINATION: 'Pagination information missing',
  INVALID_PAGE_TOKEN: 'Invalid page token provided',
  QUEUE_SUCCESS: 'Video added to queue',
  QUEUE_FAILED: 'Failed to add video to queue',
};

/**
 * Policies per operation: conditions => standardized results.
 * Each rule returns null to continue, or a VerifiedResult to short-circuit.
 */
const DefaultPolicies = {
  // Keyword search
  async searchTitle(payload, ctx) {
    // payload: { total, videos: [] }
    if (!payload || !Array.isArray(payload.videos)) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }
    if (payload.videos.length === 0) {
      return makeResult('warning', 'EMPTY_RESULTS', M.EMPTY_RESULTS, payload, { payload, ctx });
    }
    return makeResult('success', 'OK', M.OK, payload);
  },

  // Extract media (single URL)
  async extractMedia(payload, ctx) {
    // payload: { meta, formats: {video[], audio[]}, gallery? }
    if (!payload) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }

    const hasVideo = Array.isArray(payload.formats?.video) && payload.formats.video.length > 0;
    const hasAudio = Array.isArray(payload.formats?.audio) && payload.formats.audio.length > 0;
    const hasGallery = Array.isArray(payload.gallery) && payload.gallery.length > 0;

    if (!hasVideo && !hasAudio && !hasGallery) {
      return makeResult('warning', 'EMPTY_FORMATS', M.EMPTY_FORMATS, payload, { payload, ctx });
    }
    return makeResult('success', 'OK', M.OK, payload);
  },

  async extractMediaDirect(payload, ctx) {
    if (!payload) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }

    const hasVideo = Array.isArray(payload.formats?.video) && payload.formats.video.length > 0;
    const hasAudio = Array.isArray(payload.formats?.audio) && payload.formats.audio.length > 0;
    const hasGallery = Array.isArray(payload.gallery) && payload.gallery.length > 0;

    if (!hasVideo && !hasAudio && !hasGallery) {
      return makeResult('warning', 'EMPTY_FORMATS', M.EMPTY_FORMATS, payload, { payload, ctx });
    }
    return makeResult('success', 'OK', M.OK, payload);
  },

  // Extract playlist
  async extractPlaylist(payload, ctx) {
    if (!payload || !Array.isArray(payload.items)) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }
    if (payload.items.length === 0) {
      return makeResult('warning', 'EMPTY_PLAYLIST', M.EMPTY_PLAYLIST, payload, { payload, ctx });
    }
    return makeResult('success', 'OK', M.OK, payload);
  },

  // Convert & CheckTask share same normalized structure
  async convert(payload, ctx) {
    return verifyTaskLike(payload, ctx);
  },
  async checkTask(payload, ctx) {
    return verifyTaskLike(payload, ctx);
  },

  // Decode URL
  async decodeUrl(payload, ctx) {
    // payload: { success: boolean, url?: string, error?: string, reason?: string }
    if (!payload) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }
    if (!payload.success) {
      const message = payload.error || M.DECODE_FAILED;
      return makeResult('error', 'ERROR', message, payload, { payload, ctx });
    }
    if (!payload.url) {
      return makeResult('warning', 'TASK_MISSING_URL', M.TASK_MISSING_URL, payload, { payload, ctx });
    }
    return makeResult('success', 'OK', M.OK, payload);
  },

  // Decode a list of URLs
  async decodeList(payload, ctx) {
    // payload: { status: 'ok', results: [...], total_count, success_count, error_count }
    if (!payload || (payload.status !== 'ok' && payload.data.status !== 'ok') || !Array.isArray(payload.data.results)) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }

    if (payload.success_count === 0 && payload.total_count > 0) {
      return makeResult('warning', 'DECODE_LIST_FAILED', M.DECODE_LIST_FAILED, payload, { payload, ctx });
    }
    // The API call itself was successful, even if some items failed.
    // The UI is responsible for interpreting the individual results.
    return makeResult('success', 'OK', M.OK, payload);
  },

  // Start multifile download session
  async startMultifileSession(payload, ctx) {
    // payload: { success: true, data: { status, session_id, stream_url, expires_at } }
    if (!payload || !payload.success || !payload.data) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }

    const { session_id, stream_url, expires_at } = payload.data;

    if (!session_id || !stream_url) {
      return makeResult('error', 'ERROR', 'Missing required session data', payload, { payload, ctx });
    }

    return makeResult('success', 'OK', M.OK, payload.data);
  },

  // Get multifile download status
  async getMultifileStatus(payload, ctx) {
    // payload: { success: true, data: { session_id, status, progress, stats, ... } }
    if (!payload || !payload.success || !payload.data) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }

    return makeResult('success', 'OK', M.OK, payload.data);
  },

  // Extract YouTube video/audio via stream API (direct download)
  async extractV2_stream(payload, ctx) {
    // payload: {status, url, filename, title, quality, format, downloadMode} - direct download object
    if (!payload) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }

    // Validate required fields for direct download
    if (!payload.url) {
      return makeResult('warning', 'TASK_MISSING_URL', M.TASK_MISSING_URL, payload, { payload, ctx });
    }

    return makeResult('success', 'OK', M.OK, payload);
  },

  // YouTube Public API (oEmbed)
  async getYouTubeMetadata(payload, ctx) {
    // payload: normalized oEmbed data {meta, formats, gallery}
    if (!payload || !payload.meta) {
      return makeResult('error', 'ERROR', M.OEMBED_NO_DATA, null, { payload, ctx });
    }

    // Check if at least title exists
    if (!payload.meta.title || payload.meta.title === 'Unknown Title') {
      return makeResult('warning', 'INCOMPLETE_DATA', 'Incomplete video information', payload, { payload, ctx });
    }

    return makeResult('success', 'OK', M.OK, payload);
  },

  // Send feedback
  async sendFeedback(payload, ctx) {
    // payload: { ok: true, message: "Feedback sent successfully" }
    if (!payload) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }

    // Check if API returned success
    if (payload.ok === true) {
      const message = payload.message || M.FEEDBACK_SENT;
      return makeResult('success', 'OK', message, payload);
    }

    // API returned error
    const errorMessage = payload.message || M.FEEDBACK_FAILED;
    return makeResult('error', 'ERROR', errorMessage, payload, { payload, ctx });
  },

  // Search V2 (unified search and pagination)
  async searchV2(payload, ctx) {
    if (!payload || !Array.isArray(payload.items)) {
      return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
    }

    // Handle empty results intelligently
    if (payload.items.length === 0) {
      // Check if this is end of pagination
      if (payload.pagination && payload.pagination.hasNextPage === false) {
        return makeResult('success', 'OK', 'No more results available', payload);
      } else {
        // Fresh search with no results
        return makeResult('warning', 'EMPTY_RESULTS', M.EMPTY_RESULTS, payload);
      }
    }

    // Validate items quality
    const validItems = payload.items.filter(item =>
      item.id && item.title && item.type && item.thumbnailUrl
    );

    if (validItems.length === 0) {
      return makeResult('warning', 'INVALID_RESULTS', M.INVALID_RESULTS, payload);
    }

    return makeResult('success', 'OK', M.OK, payload);
  },

  // Add video to queue (fire-and-forget notification)
  async addVideoToQueue(payload, ctx) {
    // payload: boolean (true/false success status)
    if (payload === true) {
      return makeResult('success', 'OK', M.QUEUE_SUCCESS, payload);
    }
    // Any other value (false, null, etc.) is treated as failed
    return makeResult('warning', 'QUEUE_FAILED', M.QUEUE_FAILED, payload, { payload, ctx });
  },
};

function verifyTaskLike(payload, ctx) {
  // payload: { status, vid, bId, downloadUrl, message, ... }
  const status = String(payload?.status || '').toUpperCase();
  if (!status) {
    return makeResult('error', 'ERROR', M.NETWORK_OR_API, null, { payload, ctx });
  }
  if (status === 'FAILED') {
    return makeResult('error', 'ERROR', payload?.message || M.TASK_FAILED, payload, { payload, ctx });
  }
  if (status === 'SUCCESS') {
    if (!payload?.downloadUrl) {
      return makeResult('warning', 'TASK_MISSING_URL', M.TASK_MISSING_URL, payload, { payload, ctx });
    }
    return makeResult('success', 'OK', M.OK, payload);
  }
  // PENDING / CONVERTING etc. are treated as success to continue polling
  return makeResult('success', 'OK', M.OK, payload);
}

/**
 * Create a verified service wrapper around the raw service.
 * @param {object} config - same config as createService
 * @param {object} policies - optional overrides per method
 * @param {Function} captchaProtection - optional CAPTCHA protection wrapper (from feature layer)
 */
export function createVerifiedService(config = {}, policies = {}, captchaProtection = null) {
  const rawService = createService(config);
  const youtubePublicApi = createYouTubePublicApiService(config);
  const rules = { ...DefaultPolicies, ...(policies || {}) };

  // Wrap the raw service methods with captcha protection (if provided)
  const protectFn = captchaProtection || ((fn) => fn); // Identity function if no protection
  const protectedExtractMediaDirect = protectFn(rawService.extractMediaDirect);
  const protectedDecodeUrl = protectFn(rawService.decodeUrl);
  const protectedStartMultifileSession = protectFn(rawService.startMultifileSession);
  const protectedConvert = protectFn(rawService.convert);
  const protectedDecodeList = protectFn(rawService.decodeList);

  async function wrap(methodName, fn, ...args) {
    try {
      const payload = await fn(...args);
      const policy = rules[methodName];
      if (typeof policy === 'function') {
        const result = await policy(payload, { method: methodName, args });
        return result;
      }
      // No policy: treat as success pass-through
      return makeResult('success', 'OK', M.OK, payload);
    } catch (err) {
      // Normalize thrown errors (HTTP/network/hidden failure)
      const message = err?.message || err?.reason || M.NETWORK_OR_API;
      return makeResult('error', 'ERROR', message, null, err);
    }
  }

  return {
    // Same API surface, but returning VerifiedResult
    extractMedia: (url) => wrap('extractMedia', rawService.extractMedia, url),
    extractMediaDirect: (url) => wrap('extractMediaDirect', protectedExtractMediaDirect, url),
    searchTitle: (keyword) => wrap('searchTitle', rawService.searchTitle, keyword),
    extractPlaylist: (url) => wrap('extractPlaylist', rawService.extractPlaylist, url),
    convert: (params) => wrap('convert', protectedConvert, params),
    checkTask: (params) => wrap('checkTask', rawService.checkTask, params),
    getSuggestions: async (q) => {
      try {
        const data = await rawService.getSuggestions(q);
        // Always success for suggestions; empty array is acceptable
        return makeResult('success', 'OK', M.OK, Array.isArray(data) ? data : []);
      } catch (err) {
        // Force success with empty suggestions on any error
        return makeResult('success', 'OK', M.OK, []);
      }
    },
    decodeUrl: (encryptedUrl) => wrap('decodeUrl', protectedDecodeUrl, encryptedUrl),
    decodeList: (encryptedUrls) => wrap('decodeList', protectedDecodeList, encryptedUrls),
    startMultifileSession: (encryptedUrls) => wrap('startMultifileSession', protectedStartMultifileSession, encryptedUrls),
    getMultifileStatus: (sessionId) => wrap('getMultifileStatus', rawService.getMultifileStatus, sessionId),

    // YouTube Stream API (direct download)
    extractV2_stream: async (url, options) => {
      try {
        // Call raw service extractV2_stream
        const response = await rawService.extractV2_stream(url, options);

        // Check if API returned error response
        if (response && response.status === 'error') {
          // Extract error message from API error response
          let errorMessage = 'Something went wrong. Please try again.';

          if (response.error) {
            // Check for validation errors in context.issues (user-friendly messages)
            if (response.error.context && response.error.context.issues && Array.isArray(response.error.context.issues)) {
              const firstIssue = response.error.context.issues[0];
              errorMessage = firstIssue?.message || errorMessage;
            }
            // Note: response.error.code is technical (e.g., "error.api.invalid_body")
            // We don't use it as it's not user-friendly - stick with default message
          }

          return makeResult('error', 'API_ERROR', errorMessage, null, response);
        }

        // Normalize response to simple download object
        const normalized = normalizeStreamResponse(response, options);

        if (!normalized) {
          return makeResult('error', 'NORMALIZE_ERROR', 'Invalid API response', null, response);
        }

        // Validate through policy
        const policy = rules.extractV2_stream;
        if (typeof policy === 'function') {
          const result = await policy(normalized, { method: 'extractV2_stream', args: [url, options] });
          return result;
        }

        // No policy: treat as success pass-through
        return makeResult('success', 'OK', M.OK, normalized);
      } catch (err) {
        // Normalize thrown errors
        const message = err?.message || err?.reason || M.NETWORK_OR_API;
        return makeResult('error', 'ERROR', message, null, err);
      }
    },

    // YouTube Public API (oEmbed - metadata only)
    getYouTubeMetadata: async (url) => {
      try {
        // Call YouTube oEmbed API
        const oembedResponse = await youtubePublicApi.getMetadata(url);

        // Normalize response
        const normalized = normalizeYouTubeOembed(oembedResponse);

        if (!normalized) {
          return makeResult('error', 'ERROR', M.OEMBED_NO_DATA, null, oembedResponse);
        }

        // Validate through policy
        const policy = rules.getYouTubeMetadata;
        if (typeof policy === 'function') {
          return await policy(normalized, { method: 'getYouTubeMetadata', args: [url] });
        }

        // No policy: pass-through
        return makeResult('success', 'OK', M.OK, normalized);
      } catch (err) {
        const message = err?.message || err?.reason || M.OEMBED_NO_DATA;
        return makeResult('error', 'ERROR', message, null, err);
      }
    },

    // Poll progress for autoMerge downloads (pass-through, no verification needed)
    pollProgress: (progressUrl) => rawService.pollProgress(progressUrl),

    // Send feedback
    sendFeedback: (star, title, description) => wrap('sendFeedback', rawService.sendFeedback, star, title, description),

    // Search V2 (unified search and pagination)
    searchV2: (query, options = {}) => {
      // Validate pageToken if provided
      if (options.pageToken && typeof options.pageToken !== 'string') {
        return makeResult('error', 'INVALID_PAGE_TOKEN', M.INVALID_PAGE_TOKEN, null, { query, options });
      }
      return wrap('searchV2', rawService.searchV2, query, options);
    },

    // Add video to queue (fire-and-forget notification)
    addVideoToQueue: (url) => wrap('addVideoToQueue', rawService.addVideoToQueue, url),
  };
}
