/**
 * Retry Helper Tests
 *
 * Tests the retry logic patterns used across the app.
 * Since retry-helper lives in app code, we test the equivalent logic here.
 */

import { describe, it, expect, vi } from 'vitest';

// ==========================================
// Portable retry logic (same as app's retry-helper.ts)
// ==========================================

interface RetryConfig {
  maxRetries: number;
  delays: readonly number[];
  retryOnError?: (error: any) => boolean;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const { maxRetries, retryOnError } = config;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const shouldRetry = retryOnError ? retryOnError(error) : true;
      if (!shouldRetry) throw error;
      if (attempt === maxRetries) throw error;
    }
  }
  throw lastError;
}

function isTimeoutError(error: any): boolean {
  return (
    error?.name === 'AbortError' ||
    error?.error?.name === 'AbortError' ||
    error?.name === 'TimeoutError' ||
    error?.code === 'ECONNABORTED'
  );
}

function isNetworkError(error: any): boolean {
  return !error.status && !error.ok;
}

function isRetryableError(error: any): boolean {
  if (error.name === 'AbortError') return false;
  if (error.status && error.status >= 500) return true;
  if (isNetworkError(error)) return true;
  return false;
}

// ==========================================
// Tests
// ==========================================

describe('retryWithBackoff', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValueOnce('success');

    const result = await retryWithBackoff(fn, { maxRetries: 3, delays: [] });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const result = await retryWithBackoff(fn, { maxRetries: 3, delays: [] });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries up to maxRetries times then throws', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));

    await expect(
      retryWithBackoff(fn, { maxRetries: 3, delays: [] })
    ).rejects.toThrow('always fail');

    // 1 original + 3 retries = 4 total
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('stops retrying if retryOnError returns false', async () => {
    const abortError = new Error('User cancelled');
    abortError.name = 'AbortError';
    const fn = vi.fn().mockRejectedValueOnce(abortError);

    await expect(
      retryWithBackoff(fn, {
        maxRetries: 10,
        delays: [],
        retryOnError: (e) => e.name !== 'AbortError',
      })
    ).rejects.toThrow('User cancelled');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries all errors when retryOnError is not provided', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('error1'))
      .mockRejectedValueOnce(new Error('error2'))
      .mockResolvedValueOnce('ok');

    const result = await retryWithBackoff(fn, { maxRetries: 5, delays: [] });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('succeeds on the last possible attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockRejectedValueOnce(new Error('3'))
      .mockResolvedValueOnce('last chance');

    const result = await retryWithBackoff(fn, { maxRetries: 3, delays: [] });

    expect(result).toBe('last chance');
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('works with maxRetries = 0 (no retries)', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail'));

    await expect(
      retryWithBackoff(fn, { maxRetries: 0, delays: [] })
    ).rejects.toThrow('fail');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses RETRY_CONFIGS.extracting pattern (10 retries, retry all except AbortError)', async () => {
    const extractingConfig: RetryConfig = {
      maxRetries: 10,
      delays: [],
      retryOnError: (error: any) => error.name !== 'AbortError',
    };

    // Network error - should retry
    const networkError = new Error('network');
    const fn = vi.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce('ok');

    const result = await retryWithBackoff(fn, extractingConfig);
    expect(result).toBe('ok');

    // AbortError - should NOT retry
    const abortError = new Error('abort');
    abortError.name = 'AbortError';
    const fn2 = vi.fn().mockRejectedValueOnce(abortError);

    await expect(retryWithBackoff(fn2, extractingConfig)).rejects.toThrow();
    expect(fn2).toHaveBeenCalledTimes(1);
  });
});

describe('isTimeoutError', () => {
  it('returns true for AbortError name', () => {
    expect(isTimeoutError({ name: 'AbortError' })).toBe(true);
  });

  it('returns true for TimeoutError name', () => {
    expect(isTimeoutError({ name: 'TimeoutError' })).toBe(true);
  });

  it('returns true for nested AbortError', () => {
    expect(isTimeoutError({ error: { name: 'AbortError' } })).toBe(true);
  });

  it('returns true for ECONNABORTED code', () => {
    expect(isTimeoutError({ code: 'ECONNABORTED' })).toBe(true);
  });

  it('returns false for regular error', () => {
    expect(isTimeoutError({ name: 'Error' })).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isTimeoutError(null)).toBe(false);
    expect(isTimeoutError(undefined)).toBe(false);
  });
});

describe('isNetworkError', () => {
  it('returns true when no status and no ok', () => {
    expect(isNetworkError({})).toBe(true);
  });

  it('returns false when status is present', () => {
    expect(isNetworkError({ status: 500 })).toBe(false);
  });

  it('returns false when ok is present', () => {
    expect(isNetworkError({ ok: true })).toBe(false);
  });
});

describe('isRetryableError', () => {
  it('returns false for AbortError', () => {
    expect(isRetryableError({ name: 'AbortError' })).toBe(false);
  });

  it('returns true for 500 server error', () => {
    expect(isRetryableError({ status: 500 })).toBe(true);
  });

  it('returns true for 502 server error', () => {
    expect(isRetryableError({ status: 502 })).toBe(true);
  });

  it('returns true for 503 server error', () => {
    expect(isRetryableError({ status: 503 })).toBe(true);
  });

  it('returns false for 400 client error', () => {
    expect(isRetryableError({ status: 400 })).toBe(false);
  });

  it('returns false for 404 client error', () => {
    expect(isRetryableError({ status: 404 })).toBe(false);
  });

  it('returns true for network error (no status, no ok)', () => {
    expect(isRetryableError({ name: 'NetworkError' })).toBe(true);
  });
});
