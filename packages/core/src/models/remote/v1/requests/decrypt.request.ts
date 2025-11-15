/**
 * API v1 Decrypt Request Models
 */

import { CaptchaProviderType } from '../../constants';

/**
 * Decrypt single URL
 * POST /api/v1/decrypt
 *
 * Authentication via query params:
 * - provider (query): captcha provider
 * - captcha_token (query): captcha token
 * OR via Authorization header (JWT)
 */
export interface DecryptRequest {
  // Body field
  encrypted_url: string;
}

/**
 * Decrypt request with auth (combines body + query params)
 */
export interface DecryptRequestWithAuth extends DecryptRequest {
  // Query params (optional - for captcha auth)
  provider?: CaptchaProviderType;
  captcha_token?: string;
}

/**
 * Decrypt multiple URLs
 * POST /api/v1/decrypt/list
 *
 * Authentication via query params:
 * - provider (query): captcha provider
 * - captcha_token (query): captcha token
 * OR via Authorization header (JWT)
 */
export interface DecryptListRequest {
  // Body field
  encrypted_urls: string[]; // Base64 encoded encrypted URLs
}

/**
 * Decrypt list request with auth
 */
export interface DecryptListRequestWithAuth extends DecryptListRequest {
  // Query params (optional - for captcha auth)
  provider?: CaptchaProviderType;
  captcha_token?: string;
}
