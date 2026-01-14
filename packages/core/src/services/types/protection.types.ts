/**
 * Protection Types
 * Types for JWT and CAPTCHA protection payloads
 */

import type { CaptchaProviderType } from '../../models/remote/constants';

/**
 * CAPTCHA protection payload
 */
export interface CaptchaPayload {
  /**
   * CAPTCHA token from provider
   */
  token: string;

  /**
   * CAPTCHA provider type
   * @default 'recaptcha'
   */
  provider?: CaptchaProviderType | string;

  /**
   * Alias for provider (some APIs use 'type')
   */
  type?: string;
}

/**
 * Protection payload for protected API endpoints
 * Either JWT or CAPTCHA token must be provided
 */
export interface ProtectionPayload {
  /**
   * JWT token for authenticated requests
   */
  jwt?: string;

  /**
   * CAPTCHA token for unprotected requests
   */
  captcha?: CaptchaPayload;
}
