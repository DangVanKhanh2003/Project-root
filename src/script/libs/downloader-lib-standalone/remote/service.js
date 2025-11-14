import * as utils from './utils.js';
import * as normalizers from './normalizers.js';
import { createClient } from './httpClient.js';
import { saveJwt } from '../../../utils/jwt.js';
import { API_ENDPOINTS, MULTIFILE_ENDPOINTS, SEARCH_V2_CONFIG, QUEUE_ENDPOINTS } from './api-endpoints.js';
import { getV2ApiUrl, getYouTubeStreamApiEndpoint, getQueueApiUrl } from '../../../environment.js';
import { extractYouTubeVideoId } from './youtube-public-api.js';

const REQUEST_TIMEOUTS = {
  extract: 200000,
  extractNonEncode: 200000,
  searchTitle: 20000,
  playlist: 25000,
  convert: 20000,
  checkTask: 300000000,
  suggest: 7000,
  decode: 60000,
  decodeList: 60000,
  multifileStart: 15000,
  multifileStatus: 10000,
  extractV2_stream: 300000000,
  pollProgress: 10000000,
  feedback: 10000,
  searchV2: 15000,
  addQueue: 10000,
};

/**
 * Creates the main downloader service for API v2.
 * @param {object} config - Service configuration.
 * @returns {object} An object containing all the service methods.
 */
export function createService(config = {}) {
  let internalJwt = null;

  const settings = {
    timeout: config.timeout || 15000,
  };

  const http = createClient({
    apiBaseUrl: config.apiBaseUrl, // Optional override
    timeout: settings.timeout,
  });

  // Separate HTTP client for YouTube Stream API
  const youtubeStreamHttp = createClient({
    apiBaseUrl: getV2ApiUrl(),
    timeout: REQUEST_TIMEOUTS.extractV2_stream,
  });

  // Separate HTTP client for Search V2 API
  const searchV2Http = createClient({
    apiBaseUrl: SEARCH_V2_CONFIG.BASE_URL,
    timeout: REQUEST_TIMEOUTS.searchV2,
  });

  // Separate HTTP client for Queue API
  const queueHttp = createClient({
    apiBaseUrl: getQueueApiUrl(),
    timeout: REQUEST_TIMEOUTS.addQueue,
  });

  function setJwt(token) {
    if (token) {
        internalJwt = token;
    }
  }

  /**
   * 1. Extract media information from a URL.
   * Replaces the old `search` method.
   */
  async function extractMedia(url, protectionPayload = {}) {

    const headers = {};
    if (protectionPayload.jwt) {
        headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    }

    const response = await http.request({
      method: 'POST',
      url: API_ENDPOINTS.EXTRACT,
      data: { url: utils.sanitise(url) },
      headers: headers,
      timeout: REQUEST_TIMEOUTS.extract,
    });

    if (response.jwt) {
        saveJwt(response.jwt);
    }


    // Handle different API response formats
    let dataToNormalize = response;
    if (response && response.success && response.data) {
      dataToNormalize = response.data;

      // Check for double-nested data structure
      if (dataToNormalize && dataToNormalize.status === 'ok' && dataToNormalize.data) {
        dataToNormalize = dataToNormalize.data;
      }
    } else if (response && response.status === 'ok' && response.data) {
      dataToNormalize = response.data;
    }

    
    const normalized = normalizers.normalizeVideoDetail(dataToNormalize);

    return normalized;
  }

  /**
   * WHY: Extract media với direct download URLs, không cần decrypt step riêng - giảm từ 2 API calls xuống 1
   * CONTRACT: url:string, protectionPayload?:{jwt?:string, captcha?:{token:string, type:string}} → Promise<{meta, formats:{video[], audio[]}, gallery?}> | throws
   * PRE: Bắt buộc JWT hoặc Captcha token trong protectionPayload; network access; API endpoint /extract-non-encode available
   * POST: JWT tự động saved vào localStorage nếu có trong response; không modify other state; URLs trong response là direct download links
   * EDGE: Invalid/expired JWT → wrapped layer auto-fallback to captcha challenge; network timeout → throw after 20s; invalid URL → API returns error
   * USAGE: await extractMediaDirect("https://tiktok.com/@user/video/123", {jwt: "eyJhbGc..."});
   */
  async function extractMediaDirect(url, protectionPayload = {}) {
    
    const headers = {};
    const data = { url: utils.sanitise(url) };

    if (protectionPayload.jwt) {
        headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    } else if (protectionPayload.captcha) {
        data.captcha_token = protectionPayload.captcha.token;
        data.provider = protectionPayload.captcha.type || protectionPayload.captcha.provider || 'recaptcha';
    }

    const response = await http.request({
      method: 'POST',
      url: API_ENDPOINTS.EXTRACT_NON_ENCODE,
      data: data,
      headers: headers,
      timeout: REQUEST_TIMEOUTS.extractNonEncode,
    });

    if (response.jwt) {
        saveJwt(response.jwt);
    }


    let dataToNormalize = response;
    if (response && response.success && response.data) {
      dataToNormalize = response.data;

      if (dataToNormalize && dataToNormalize.status === 'ok' && dataToNormalize.data) {
        dataToNormalize = dataToNormalize.data;
      }
    } else if (response && response.status === 'ok' && response.data) {
      dataToNormalize = response.data;
    }


    const normalized = normalizers.normalizeVideoDetail(dataToNormalize);

    return normalized;
  }

  /**
   * 2. Search videos by keyword/title.
   */
  async function searchTitle(keyword) {

    const response = await http.request({
      method: 'GET',
      url: API_ENDPOINTS.SEARCH_TITLE,
      data: { keyword: utils.sanitise(keyword) },
      headers: {},
      timeout: REQUEST_TIMEOUTS.searchTitle,
    });

    const normalized = normalizers.normalizeSearchResults(response.data || response);

    return normalized;
  }

  /**
   * 3. Extract all videos from a playlist URL.
   */
  async function extractPlaylist(url) {
    const response = await http.request({
        method: 'POST',
        url: API_ENDPOINTS.PLAYLIST,
        data: { url: utils.sanitise(url) },
        headers: {},
        timeout: REQUEST_TIMEOUTS.playlist,
    });

    return normalizers.normalizePlaylist(response.data || response);
  }

  /**
   * 4. Convert video format (e.g., for YouTube).
   */
  async function convert(params, protectionPayload = {}) {
    const headers = {};
    const data = {
      vid: utils.sanitise(params.vid || ''),
      key: utils.sanitise(params.key || ''),
    };

    if (protectionPayload.jwt) {
        headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    } else if (protectionPayload.captcha) {
        data.captcha_token = protectionPayload.captcha.token;
        data.provider = protectionPayload.captcha.provider || 'recaptcha';
    }

    const response = await http.request({
      method: 'POST',
      url: API_ENDPOINTS.CONVERT,
      data: data,
      headers: headers,
      timeout: REQUEST_TIMEOUTS.convert,
    });

    if (response.jwt) {
        saveJwt(response.jwt);
    }

    return normalizers.normalizeTaskResponse(response.data || response);
  }

  /**
   * 5. Check conversion task status.
   */
  async function checkTask(params) {
    const response = await http.request({
      method: 'GET',
      url: API_ENDPOINTS.CHECK_TASK,
      data: {
        vid: utils.sanitise(params.vid || ''),
        b_id: utils.sanitise(params.b_id || params.bid || params.bId || ''),
      },
      headers: { 'Authorization': internalJwt ? `Bearer ${internalJwt}` : undefined },
      timeout: REQUEST_TIMEOUTS.checkTask,
    });

    if (response.jwt) {
        setJwt(response.jwt);
    }

    return normalizers.normalizeTaskResponse(response.data || response);
  }

  /**
   * 6. Get search suggestions.
   */
  async function getSuggestions(query) {
    const response = await http.request({
      method: 'GET',
      url: API_ENDPOINTS.SUGGEST_KEYWORD,
      data: { q: utils.sanitise(query) },
      headers: {},
      timeout: REQUEST_TIMEOUTS.suggest,
    });

    const actualData = response.data || response;
    return actualData.suggestions || [];
  }

  /**
   * 7. Decode encrypted URL.
   */
  async function decodeUrl(encryptedUrl, protectionPayload = {}) {

    const headers = {};
    const data = { encrypted_url: encryptedUrl };

    if (protectionPayload.jwt) {
        headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    } else if (protectionPayload.captcha) {
        data.captcha_token = protectionPayload.captcha.token;
        data.provider = protectionPayload.captcha.provider || 'recaptcha';
    }

    const response = await http.request({
      method: 'POST',
      url: API_ENDPOINTS.DECRYPT,
      data: data,
      headers: headers,
      timeout: REQUEST_TIMEOUTS.decode,
    });

    if (response.jwt) {
        saveJwt(response.jwt);
    }


    const normalized = normalizers.normalizeDecodeResponse(response);

    return normalized;
  }

  /**
   * 8. Decode a list of encrypted URLs.
   */
  async function decodeList(encryptedUrls, protectionPayload = {}) {

    const headers = {};
    const data = { encrypted_urls: encryptedUrls };

    if (protectionPayload.jwt) {
        headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    } else if (protectionPayload.captcha) {
        data.captcha_token = protectionPayload.captcha.token;
        data.provider = protectionPayload.captcha.type || 'recaptcha';
    }

    const response = await http.request({
      method: 'POST',
      url: API_ENDPOINTS.DECRYPT_LIST,
      data: data,
      headers: headers,
      timeout: REQUEST_TIMEOUTS.decodeList,
    });

    if (response.jwt) {
        saveJwt(response.jwt);
    }


    return response; // Return as-is, verifier will handle it
  }

  /**
   * 9. Start multifile download session.
   */
  async function startMultifileSession(listUrl, protectionPayload = {}) {

    const headers = {};
    const data = { urls: listUrl };

    if (protectionPayload.jwt) {
        headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    } else if (protectionPayload.captcha) {
        data.captcha_token = protectionPayload.captcha.token;
        data.provider = protectionPayload.captcha.provider || 'recaptcha';
    }

    const response = await http.request({
      method: 'POST',
      url: MULTIFILE_ENDPOINTS.START,
      data: data,
      headers: headers,
      timeout: REQUEST_TIMEOUTS.multifileStart,
    });

    if (response.jwt) {
        saveJwt(response.jwt);
    }


    // Response format: { success: true, data: { status, session_id, stream_url, expires_at } }
    return response;
  }

  /**
   * 10. Get multifile download session status.
   */
  async function getMultifileStatus(sessionId) {

    const response = await http.request({
      method: 'GET',
      url: `${MULTIFILE_ENDPOINTS.STATUS}/${utils.sanitise(sessionId)}`,
      data: {},
      headers: { 'Authorization': internalJwt ? `Bearer ${internalJwt}` : undefined },
      timeout: REQUEST_TIMEOUTS.multifileStatus,
    });

    if (response.jwt) {
        setJwt(response.jwt);
    }


    // Response format: { success: true, data: { session_id, status, progress, stats, ... } }
    return response;
  }

  /**
   * Poll progress URL for auto-merge download status
   * @param {string} progressUrl - Full progress URL (e.g., "https://sv-190.dmate20.online/api/download/progress/request_youtube_xxx")
   * @returns {Promise<{cacheId, videoProgress, audioProgress, status, mergedUrl, filename}>}
   */
  async function pollProgress(progressUrl) {
    if (!progressUrl || typeof progressUrl !== 'string') {
      throw {
        status: 0,
        message: 'Invalid progressUrl: must be a non-empty string',
        reason: 'invalid_progress_url',
      };
    }

    // Use existing http client with full URL support (httpClient now auto-detects full URLs)
    const progressHttp = createClient({
      timeout: REQUEST_TIMEOUTS.pollProgress,
    });

    const response = await progressHttp.request({
      method: 'GET',
      url: progressUrl, // Pass full URL directly
    });

    return response;
  }

  /**
   * WHY: Extract YouTube video/audio via stream API for direct download (backend auto-merges when progressUrl is called)
   * CONTRACT: url:string, options:{downloadMode, videoQuality?, youtubeVideoContainer?, audioFormat?, audioBitrate?} → Promise<{status, url, filename, progressUrl?, size?}> | throws
   * PRE: url is valid YouTube URL; downloadMode is "video" or "audio"; video options for video mode only; audio options for audio mode only
   * POST: Returns unified response with url, progressUrl, and size fields; backend auto-merges when frontend calls progressUrl; không modify state; không cache
   * EDGE: Invalid options → throw validation error; network error → throw; API error → throw with error details
   * USAGE: await extractV2_stream("https://youtube.com/watch?v=...", {downloadMode: "video", videoQuality: "1080", youtubeVideoContainer: "mp4"});
   */
  async function extractV2_stream(url, options = {}) {
    // Validate required fields
    if (!url || typeof url !== 'string') {
      throw {
        status: 0,
        message: 'Invalid URL: URL must be a non-empty string',
        reason: 'invalid_url',
      };
    }

    if (!options.downloadMode) {
      throw {
        status: 0,
        message: 'Invalid options: downloadMode is required',
        reason: 'missing_download_mode',
      };
    }

    if (!['video', 'audio'].includes(options.downloadMode)) {
      throw {
        status: 0,
        message: 'Invalid downloadMode: must be "video" or "audio"',
        reason: 'invalid_download_mode',
      };
    }

    // Build request body based on API spec
    const requestBody = {
      url: utils.sanitise(url),
      downloadMode: options.downloadMode,
      brandName: "brandname",
    };

    // Add video-specific options
    if (options.downloadMode === 'video') {
      if (options.videoQuality) {
        requestBody.videoQuality = options.videoQuality;
      }
      if (options.youtubeVideoContainer) {
        requestBody.youtubeVideoContainer = options.youtubeVideoContainer;
      }
    }

    // Add audio-specific options
    if (options.downloadMode === 'audio') {
      if (options.audioFormat) {
        requestBody.audioFormat = options.audioFormat;
      }
      if (options.audioBitrate) {
        requestBody.audioBitrate = options.audioBitrate;
      }
    }

    // No need for autoMerge param - backend auto-merges when frontend calls progressUrl

    // Make request to YouTube Stream API
    const response = await youtubeStreamHttp.request({
      method: 'POST',
      url: getYouTubeStreamApiEndpoint(),
      data: requestBody,
      timeout: REQUEST_TIMEOUTS.extractV2_stream,
    });

    return response;
  }

  /**
   * Send user feedback to the server.
   * @param {number} star - Rating from 1 to 5 stars.
   * @param {string} title - Feedback title (optional).
   * @param {string} description - Feedback description (optional).
   * @returns {Promise<object>} Response from the API.
   */
  async function sendFeedback(star, title = '', description = '') {
    // Validate star rating
    if (typeof star !== 'number' || star < 1 || star > 5) {
      throw { status: 0, message: 'Invalid star rating. Must be between 1 and 5.' };
    }

    // Sanitize inputs
    const sanitizedTitle = title ? utils.sanitise(title.trim()) : '';
    const sanitizedDescription = description ? utils.sanitise(description.trim()) : '';

    // At least one field must be provided (validation from UI, but double-check)
    if (!sanitizedTitle && !sanitizedDescription) {
      throw { status: 0, message: 'At least one field (title or description) must be provided.' };
    }

    const response = await http.request({
      method: 'POST',
      url: API_ENDPOINTS.FEEDBACK,
      data: {
        star,
        title: sanitizedTitle,
        description: sanitizedDescription,
      },
      timeout: REQUEST_TIMEOUTS.feedback,
    });

    return response;
  }

  /**
   * Add YouTube video to extraction queue (fire-and-forget notification to server)
   * @param {string} url - YouTube URL to extract video ID from
   * @returns {Promise<boolean>} True if successfully sent to queue, false otherwise
   */
  async function addVideoToQueue(url) {
    try {
      // Extract video ID from YouTube URL
      const videoId = extractYouTubeVideoId(url);

      // Skip if video ID extraction failed
      if (!videoId) {
        return false;
      }

      // Send to queue API (fire-and-forget)
      await queueHttp.request({
        method: 'POST',
        url: QUEUE_ENDPOINTS.ADD_VIDEO_QUEUE,
        data: { videoId },
        timeout: REQUEST_TIMEOUTS.addQueue,
      });

      return true;
    } catch (error) {
      // Silent failure - log error but don't block main flow
      return false;
    }
  }

  /**
   * Search videos using YouTube Search v2 API with rich metadata and pagination
   * Handles both fresh search and pagination in single function
   * @param {string} query - Search keyword
   * @param {object} [options] - Optional parameters
   * @param {string} [options.pageToken] - For pagination (load more)
   * @param {number} [options.limit] - Number of results to return (e.g., 12 for load more)
   * @returns {Promise<object>} Normalized search results with pagination support
   */
  async function searchV2(query, options = {}) {
    const { pageToken, limit } = options;

    const params = { q: utils.sanitise(query) };
    if (pageToken) {
      params.page = pageToken;
    }
    if (limit && typeof limit === 'number' && limit > 0) {
      params.limit = limit;
    }

    const response = await searchV2Http.request({
      method: 'GET',
      url: SEARCH_V2_CONFIG.ENDPOINT,
      data: params,
      headers: {},
      timeout: REQUEST_TIMEOUTS.searchV2,
    });

    const normalized = normalizers.normalizeSearchV2Results(response);
    return normalized;
  }

  return {
    extractMedia,
    extractMediaDirect,
    searchTitle,
    extractPlaylist,
    convert,
    checkTask,
    getSuggestions,
    decodeUrl,
    decodeList,
    startMultifileSession,
    getMultifileStatus,
    extractV2_stream,
    pollProgress,
    sendFeedback,
    searchV2,
    addVideoToQueue,
  };
}
