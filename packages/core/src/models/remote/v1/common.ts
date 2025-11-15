/**
 * API v1 Common Types
 * Shared response wrappers and error types for all v1 endpoints
 */

import { ApiV1StatusType } from '../constants';

/**
 * Standard v1 API success response wrapper
 * All v1 endpoints return this structure
 */
export interface ApiV1SuccessResponse<T> {
  success: true;
  data: {
    status: 'ok';
  } & T;
  meta: Record<string, unknown>;
  jwt?: string;
}

/**
 * Standard v1 API error response
 */
export interface ApiV1ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  meta: Record<string, unknown>;
  jwt?: string;
  data: {
    status: 'error';
    reason: string;
    message: string;
  };
}

/**
 * Union type for any v1 response
 */
export type ApiV1Response<T> = ApiV1SuccessResponse<T> | ApiV1ErrorResponse;
