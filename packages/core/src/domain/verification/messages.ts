/**
 * Verification Messages
 * Standard messages for verification results
 */

export const VERIFICATION_MESSAGES = {
  // Success messages
  OK: 'Operation completed successfully',
  CONVERSION_SUCCESS: 'Video conversion completed',
  SEARCH_SUCCESS: 'Search completed successfully',
  EXTRACT_SUCCESS: 'Media extraction completed',

  // Warning messages
  EMPTY_RESULTS: 'No results found',
  PARTIAL_SUCCESS: 'Operation partially completed with some errors',
  NO_SUGGESTIONS: 'No suggestions available',

  // Error messages
  ERROR: 'An error occurred',
  NETWORK_OR_API: 'Network or API error occurred',
  INVALID_INPUT: 'Invalid input parameters',
  CAPTCHA_REQUIRED: 'CAPTCHA verification required',
  RATE_LIMITED: 'Rate limit exceeded, please try again later',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  CONVERSION_FAILED: 'Video conversion failed',
  TASK_NOT_READY: 'Task is still processing',
  INVALID_URL: 'Invalid URL provided',
  UNSUPPORTED_PLATFORM: 'Platform not supported',
} as const;

export type MessageKey = keyof typeof VERIFICATION_MESSAGES;
