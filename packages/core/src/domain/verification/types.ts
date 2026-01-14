/**
 * Domain Layer Types
 * Verification and result structures
 */

/**
 * Verification status
 */
export type VerificationStatus = 'success' | 'warning' | 'error';

/**
 * Verification code
 * Standard codes used across all verifiers
 */
export type VerificationCode =
  | 'OK'                    // Success
  | 'EMPTY_RESULTS'         // Warning: No results found
  | 'PARTIAL_SUCCESS'       // Warning: Some items failed
  | 'TASK_NOT_READY'        // Warning: Task still processing
  | 'ERROR'                 // Generic error
  | 'NETWORK_ERROR'         // Network/API error
  | 'INVALID_INPUT'         // Invalid parameters
  | 'CAPTCHA_REQUIRED'      // CAPTCHA verification needed
  | 'RATE_LIMITED'          // Rate limit exceeded
  | 'NOT_FOUND'             // Resource not found
  | 'VALIDATION_ERROR';     // Validation failed

/**
 * Verified Result
 * Unified result envelope returned by domain layer
 */
export interface VerifiedResult<T = any> {
  /**
   * Success flag - true if status is 'success'
   */
  ok: boolean;

  /**
   * Verification status
   */
  status: VerificationStatus;

  /**
   * Verification code
   */
  code: VerificationCode;

  /**
   * Human-readable message
   */
  message: string;

  /**
   * Verified data (null on error)
   */
  data: T | null;

  /**
   * Raw response (for debugging)
   */
  raw?: any;
}

/**
 * Verification Policy
 * Function that validates a response and returns a verified result
 */
export interface VerificationPolicy<TInput = any, TOutput = any> {
  (payload: TInput, context?: any): Promise<VerifiedResult<TOutput>> | VerifiedResult<TOutput>;
}

/**
 * Verification Context
 * Additional context passed to policies
 */
export interface VerificationContext {
  /**
   * Original request parameters
   */
  request?: any;

  /**
   * Service name
   */
  service?: string;

  /**
   * Operation name
   */
  operation?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}
