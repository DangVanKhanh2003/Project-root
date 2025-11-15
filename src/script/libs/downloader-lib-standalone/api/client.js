import { parseErrorMessage, DEFAULT_ERROR_MESSAGE } from '../utils/common.js';

/**
 * Creates a modern HTTP client using the fetch API for API v2.
 * @param {object} config - Configuration for the client.
 * @param {string} [config.apiBaseUrl='/api/v1'] - The base URL for API requests.
 * @param {number} [config.timeout=15000] - The request timeout in milliseconds.
 * @returns {object} An object with a `request` method.
 */
export function createClient(config) {
  const settings = {
    apiBaseUrl: config.apiBaseUrl || '/api/v1',
    timeout: config.timeout || 1800000, // 30 minutes
  };

  /**
   * Makes an HTTP request using fetch.
   * @param {object} options - Request options.
   * @param {string} options.url - The endpoint path (e.g., '/extract').
   * @param {AbortSignal} [options.signal] - External AbortSignal to cancel request
   * @returns {Promise<any>} A promise that resolves with the response data.
   */
  async function request(options = {}) {
    const method = (options.method || 'POST').toUpperCase();
    const data = { ...(options.data || options.payload || {}) };

    // ✅ PHASE 2: Support external AbortSignal
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || settings.timeout);

    // If external signal provided, listen to it and abort our controller
    if (options.signal) {

      // Check if already aborted
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        throw { status: 0, message: 'Request cancelled by user', reason: 'cancelled' };
      }

      options.signal.addEventListener('abort', () => {
        controller.abort();
      }, { once: true });
    } 
    // Support both relative paths and full URLs
    let url = (options.url.startsWith('http://') || options.url.startsWith('https://'))
      ? options.url  // Full URL - use as-is
      : settings.apiBaseUrl + options.url;  // Relative path - concat with base

    const fetchOptions = {
      method,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    };

    if (method !== 'GET' && method !== 'HEAD') {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(data);
    } else {
      // For GET requests, append data as URL search parameters.
      const params = new URLSearchParams(data);
      const queryString = params.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }


    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);


      if (!response.ok) {
        const message = await parseErrorMessage(response, DEFAULT_ERROR_MESSAGE);
        throw { status: response.status, message, response };
      }

      const responseData = await response.json();

      // Handle API v2 "hidden failures" (HTTP 200 but operation failed)
      const isHiddenFailure = responseData.mess || (responseData.data && responseData.data.fail === 1) || responseData.c_status === 'FAILED';
      if (isHiddenFailure) {
          const message = responseData.mess || (responseData.data && responseData.data.reason) || 'An unknown API error occurred.';
          throw { status: 0, message, reason: message, responseData };
      }

      // Handle standard API-level errors
      if (responseData.status === 'error') {
        const message = responseData.message || 'An unknown API error occurred.';
        throw { status: 0, message, reason: responseData.reason, responseData };
      }

      // For successful responses, return the full response object
      // The service layer is responsible for normalization and extracting the data.
      return responseData;

    } catch (error) {
      clearTimeout(timeoutId);

      // ✅ PHASE 2: Handle AbortError specially
      if (error.name === 'AbortError') {
        const wasExternalAbort = options.signal && options.signal.aborted;
        const message = wasExternalAbort ? 'Request cancelled by user' : 'Request timeout';
        throw { status: 0, message, reason: wasExternalAbort ? 'cancelled' : 'timeout' };
      }

      // Re-throw custom errors or create a new one for generic network errors
      if (error.status !== undefined) {
        throw error;
      }
      throw { status: -1, message: error.message || 'Network request failed', error };
    }
  }

  return { request };
}
