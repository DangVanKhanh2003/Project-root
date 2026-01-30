/**
 * Retry Helper - Auto retry for API calls with exponential backoff
 *
 * Based on ytmp3.gg retry pattern:
 * - Auto retry silently (user không biết)
 * - Exponential backoff delays
 * - Track consecutive errors
 */

const LOG_PREFIX = '[RetryHelper]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  delays: readonly number[]; // Array of delays in ms: [1000, 2000] = 1s, 2s
  retryOnError?: (error: any) => boolean; // Custom function to decide if should retry
}

/**
 * Default retry configs for different operations
 */
export const RETRY_CONFIGS = {
  // Extracting phase (API calls to get download URL)
  extracting: {
    maxRetries: 10, // Max retries matching the delays array length
    // Custom progressive delays as requested:
    // [1s, 1s, 3s, 5s, 6s, 7s, 8s, 15s, 15s, 20s]
    delays: [1000, 1000, 3000, 5000, 6000, 7000, 8000, 15000, 15000, 20000],
    retryOnError: (error: any) => {
      // Retry ALL errors except user cancellation
      if (error.name === 'AbortError') return false; // User cancelled - don't retry
      return true; // Retry everything else (network, 5xx, 4xx, API errors)
    }
  },

  // Polling phase (checking progress)
  polling: {
    maxConsecutiveErrors: 10, // Increased from 5 to 10 to match ytmp3.gg resilience
    // Progressive delays for polling retries: [1s, 1s, 1s, 1s, 1s, 2s, 2s, 3s, 3s, 4s]
    delays: [1000, 1000, 1000, 1000, 1000, 2000, 2000, 3000, 3000, 4000], 
    retryDelay: 0, // Fallback if delays array usage is not implemented
    retryOnTimeout: true, // Timeout is NOT an error - continue polling
  }
} as const;

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async functions
 * Auto retries with exponential backoff on failure
 *
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @returns Result from fn or throws last error
 *
 * @example
 * const result = await retryWithBackoff(
 *   () => api.downloadYouTube(request, signal),
 *   RETRY_CONFIGS.extracting
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const { maxRetries, retryOnError } = config;
  let lastError: any = null;

  log(`🔄 Starting retry logic with maxRetries=${maxRetries}`);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      log(`📡 Attempt ${attempt + 1}/${maxRetries + 1}...`);

      // Execute function immediately (no delay)
      const result = await fn();

      // Success
      log(`✅ Attempt ${attempt + 1} succeeded!`);
      if (attempt > 0) {
        log(`✅ Retry succeeded on attempt ${attempt + 1}`);
      }
      return result;

    } catch (error) {
      lastError = error;
      log(`❌ Attempt ${attempt + 1} failed with error:`, error);

      // Check if we should retry this error
      const shouldRetry = retryOnError ? retryOnError(error) : true;

      if (!shouldRetry) {
        log(`❌ Error not retryable (user cancelled or specific condition):`, error);
        throw error;
      }

      // If last attempt, throw error
      if (attempt === maxRetries) {
        log(`❌ Max retries (${maxRetries}) exceeded. Giving up.`);
        throw error;
      }

      // Log retry info
      if (config.delays && config.delays.length > 0) {
        // Use delay from config (or last delay if index out of bounds, though maxRetries should match)
        const delay = config.delays[attempt] || config.delays[config.delays.length - 1] || 1000;
        log(`⚠️ Will retry after ${delay}ms... (next attempt: ${attempt + 2}/${maxRetries + 1})`);
        await sleep(delay);
      } else {
        log(`⚠️ Will retry IMMEDIATELY (next attempt: ${attempt + 2}/${maxRetries + 1})...`);
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Check if error is a timeout error
 * Timeout errors should NOT be counted as errors in polling
 */
export function isTimeoutError(error: any): boolean {
  return (
    error?.name === 'AbortError' ||
    error?.error?.name === 'AbortError' ||
    error?.name === 'TimeoutError' ||
    error?.code === 'ECONNABORTED'
  );
}

/**
 * Check if error is a network error (no response from server)
 */
export function isNetworkError(error: any): boolean {
  // No status code = network error (DNS, connection refused, etc.)
  return !error.status && !error.ok;
}

/**
 * Check if error is retryable (5xx server errors or network errors)
 */
export function isRetryableError(error: any): boolean {
  // User cancelled - don't retry
  if (error.name === 'AbortError') return false;

  // 5xx server errors - retry
  if (error.status && error.status >= 500) return true;

  // Network errors - retry
  if (isNetworkError(error)) return true;

  // Other errors (4xx, etc.) - don't retry
  return false;
}
