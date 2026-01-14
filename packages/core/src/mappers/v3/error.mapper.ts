/**
 * V3 Error Mapper
 * Maps API error codes to user-friendly messages
 */

import type { V3ErrorCode } from '../../models/remote/v3';

/**
 * Error messages mapping (English)
 */
const ERROR_MESSAGES: Record<V3ErrorCode, string> = {
  INVALID_REQUEST: 'Invalid request. Please try again.',
  VALIDATION_ERROR: 'Invalid input. Please check your selection.',
  INVALID_URL: 'Invalid YouTube URL. Please enter a valid link.',
  INVALID_JOB_ID: 'Invalid job. Please try again.',
  JOB_NOT_READY: 'Video is still processing. Please wait.',
  UNAUTHORIZED: 'Session expired. Please refresh the page.',
  FORBIDDEN: 'Access denied. Please try again.',
  JOB_NOT_FOUND: 'Job not found. Please try again.',
  VIDEO_NOT_FOUND: 'Video not available or restricted.',
  AUDIO_NOT_FOUND: 'Audio track not available.',
  FILE_NOT_FOUND: 'File not found. Please try again.',
  INTERNAL_ERROR: 'Server error. Please try again later.',
  EXTRACT_FAILED: 'Failed to process video. Please try again.',
};

/**
 * Default error message for unknown errors
 */
const DEFAULT_ERROR_MESSAGE = 'An error occurred. Please try again.';

/**
 * Map V3 error code to user-friendly message
 */
export function mapErrorCodeToMessage(code: V3ErrorCode | string): string {
  return ERROR_MESSAGES[code as V3ErrorCode] || DEFAULT_ERROR_MESSAGE;
}

/**
 * Check if error code indicates a retryable error
 */
export function isRetryableError(code: V3ErrorCode | string): boolean {
  const retryableCodes: V3ErrorCode[] = [
    'INTERNAL_ERROR',
    'EXTRACT_FAILED',
    'JOB_NOT_READY',
  ];

  return retryableCodes.includes(code as V3ErrorCode);
}

/**
 * Check if error code indicates a user input error
 */
export function isUserInputError(code: V3ErrorCode | string): boolean {
  const userInputCodes: V3ErrorCode[] = [
    'INVALID_REQUEST',
    'VALIDATION_ERROR',
    'INVALID_URL',
  ];

  return userInputCodes.includes(code as V3ErrorCode);
}

/**
 * Check if error code indicates video is not available
 */
export function isVideoUnavailableError(code: V3ErrorCode | string): boolean {
  const unavailableCodes: V3ErrorCode[] = [
    'VIDEO_NOT_FOUND',
    'AUDIO_NOT_FOUND',
  ];

  return unavailableCodes.includes(code as V3ErrorCode);
}
