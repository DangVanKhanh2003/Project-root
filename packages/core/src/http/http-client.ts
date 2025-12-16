/**
 * HTTP Client Implementation
 * Modern HTTP client using Fetch API with TypeScript
 */

import type {
  IHttpClient,
  HttpClientConfig,
  RequestOptions,
} from './http-client.interface';
import {
  ApiError,
  NetworkError,
  TimeoutError,
  CancellationError,
} from './http-error';

/**
 * Default error message when parsing fails
 */
const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

/**
 * Parse error message from response
 * Attempts to extract user-friendly error message from various response formats
 */
async function parseErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const json = await response.json();

      // Try various common error message paths
      return (
        json?.message ||
        json?.error?.message ||
        json?.error?.code ||
        json?.data?.message ||
        json?.data?.reason ||
        fallback
      );
    }

    // Try to get text response
    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

/**
 * HTTP Client Class
 * Implements IHttpClient interface using Fetch API
 */
export class HttpClient implements IHttpClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultTimeout = config.timeout || 30000; // 30 seconds default
    this.defaultHeaders = config.defaultHeaders || {};
  }

  /**
   * Make an HTTP request
   */
  async request<T = unknown>(options: RequestOptions): Promise<T> {
    const method = (options.method || 'POST').toUpperCase();
    const data = options.data || {};

    // ✅ Create AbortController for timeout
    const controller = new AbortController();
    const timeout = options.timeout || this.defaultTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // ✅ Support external AbortSignal (user cancellation)
    if (options.signal) {
      // Check if already aborted
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        throw new CancellationError('Request cancelled by user');
      }

      // Listen to external abort signal
      options.signal.addEventListener(
        'abort',
        () => {
          controller.abort();
        },
        { once: true }
      );
    }

    // Build full URL
    let url = this.buildUrl(options.url);

    // Setup fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        ...this.defaultHeaders,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    };

    // Handle request body
    if (method !== 'GET' && method !== 'HEAD') {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'application/json',
      };
      fetchOptions.body = JSON.stringify(data);
    } else {
      // For GET/HEAD requests, append data as URL search params
      const params = new URLSearchParams(
        data as Record<string, string>
      );
      const queryString = params.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    try {
      // Make the request
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const message = await parseErrorMessage(response, DEFAULT_ERROR_MESSAGE);
        throw new ApiError(
          message,
          response.status,
          response.statusText,
          response
        );
      }

      // Parse response
      const responseData = await response.json();

      // ✅ Handle API "hidden failures" (HTTP 200 but operation failed)
      const isHiddenFailure =
        responseData.mess ||
        (responseData.data && responseData.data.fail === 1) ||
        responseData.c_status === 'FAILED';

      if (isHiddenFailure) {
        const message =
          responseData.mess ||
          (responseData.data && responseData.data.reason) ||
          'An unknown API error occurred.';
        throw new ApiError(message, 0, 'Hidden Failure', responseData);
      }

      // ✅ Handle standard API-level errors
      if (responseData.status === 'error') {
        const message =
          responseData.message ||
          responseData.error?.message ||
          responseData.error?.code ||
          'An unknown API error occurred.';
        throw new ApiError(
          message,
          0,
          'API Error',
          responseData
        );
      }

      // Return successful response
      return responseData as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle AbortError (timeout or cancellation)
      if (error instanceof Error && error.name === 'AbortError') {
        // Check if it was external cancellation
        if (options.signal?.aborted) {
          throw new CancellationError();
        }
        // Otherwise it was timeout
        throw new TimeoutError(
          `Request timeout after ${timeout}ms`,
          timeout
        );
      }

      // Re-throw our custom errors
      if (
        error instanceof ApiError ||
        error instanceof NetworkError ||
        error instanceof TimeoutError ||
        error instanceof CancellationError
      ) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new NetworkError('Network request failed', error);
      }

      // Handle unexpected errors
      throw new NetworkError(
        error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
        error
      );
    }
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    options?: Omit<RequestOptions, 'method' | 'url' | 'data'>
  ): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      data: params,
      ...options,
    });
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    options?: Omit<RequestOptions, 'method' | 'url' | 'data'>
  ): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...options,
    });
  }

  /**
   * Build full URL from endpoint path
   */
  private buildUrl(endpoint: string): string {
    // Support both relative paths and full URLs
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint; // Full URL - use as-is
    }

    // Relative path - concat with base URL
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }
}

/**
 * Create HTTP Client instance
 * Factory function for creating configured HTTP client
 */
export function createHttpClient(config: HttpClientConfig): IHttpClient {
  return new HttpClient(config);
}
