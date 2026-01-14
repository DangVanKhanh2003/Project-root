/**
 * HTTP Client Interface
 * Defines contract for HTTP client implementations
 */

/**
 * HTTP methods supported
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

/**
 * Request options for HTTP client
 */
export interface RequestOptions {
  /**
   * HTTP method (default: POST)
   */
  method?: HttpMethod;

  /**
   * API endpoint path (e.g., '/extract')
   * Will be appended to baseUrl
   */
  url: string;

  /**
   * Request payload (for POST, PUT, PATCH)
   * Will be JSON-stringified for non-GET requests
   */
  data?: Record<string, unknown>;

  /**
   * Request headers
   */
  headers?: Record<string, string>;

  /**
   * Request timeout in milliseconds
   * Overrides default timeout
   */
  timeout?: number;

  /**
   * External AbortSignal for request cancellation
   * Allows caller to cancel request
   */
  signal?: AbortSignal;
}

/**
 * HTTP Client configuration
 */
export interface HttpClientConfig {
  /**
   * Base URL for all requests
   * Example: 'https://api.projectA-v1.com'
   */
  baseUrl: string;

  /**
   * Default timeout for requests in milliseconds
   * Default: 15000 (15 seconds)
   */
  timeout?: number;

  /**
   * Default headers to include in all requests
   */
  defaultHeaders?: Record<string, string>;
}

/**
 * HTTP Client Interface
 * Generic interface for making HTTP requests
 */
export interface IHttpClient {
  /**
   * Make an HTTP request
   * @param options - Request options
   * @returns Promise resolving to response data
   * @throws {ApiError} When request fails
   * @throws {TimeoutError} When request times out
   * @throws {NetworkError} When network error occurs
   * @throws {CancellationError} When request is cancelled
   */
  request<T = unknown>(options: RequestOptions): Promise<T>;

  /**
   * Make a GET request
   * @param url - Endpoint path
   * @param params - Query parameters
   * @param options - Additional request options
   */
  get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    options?: Omit<RequestOptions, 'method' | 'url' | 'data'>
  ): Promise<T>;

  /**
   * Make a POST request
   * @param url - Endpoint path
   * @param data - Request payload
   * @param options - Additional request options
   */
  post<T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    options?: Omit<RequestOptions, 'method' | 'url' | 'data'>
  ): Promise<T>;
}
