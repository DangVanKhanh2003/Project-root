/**
 * API v1 Convert Request Models
 */

import { CaptchaProviderType } from '../../constants';

/**
 * Convert YouTube video (Step 2)
 * POST /api/v1/convert
 *
 * Authentication via query params:
 * - provider (query): captcha provider
 * - captcha_token (query): captcha token
 * OR via Authorization header (JWT)
 */
export interface ConvertRequest {
  // Body fields
  vid: string;
  key: string;
}

/**
 * Convert request with auth (combines body + query params)
 */
export interface ConvertRequestWithAuth extends ConvertRequest {
  // Query params (optional - for captcha auth)
  provider?: CaptchaProviderType;
  captcha_token?: string;
}

/**
 * Check task status
 * GET /api/v1/check-task
 */
export interface CheckTaskRequest {
  vid: string;
  b_id: string;
}
