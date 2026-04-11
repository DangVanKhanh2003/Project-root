/**
 * V3 Error Messages
 * User-friendly error messages (English)
 */

import { mapErrorCodeToMessage, isRetryableError } from '@downloader/core';

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check if it's a known error code
    const message = mapErrorCodeToMessage(error.message);
    if (message !== 'An error occurred. Please try again.') {
      return message;
    }
    return error.message;
  }

  if (typeof error === 'string') {
    return mapErrorCodeToMessage(error);
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is retryable
 */
export function canRetry(error: unknown): boolean {
  if (error instanceof Error) {
    return isRetryableError(error.message);
  }

  if (typeof error === 'string') {
    return isRetryableError(error);
  }

  return false;
}
