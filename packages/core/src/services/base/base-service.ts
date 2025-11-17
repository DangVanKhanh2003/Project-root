/**
 * Base Service Abstract Class
 * All service implementations MUST extend this base
 * Provides centralized request/response handling with verification control
 */

import type { IHttpClient } from '../../http/http-client.interface';
import type { ApiConfig } from '../../config/api-config.interface';
import type { ProtectionPayload } from '../types/protection.types';

// Re-export ProtectionPayload for convenience
export type { ProtectionPayload } from '../types/protection.types';

/**
 * Base request options for all API calls
 */
export interface BaseRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * JWT callback type
 */
export type JwtCallback = (jwt: string) => void;

/**
 * Verification configuration
 */
export interface VerificationConfig {
  /**
   * Enable/disable verification for all requests
   * Default: false
   */
  enabled: boolean;

  /**
   * Verification policy name (for domain layer)
   * Will be used when verifier is implemented in Phase 2D
   */
  policy?: string;
}

/**
 * Abstract Base Service
 * All service implementations MUST extend this class
 *
 * Responsibilities:
 * - Centralized HTTP request handling
 * - Automatic JWT extraction and storage
 * - Protection payload handling (JWT/CAPTCHA)
 * - Verification flag control for domain layer
 * - Prevent direct access to httpClient from implementations
 */
export abstract class BaseService {
  /**
   * HTTP client instance (protected - only accessible by subclasses)
   */
  protected readonly httpClient: IHttpClient;

  /**
   * API configuration (protected - only accessible by subclasses)
   */
  protected readonly config: ApiConfig;

  /**
   * Internal JWT storage (DEPRECATED - will be removed)
   * JWT handling moved to Domain Layer
   * @deprecated Use Domain Layer for JWT management
   */
  protected internalJwt: string | null = null;

  /**
   * Verification configuration
   */
  protected verificationConfig: VerificationConfig = {
    enabled: false,
  };

  /**
   * Constructor
   *
   * @param httpClient - HTTP client instance
   * @param config - API configuration
   */
  constructor(
    httpClient: IHttpClient,
    config: ApiConfig
  ) {
    this.httpClient = httpClient;
    this.config = config;
  }

  /**
   * Enable/disable verification for all requests
   * Can be controlled from domain layer
   *
   * @param enabled - Whether to enable verification
   * @param policy - Optional verification policy name
   */
  public setVerification(enabled: boolean, policy?: string): void {
    this.verificationConfig = { enabled, policy };
  }

  /**
   * Check if verification is enabled
   */
  public isVerificationEnabled(): boolean {
    return this.verificationConfig.enabled;
  }

  /**
   * Build protection headers from JWT
   *
   * @param protectionPayload - Protection payload
   * @returns Headers with Authorization if JWT present
   */
  protected buildProtectionHeaders(
    protectionPayload?: ProtectionPayload
  ): Record<string, string> {
    const headers: Record<string, string> = {};

    if (protectionPayload?.jwt) {
      headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    }

    return headers;
  }

  /**
   * Add CAPTCHA protection to request data
   * Only applies if JWT is not present (JWT takes precedence)
   *
   * @param data - Request data
   * @param protectionPayload - Protection payload
   * @returns Data with CAPTCHA fields if applicable
   */
  protected addProtectionToData(
    data: Record<string, unknown>,
    protectionPayload?: ProtectionPayload
  ): Record<string, unknown> {
    console.log('🔧 [addProtectionToData] Input data:', data);
    console.log('🔧 [addProtectionToData] Protection payload:', protectionPayload);

    // JWT takes precedence over CAPTCHA
    if (protectionPayload?.jwt) {
      console.log('🔧 [addProtectionToData] JWT found, skipping CAPTCHA injection');
      return data;
    }

    // Add CAPTCHA if provided
    if (protectionPayload?.captcha) {
      const result = {
        ...data,
        captcha_token: protectionPayload.captcha.token,
        provider: protectionPayload.captcha.type
          || protectionPayload.captcha.provider
          || 'recaptcha',
      };
      console.log('🔧 [addProtectionToData] CAPTCHA injected, result:', result);
      return result;
    }

    console.log('🔧 [addProtectionToData] No protection, returning original data');
    return data;
  }

  /**
   * Build internal JWT headers
   * Used for subsequent requests that need stored JWT
   *
   * @returns Headers with Authorization using internal JWT
   */
  protected buildInternalJwtHeaders(): Record<string, string> {
    if (this.internalJwt) {
      return { 'Authorization': `Bearer ${this.internalJwt}` };
    }
    return {};
  }

  /**
   * NOTE: JWT handling has been REMOVED from BaseService
   * JWT extraction and storage will be handled by Domain Layer (Verifier)
   *
   * BaseService is now PURE HTTP TRANSPORT - no business logic
   * See Phase 2D: Domain Layer implementation for JWT/CAPTCHA handling
   */

  /**
   * Unwrap simple API response
   * Handles single-level nesting: { data: {...} }
   *
   * @param response - API response
   * @returns Unwrapped data
   */
  protected unwrapSimpleResponse<T>(response: unknown): T {
    const data = response as any;
    return (data?.data || data) as T;
  }

  /**
   * Unwrap nested API response
   * Handles multiple nesting levels:
   * - { success: true, data: {...} }
   * - { status: 'ok', data: {...} }
   *
   * @param response - API response
   * @returns Unwrapped data
   */
  protected unwrapNestedResponse<T>(response: unknown): T {
    let data = response as any;

    // Unwrap { success: true, data: {...} }
    if (data && data.success && data.data) {
      data = data.data;
    }

    // Unwrap { status: 'ok', data: {...} }
    if (data && data.status === 'ok' && data.data) {
      data = data.data;
    }

    return data as T;
  }

  /**
   * Make protected HTTP request
   * ALL service implementations MUST use this method instead of httpClient directly
   *
   * This method (PURE TRANSPORT):
   * 1. Builds protection headers (JWT)
   * 2. Adds CAPTCHA to data if needed
   * 3. Makes HTTP request
   * 4. Returns RAW response (Domain Layer will handle JWT/verification)
   *
   * @param options - Request options
   * @param protectionPayload - Optional protection payload (JWT/CAPTCHA)
   * @returns Raw API response (Domain Layer will process)
   *
   * @example
   * // In service implementation
   * const response = await this.makeRequest({
   *   method: 'POST',
   *   url: API_ENDPOINTS.CONVERT,
   *   data: { vid: '123', key: 'abc' },
   *   timeout: getTimeout(this.config, 'convert')
   * }, protectionPayload);
   * // response may contain jwt field - Domain Layer will handle it
   */
  protected async makeRequest<TResponse = any>(
    options: BaseRequestOptions,
    protectionPayload?: ProtectionPayload
  ): Promise<TResponse> {
    const {
      method,
      url,
      data = {},
      headers: customHeaders = {},
      timeout,
      signal,
    } = options;

    console.log('🌐 [BaseService.makeRequest] URL:', url);
    console.log('🌐 [BaseService.makeRequest] Original data:', data);
    console.log('🌐 [BaseService.makeRequest] Protection payload:', protectionPayload);

    // Build headers with protection
    const protectionHeaders = this.buildProtectionHeaders(protectionPayload);
    const headers = { ...protectionHeaders, ...customHeaders };

    // Add CAPTCHA to data if needed
    const requestData = this.addProtectionToData(data, protectionPayload);
    console.log('🌐 [BaseService.makeRequest] Request data AFTER addProtectionToData:', requestData);

    // Make HTTP request through httpClient
    const response = await this.httpClient.request<TResponse>({
      method,
      url,
      data: requestData,
      headers,
      timeout,
      signal,
    });

    console.log('🌐 [BaseService.makeRequest] RAW HTTP Response:', response);

    // Return raw response - Domain Layer will handle:
    // - JWT extraction and storage
    // - Response verification
    // - CAPTCHA logic
    return response;
  }

  /**
   * Make request with internal JWT
   * Convenience method for requests that need stored JWT
   *
   * @param options - Request options
   * @returns API response
   *
   * @example
   * // In service implementation
   * const response = await this.makeRequestWithInternalJwt({
   *   method: 'GET',
   *   url: API_ENDPOINTS.CHECK_TASK,
   *   data: { vid, b_id }
   * });
   */
  protected async makeRequestWithInternalJwt<TResponse = any>(
    options: BaseRequestOptions
  ): Promise<TResponse> {
    const { headers: customHeaders = {}, ...restOptions } = options;

    // Merge internal JWT headers with custom headers
    const headers = {
      ...this.buildInternalJwtHeaders(),
      ...customHeaders,
    };

    return this.makeRequest<TResponse>(
      { ...restOptions, headers },
      undefined // No protection payload needed, using internal JWT
    );
  }

  /**
   * Verify response through domain layer
   * Will be implemented in Phase 2D when verifier.js is ported
   *
   * @param response - API response
   * @param policy - Verification policy name
   * @returns Verified response
   */
  // protected async verifyResponse<T>(response: T, policy?: string): Promise<T> {
  //   // TODO: Phase 2D implementation
  //   // - Check response against policy rules
  //   // - Return verified result with status (success/warning/error)
  //   return response;
  // }
}
