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
   * @returns {Promise<any>} A promise that resolves with the response data.
   */
  async function request(options = {}) {
    const method = (options.method || 'POST').toUpperCase();
    const data = { ...(options.data || options.payload || {}) };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || settings.timeout);

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
      // Re-throw custom errors or create a new one for generic network errors
      if (error.status !== undefined) {
        throw error;
      }
      throw { status: -1, message: error.message || 'Network request failed', error };
    }
  }

  return { request };
}
