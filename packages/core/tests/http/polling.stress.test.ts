/**
 * Polling - Stress Tests
 *
 * Tests polling behavior under extreme conditions:
 * - Very long polling sessions
 * - Alternating errors and successes
 * - All possible status combinations
 * - Race conditions with cancellation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Portable polling (same logic as app)
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
  return error?.name === 'TimeoutError' || error?.name === 'AbortError' ||
    error?.error?.name === 'AbortError' || error?.code === 'ECONNABORTED';
}

async function startPolling(
  options: PollingOptions,
  getStatusByUrl: (url: string) => Promise<StatusResponse>,
  config: { pollingInterval: number; maxConsecutiveErrors: number }
): Promise<void> {
  const { statusUrl, onProgress, onComplete, onError, signal } = options;
  let consecutiveErrors = 0;

  while (!signal.aborted) {
    try {
      const status = await getStatusByUrl(statusUrl);
      consecutiveErrors = 0;
      switch (status.status) {
        case 'pending':
          onProgress(status.progress, status.detail ? { video: status.detail.video, audio: status.detail.audio } : undefined);
          break;
        case 'completed':
          if (status.downloadUrl) { onProgress(100); onComplete(status.downloadUrl); return; }
          else { onError('Completed but no download URL'); return; }
        case 'error': case 'not_found': case 'failed':
          onError(status.jobError || 'Conversion failed'); return;
        default: break;
      }
    } catch (error) {
      if (signal.aborted) return;
      if (isTimeoutError(error)) continue;
      const apiResponse = (error as any).response;
      if (apiResponse && apiResponse.status === 'error') {
        onError(apiResponse.jobError || (error as any).message || 'Conversion failed'); return;
      }
      consecutiveErrors++;
      if (consecutiveErrors >= config.maxConsecutiveErrors) { onError('Network error - please try again'); return; }
    }
    await new Promise(resolve => setTimeout(resolve, config.pollingInterval));
  }
}

describe('Polling - STRESS TESTS', () => {
  let onProgress: ReturnType<typeof vi.fn>;
  let onComplete: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;
  let controller: AbortController;
  let getStatusByUrl: ReturnType<typeof vi.fn>;
  const config = { pollingInterval: 10, maxConsecutiveErrors: 5 };

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
    controller.abort();
  });

  function opts(): PollingOptions {
    return { statusUrl: 'https://api.com/status/abc', onProgress, onComplete, onError, signal: controller.signal };
  }

  // ==========================================
  // Long polling session (50 polls before complete)
  // ==========================================
  it('handles 50 pending polls before completion', async () => {
    for (let i = 0; i < 50; i++) {
      getStatusByUrl.mockResolvedValueOnce({
        status: 'pending', progress: i * 2, title: 'T', duration: 300,
      } as StatusResponse);
    }
    getStatusByUrl.mockResolvedValueOnce({
      status: 'completed', progress: 100, title: 'T', duration: 300,
      downloadUrl: 'https://cdn.com/done.mp4',
    } as StatusResponse);

    const promise = startPolling(opts(), getStatusByUrl, config);
    for (let i = 0; i <= 50; i++) await vi.advanceTimersByTimeAsync(config.pollingInterval);
    await promise;

    expect(onComplete).toHaveBeenCalledWith('https://cdn.com/done.mp4');
    expect(onProgress).toHaveBeenCalledTimes(51); // 50 pending + 1 final 100%
  });

  // ==========================================
  // Alternating errors and successes
  // ==========================================
  it('survives alternating error-success pattern', async () => {
    // Pattern: error, success, error, success, ... then complete
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        getStatusByUrl.mockRejectedValueOnce(new Error('network'));
      } else {
        getStatusByUrl.mockResolvedValueOnce({
          status: 'pending', progress: i * 10, title: 'T', duration: 300,
        } as StatusResponse);
      }
    }
    getStatusByUrl.mockResolvedValueOnce({
      status: 'completed', progress: 100, title: 'T', duration: 300,
      downloadUrl: 'https://cdn.com/done.mp4',
    } as StatusResponse);

    const promise = startPolling(opts(), getStatusByUrl, config);
    for (let i = 0; i <= 11; i++) await vi.advanceTimersByTimeAsync(config.pollingInterval);
    await promise;

    // Should complete because errors never hit 5 consecutive
    expect(onComplete).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  // ==========================================
  // Timeout errors are infinite
  // ==========================================
  it('handles 20 consecutive timeouts then succeeds', async () => {
    const timeoutError = new Error('timeout');
    timeoutError.name = 'TimeoutError';

    for (let i = 0; i < 20; i++) {
      getStatusByUrl.mockRejectedValueOnce(timeoutError);
    }
    getStatusByUrl.mockResolvedValueOnce({
      status: 'completed', progress: 100, title: 'T', duration: 300,
      downloadUrl: 'https://cdn.com/done.mp4',
    } as StatusResponse);

    const promise = startPolling(opts(), getStatusByUrl, config);
    // Timeouts skip sleep (continue), so we need fewer advances
    for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(config.pollingInterval);
    await promise;

    expect(onComplete).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  // ==========================================
  // Exact boundary: maxConsecutiveErrors - 1 then recovery
  // ==========================================
  it('recovers at exactly maxConsecutiveErrors - 1 network errors', async () => {
    // 4 consecutive errors (limit is 5), then success
    for (let i = 0; i < 4; i++) {
      getStatusByUrl.mockRejectedValueOnce(new Error('network'));
    }
    getStatusByUrl.mockResolvedValueOnce({
      status: 'completed', progress: 100, title: 'T', duration: 300,
      downloadUrl: 'https://cdn.com/done.mp4',
    } as StatusResponse);

    const promise = startPolling(opts(), getStatusByUrl, config);
    for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(config.pollingInterval);
    await promise;

    expect(onComplete).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  // ==========================================
  // All terminal statuses
  // ==========================================
  const terminalStatuses: Array<{ status: StatusResponse['status']; jobError?: string }> = [
    { status: 'error', jobError: 'Video too long' },
    { status: 'error', jobError: undefined },
    { status: 'not_found', jobError: 'Job expired' },
    { status: 'not_found', jobError: undefined },
    { status: 'failed', jobError: 'Internal server error' },
    { status: 'failed', jobError: undefined },
  ];

  for (const { status, jobError } of terminalStatuses) {
    it(`stops immediately on status="${status}" (jobError=${jobError || 'none'})`, async () => {
      getStatusByUrl.mockResolvedValueOnce({
        status, progress: 0, title: 'T', duration: 300, jobError,
      } as StatusResponse);

      await startPolling(opts(), getStatusByUrl, config);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
      expect(getStatusByUrl).toHaveBeenCalledTimes(1);
    });
  }

  // ==========================================
  // Progress never goes backwards
  // ==========================================
  it('reports all progress values in order', async () => {
    const progressValues = [0, 5, 10, 15, 20, 25, 50, 75, 90, 95, 99];

    for (const p of progressValues) {
      getStatusByUrl.mockResolvedValueOnce({
        status: 'pending', progress: p, title: 'T', duration: 300,
      } as StatusResponse);
    }
    getStatusByUrl.mockResolvedValueOnce({
      status: 'completed', progress: 100, title: 'T', duration: 300,
      downloadUrl: 'https://cdn.com/done.mp4',
    } as StatusResponse);

    const promise = startPolling(opts(), getStatusByUrl, config);
    for (let i = 0; i <= progressValues.length; i++) await vi.advanceTimersByTimeAsync(config.pollingInterval);
    await promise;

    // Verify progress was reported in order
    const reportedProgress = onProgress.mock.calls.map((c: any[]) => c[0]);
    for (let i = 1; i < reportedProgress.length - 1; i++) {
      expect(reportedProgress[i]).toBeGreaterThanOrEqual(reportedProgress[i - 1]);
    }
    expect(reportedProgress[reportedProgress.length - 1]).toBe(100);
  });

  // ==========================================
  // Detail breakdown stress
  // ==========================================
  it('passes video/audio detail correctly through 20 progress updates', async () => {
    for (let i = 0; i < 20; i++) {
      getStatusByUrl.mockResolvedValueOnce({
        status: 'pending', progress: i * 5, title: 'T', duration: 300,
        detail: { video: i * 5, audio: Math.min(i * 7, 100) },
      } as StatusResponse);
    }
    getStatusByUrl.mockResolvedValueOnce({
      status: 'completed', progress: 100, title: 'T', duration: 300,
      downloadUrl: 'https://cdn.com/done.mp4',
    } as StatusResponse);

    const promise = startPolling(opts(), getStatusByUrl, config);
    for (let i = 0; i <= 20; i++) await vi.advanceTimersByTimeAsync(config.pollingInterval);
    await promise;

    // All detail calls should have video/audio breakdown
    const detailCalls = onProgress.mock.calls.filter((c: any[]) => c[1] !== undefined);
    expect(detailCalls.length).toBe(20);
    detailCalls.forEach((c: any[]) => {
      expect(c[1]).toHaveProperty('video');
      expect(c[1]).toHaveProperty('audio');
    });
  });
});
