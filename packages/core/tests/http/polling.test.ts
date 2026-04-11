/**
 * Polling Logic Tests
 *
 * Tests the V3 polling behavior.
 * Re-implements polling locally to test in core package
 * without app-specific dependencies.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ==========================================
// Portable types (matching app types)
// ==========================================

interface StatusResponse {
  status: 'pending' | 'completed' | 'error' | 'not_found' | 'failed';
  progress: number;
  title: string;
  duration: number;
  detail?: { video: number; audio: number };
  downloadUrl?: string;
  jobError?: string;
}

interface PollingOptions {
  statusUrl: string;
  onProgress: (progress: number, detail?: { video: number; audio: number }) => void;
  onComplete: (downloadUrl: string) => void;
  onError: (error: string) => void;
  signal: AbortSignal;
}

function isTimeoutError(error: any): boolean {
  return (
    error?.name === 'AbortError' ||
    error?.error?.name === 'AbortError' ||
    error?.name === 'TimeoutError' ||
    error?.code === 'ECONNABORTED'
  );
}

// ==========================================
// Portable startPolling (matching app logic)
// ==========================================

async function startPolling(
  options: PollingOptions,
  getStatusByUrl: (url: string) => Promise<StatusResponse>,
  config: { pollingInterval: number; maxConsecutiveErrors: number }
): Promise<void> {
  const { statusUrl, onProgress, onComplete, onError, signal } = options;
  const { pollingInterval, maxConsecutiveErrors } = config;

  let consecutiveErrors = 0;

  while (!signal.aborted) {
    try {
      const status = await getStatusByUrl(statusUrl);
      consecutiveErrors = 0;

      switch (status.status) {
        case 'pending':
          onProgress(
            status.progress,
            status.detail ? { video: status.detail.video, audio: status.detail.audio } : undefined
          );
          break;

        case 'completed':
          if (status.downloadUrl) {
            onProgress(100);
            onComplete(status.downloadUrl);
            return;
          } else {
            onError('Completed but no download URL');
            return;
          }

        case 'error':
        case 'not_found':
        case 'failed':
          onError(status.jobError || 'Conversion failed');
          return;

        default:
          break;
      }
    } catch (error) {
      if (signal.aborted) return;

      if (isTimeoutError(error)) {
        // Timeout is NOT an error - continue polling
        continue;
      }

      const apiResponse = (error as any).response;
      if (apiResponse && apiResponse.status === 'error') {
        const errorMessage = apiResponse.jobError || (error as any).message || 'Conversion failed';
        onError(errorMessage);
        return;
      }

      consecutiveErrors++;

      if (consecutiveErrors >= maxConsecutiveErrors) {
        onError('Network error - please try again');
        return;
      }
    }

    await new Promise(resolve => setTimeout(resolve, pollingInterval));
  }
}

// ==========================================
// Tests
// ==========================================

describe('startPolling', () => {
  let onProgress: ReturnType<typeof vi.fn>;
  let onComplete: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;
  let controller: AbortController;
  let getStatusByUrl: ReturnType<typeof vi.fn>;

  const defaultConfig = { pollingInterval: 100, maxConsecutiveErrors: 3 };

  beforeEach(() => {
    vi.useFakeTimers();
    onProgress = vi.fn();
    onComplete = vi.fn();
    onError = vi.fn();
    controller = new AbortController();
    getStatusByUrl = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    controller.abort(); // Cleanup any running polls
  });

  function createOptions(): PollingOptions {
    return {
      statusUrl: 'https://api.com/status/abc',
      onProgress,
      onComplete,
      onError,
      signal: controller.signal,
    };
  }

  describe('successful completion', () => {
    it('calls onComplete when status is completed with downloadUrl', async () => {
      getStatusByUrl.mockResolvedValueOnce({
        status: 'completed',
        progress: 100,
        title: 'Test',
        duration: 300,
        downloadUrl: 'https://cdn.com/file.mp4',
      } as StatusResponse);

      await startPolling(createOptions(), getStatusByUrl, defaultConfig);

      expect(onProgress).toHaveBeenCalledWith(100);
      expect(onComplete).toHaveBeenCalledWith('https://cdn.com/file.mp4');
      expect(onError).not.toHaveBeenCalled();
    });

    it('calls onError when completed but no downloadUrl', async () => {
      getStatusByUrl.mockResolvedValueOnce({
        status: 'completed',
        progress: 100,
        title: 'Test',
        duration: 300,
      } as StatusResponse);

      await startPolling(createOptions(), getStatusByUrl, defaultConfig);

      expect(onError).toHaveBeenCalledWith('Completed but no download URL');
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('progress updates', () => {
    it('calls onProgress for pending status', async () => {
      getStatusByUrl
        .mockResolvedValueOnce({
          status: 'pending',
          progress: 30,
          title: 'Test',
          duration: 300,
          detail: { video: 40, audio: 20 },
        } as StatusResponse)
        .mockResolvedValueOnce({
          status: 'pending',
          progress: 60,
          title: 'Test',
          duration: 300,
        } as StatusResponse)
        .mockResolvedValueOnce({
          status: 'completed',
          progress: 100,
          title: 'Test',
          duration: 300,
          downloadUrl: 'https://cdn.com/file.mp4',
        } as StatusResponse);

      const promise = startPolling(createOptions(), getStatusByUrl, defaultConfig);

      // Advance through polling intervals
      await vi.advanceTimersByTimeAsync(defaultConfig.pollingInterval);
      await vi.advanceTimersByTimeAsync(defaultConfig.pollingInterval);

      await promise;

      expect(onProgress).toHaveBeenCalledWith(30, { video: 40, audio: 20 });
      expect(onProgress).toHaveBeenCalledWith(60, undefined);
      expect(onProgress).toHaveBeenCalledWith(100);
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('calls onError immediately for "error" status', async () => {
      getStatusByUrl.mockResolvedValueOnce({
        status: 'error',
        progress: 0,
        title: 'Test',
        duration: 300,
        jobError: 'Video too long',
      } as StatusResponse);

      await startPolling(createOptions(), getStatusByUrl, defaultConfig);

      expect(onError).toHaveBeenCalledWith('Video too long');
      expect(getStatusByUrl).toHaveBeenCalledTimes(1);
    });

    it('calls onError for "not_found" status', async () => {
      getStatusByUrl.mockResolvedValueOnce({
        status: 'not_found',
        progress: 0,
        title: 'Test',
        duration: 300,
      } as StatusResponse);

      await startPolling(createOptions(), getStatusByUrl, defaultConfig);

      expect(onError).toHaveBeenCalledWith('Conversion failed');
    });

    it('calls onError for "failed" status', async () => {
      getStatusByUrl.mockResolvedValueOnce({
        status: 'failed',
        progress: 0,
        title: 'Test',
        duration: 300,
        jobError: 'Internal processing error',
      } as StatusResponse);

      await startPolling(createOptions(), getStatusByUrl, defaultConfig);

      expect(onError).toHaveBeenCalledWith('Internal processing error');
    });

    it('uses default error message when jobError is absent', async () => {
      getStatusByUrl.mockResolvedValueOnce({
        status: 'error',
        progress: 0,
        title: 'Test',
        duration: 300,
      } as StatusResponse);

      await startPolling(createOptions(), getStatusByUrl, defaultConfig);

      expect(onError).toHaveBeenCalledWith('Conversion failed');
    });
  });

  describe('timeout handling', () => {
    it('continues polling on timeout error (does not count as error)', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.name = 'TimeoutError';

      getStatusByUrl
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({
          status: 'completed',
          progress: 100,
          title: 'Test',
          duration: 300,
          downloadUrl: 'https://cdn.com/file.mp4',
        } as StatusResponse);

      const promise = startPolling(createOptions(), getStatusByUrl, defaultConfig);

      // Timeout errors skip the sleep (continue), but we still need to advance for the successful poll
      await vi.advanceTimersByTimeAsync(defaultConfig.pollingInterval);

      await promise;

      expect(onComplete).toHaveBeenCalledWith('https://cdn.com/file.mp4');
      expect(onError).not.toHaveBeenCalled();
      expect(getStatusByUrl).toHaveBeenCalledTimes(3);
    });
  });

  describe('consecutive error tracking', () => {
    it('fails after maxConsecutiveErrors network errors', async () => {
      const networkError = new Error('Network error');

      getStatusByUrl
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError);

      const promise = startPolling(createOptions(), getStatusByUrl, defaultConfig);

      await vi.advanceTimersByTimeAsync(defaultConfig.pollingInterval);
      await vi.advanceTimersByTimeAsync(defaultConfig.pollingInterval);

      await promise;

      expect(onError).toHaveBeenCalledWith('Network error - please try again');
    });

    it('resets consecutive error count on successful response', async () => {
      const networkError = new Error('Network error');

      getStatusByUrl
        .mockRejectedValueOnce(networkError) // error 1
        .mockRejectedValueOnce(networkError) // error 2
        .mockResolvedValueOnce({ // success - resets counter
          status: 'pending',
          progress: 50,
          title: 'Test',
          duration: 300,
        } as StatusResponse)
        .mockRejectedValueOnce(networkError) // error 1 again
        .mockRejectedValueOnce(networkError) // error 2 again
        .mockResolvedValueOnce({
          status: 'completed',
          progress: 100,
          title: 'Test',
          duration: 300,
          downloadUrl: 'https://cdn.com/file.mp4',
        } as StatusResponse);

      const promise = startPolling(createOptions(), getStatusByUrl, defaultConfig);

      // Advance through all polls
      for (let i = 0; i < 6; i++) {
        await vi.advanceTimersByTimeAsync(defaultConfig.pollingInterval);
      }

      await promise;

      // Should complete successfully because errors were reset
      expect(onComplete).toHaveBeenCalledWith('https://cdn.com/file.mp4');
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('cancellation', () => {
    it('stops polling when signal is aborted', async () => {
      getStatusByUrl.mockResolvedValue({
        status: 'pending',
        progress: 50,
        title: 'Test',
        duration: 300,
      } as StatusResponse);

      const promise = startPolling(createOptions(), getStatusByUrl, defaultConfig);

      // Let one poll happen
      await vi.advanceTimersByTimeAsync(defaultConfig.pollingInterval);

      // Abort
      controller.abort();
      await vi.advanceTimersByTimeAsync(defaultConfig.pollingInterval);

      await promise;

      // Should have stopped - not called many times
      expect(getStatusByUrl.mock.calls.length).toBeLessThanOrEqual(3);
    });
  });

  describe('API-level job error', () => {
    it('stops polling when error has response with status "error"', async () => {
      const apiError = new Error('Job failed');
      (apiError as any).response = {
        status: 'error',
        jobError: 'Processing timeout',
      };

      getStatusByUrl.mockRejectedValueOnce(apiError);

      await startPolling(createOptions(), getStatusByUrl, defaultConfig);

      expect(onError).toHaveBeenCalledWith('Processing timeout');
      expect(getStatusByUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('unknown status', () => {
    it('continues polling for unknown status values', async () => {
      getStatusByUrl
        .mockResolvedValueOnce({
          status: 'unknown_status' as any,
          progress: 0,
          title: 'Test',
          duration: 300,
        } as StatusResponse)
        .mockResolvedValueOnce({
          status: 'completed',
          progress: 100,
          title: 'Test',
          duration: 300,
          downloadUrl: 'https://cdn.com/file.mp4',
        } as StatusResponse);

      const promise = startPolling(createOptions(), getStatusByUrl, defaultConfig);

      await vi.advanceTimersByTimeAsync(defaultConfig.pollingInterval);

      await promise;

      expect(onComplete).toHaveBeenCalled();
      expect(getStatusByUrl).toHaveBeenCalledTimes(2);
    });
  });
});
