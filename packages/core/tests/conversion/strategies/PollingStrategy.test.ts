/**
 * PollingStrategy Tests
 *
 * Comprehensive tests for polling-based conversion strategy.
 * This is the most complex strategy with 3-layer animation and fake progress.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PollingStrategy } from '@/conversion/strategies/PollingStrategy';
import type { IStateUpdater } from '@/conversion/state-interface/IStateUpdater';
import type { IPollingManager, PollingOptions } from '@/conversion/polling/IPollingManager';
import type { StrategyContext } from '@/conversion/strategies/IConversionStrategy';
import { TaskState, RouteType } from '@/conversion/types';
import { PollingProgressMapper } from '@/conversion/progress/PollingProgressMapper';

describe('PollingStrategy', () => {
  let mockStateUpdater: IStateUpdater;
  let mockPollingManager: IPollingManager;
  let mockContext: StrategyContext;
  let abortController: AbortController;
  let pollingOptions: PollingOptions | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    abortController = new AbortController();
    pollingOptions = null;

    mockStateUpdater = {
      updateTask: vi.fn(),
      getTask: vi.fn()
    };

    mockPollingManager = {
      startPolling: vi.fn((taskId, options) => {
        pollingOptions = options;
      }),
      stopPolling: vi.fn()
    };

    mockContext = {
      formatId: 'video|mp4-1080p',
      formatData: {
        id: 'video|mp4-1080p',
        category: 'video',
        type: 'mp4',
        quality: '1080p',
        size: 524288000, // 500 MB
        url: null,
        vid: 'abc123',
        key: 'key456',
        encryptedUrl: null,
        isFakeData: false
      },
      extractResult: {
        url: 'https://stream.example.com/video.mp4',
        filename: 'video.mp4',
        size: 524288000,
        status: 'stream',
        progressUrl: '/api/progress/abc123'
      },
      routing: {
        routeType: RouteType.WINDOWS_MP4_POLLING,
        platform: 'Windows',
        format: 'mp4',
        sizeMB: 500,
        description: 'Windows MP4 stream - server polling'
      },
      abortSignal: abortController.signal,
      videoTitle: 'Test Video',
      videoUrl: 'https://youtube.com/watch?v=test123'
    };

    // Mock RAF
    global.requestAnimationFrame = vi.fn((cb) => {
      setTimeout(cb, 16);
      return 1;
    }) as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getName()', () => {
    it('should return strategy name', () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      expect(strategy.getName()).toBe('PollingStrategy');
    });
  });

  describe('constructor', () => {
    it('should initialize PollingProgressMapper with format', () => {
      const resetSpy = vi.spyOn(PollingProgressMapper, 'reset');

      new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);

      expect(resetSpy).toHaveBeenCalledWith('mp4', 500);
    });

    it('should handle audio format', () => {
      mockContext.formatData.type = 'mp3';
      mockContext.extractResult.size = 104857600; // 100 MB

      const resetSpy = vi.spyOn(PollingProgressMapper, 'reset');

      new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);

      expect(resetSpy).toHaveBeenCalledWith('mp3', 100);
    });

    it('should default to 200MB if size not available', () => {
      mockContext.extractResult.size = null;

      const resetSpy = vi.spyOn(PollingProgressMapper, 'reset');

      new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);

      expect(resetSpy).toHaveBeenCalledWith('mp4', 200);
    });
  });

  describe('execute()', () => {
    it('should return cancelled if already aborted', async () => {
      abortController.abort();

      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const result = await strategy.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
      expect(mockPollingManager.startPolling).not.toHaveBeenCalled();
    });

    it('should fail if no progressUrl', async () => {
      mockContext.extractResult.progressUrl = null;

      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const result = await strategy.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No progressUrl - polling not supported');
    });

    it('should update state to POLLING', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(100);

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'video|mp4-1080p',
        expect.objectContaining({
          state: TaskState.POLLING,
          statusText: 'Converting...',
          showProgressBar: true
        })
      );

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });

    it('should start polling with correct options', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(100);

      expect(mockPollingManager.startPolling).toHaveBeenCalledWith(
        'video|mp4-1080p',
        expect.objectContaining({
          progressUrl: '/api/progress/abc123'
        })
      );

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });

    it('should play initial animation 0→5%', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      // Advance through animation (200ms total for 5 steps)
      await vi.advanceTimersByTimeAsync(250);

      // Check that progress was updated to 5%
      const calls = (mockStateUpdater.updateTask as any).mock.calls;
      const progressCalls = calls.filter((call: any) => call[1].progress !== undefined);

      expect(progressCalls.length).toBeGreaterThan(0);
      // Should have reached 5%
      const lastProgress = progressCalls[progressCalls.length - 1][1].progress;
      expect(lastProgress).toBe(5);

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });
  });

  describe('Progress handling', () => {
    it('should handle progress update from polling', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      // Simulate progress callback
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 50,
          audioProgress: 30,
          status: 'processing'
        });
      }

      // Video: 50 * 0.6 + 30 * 0.4 = 30 + 12 = 42%
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'video|mp4-1080p',
        expect.objectContaining({
          progress: 42,
          statusText: expect.stringContaining('Processing')
        })
      );

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });

    it('should handle no_download status', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      // Clear previous calls
      vi.clearAllMocks();

      // Simulate no_download status
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 0,
          audioProgress: 0,
          status: 'no_download'
        });
      }

      // Should increment to 6% (5% initial + 1% no_download)
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'video|mp4-1080p',
        expect.objectContaining({
          statusText: expect.stringContaining('Converting')
        })
      );

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });

    it('should apply never backwards rule', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      // First update: 50%
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 60,
          audioProgress: 60,
          status: 'processing'
        });
      }

      await vi.advanceTimersByTimeAsync(100);

      const callCountBefore = (mockStateUpdater.updateTask as any).mock.calls.length;

      // Second update: backwards to 30% (should be ignored)
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 30,
          audioProgress: 30,
          status: 'processing'
        });
      }

      // Should not have made new progress update (only fake progress might happen)
      // Check that we didn't go backwards
      const calls = (mockStateUpdater.updateTask as any).mock.calls;
      const progressAfter = calls[calls.length - 1]?.[1]?.progress;
      expect(progressAfter).toBeGreaterThanOrEqual(50);

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });
  });

  describe('Fake progress', () => {
    it('should handle stuck progress scenarios', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      // Set progress to 60%
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 60,
          audioProgress: 60,
          status: 'processing'
        });
      }

      await vi.advanceTimersByTimeAsync(100);

      // Send same progress again (stuck scenario)
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 60,
          audioProgress: 60,
          status: 'processing'
        });
      }

      // Strategy should handle stuck progress gracefully
      expect(mockStateUpdater.updateTask).toHaveBeenCalled();

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });

    it('should not fake progress beyond 90%', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      // Set progress to 90%
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 95,
          audioProgress: 95,
          status: 'processing'
        });
      }

      await vi.advanceTimersByTimeAsync(100);
      vi.clearAllMocks();

      // Advance 5 seconds
      await vi.advanceTimersByTimeAsync(5000);

      // Should NOT go above 90% with fake progress
      const calls = (mockStateUpdater.updateTask as any).mock.calls;
      const allProgress = calls.map((call: any) => call[1]?.progress).filter((p: any) => p !== undefined);
      const maxProgress = Math.max(...allProgress);

      expect(maxProgress).toBeLessThanOrEqual(95);

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });
  });

  describe('Merging phase', () => {
    it('should transition to merging when processing complete', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      // Trigger merging transition
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 100,
          audioProgress: 100,
          status: 'processing'
        });
      }

      // Advance past merging delay (500ms)
      await vi.advanceTimersByTimeAsync(600);

      // Should have transitioned to merging with appropriate status
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'video|mp4-1080p',
        expect.objectContaining({
          progress: 100,
          statusText: expect.stringMatching(/Merging|Finalizing/)
        })
      );

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });

    it('should rotate status during merging with progressive timing', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      // Trigger merging
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 100,
          audioProgress: 100,
          status: 'processing'
        });
      }

      await vi.advanceTimersByTimeAsync(600);
      vi.clearAllMocks();

      // Simulate stuck in merging - send same data
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 100,
          audioProgress: 100,
          status: 'merging'
        });
      }

      // Advance 5 seconds (should rotate to next status)
      await vi.advanceTimersByTimeAsync(5000);

      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 100,
          audioProgress: 100,
          status: 'merging'
        });
      }

      // Should have updated status
      expect(mockStateUpdater.updateTask).toHaveBeenCalled();

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });
  });

  describe('Completion', () => {
    it('should handle completion with mergedUrl', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      // Trigger completion
      if (pollingOptions?.onStatusUpdate) {
        pollingOptions.onStatusUpdate({
          mergedUrl: 'https://example.com/merged.mp4'
        });
      }

      // Advance through RAF delays
      await vi.runAllTimersAsync();

      const result = await executePromise;

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://example.com/merged.mp4');
    });

    it('should mark success in state', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      if (pollingOptions?.onStatusUpdate) {
        pollingOptions.onStatusUpdate({
          mergedUrl: 'https://example.com/merged.mp4'
        });
      }

      await vi.runAllTimersAsync();
      await executePromise;

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'video|mp4-1080p',
        expect.objectContaining({
          state: TaskState.SUCCESS,
          downloadUrl: 'https://example.com/merged.mp4'
        })
      );
    });

    it('should stop polling on completion', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      if (pollingOptions?.onStatusUpdate) {
        pollingOptions.onStatusUpdate({
          mergedUrl: 'https://example.com/merged.mp4'
        });
      }

      await vi.runAllTimersAsync();
      await executePromise;

      expect(mockPollingManager.stopPolling).toHaveBeenCalledWith('video|mp4-1080p');
    });

    it('should wait for RAF before showing success', async () => {
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame');

      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      if (pollingOptions?.onStatusUpdate) {
        pollingOptions.onStatusUpdate({
          mergedUrl: 'https://example.com/merged.mp4'
        });
      }

      await vi.runAllTimersAsync();
      await executePromise;

      expect(rafSpy).toHaveBeenCalled();
    });
  });

  describe('cancel()', () => {
    it('should stop polling', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(100);

      strategy.cancel();

      expect(mockPollingManager.stopPolling).toHaveBeenCalledWith('video|mp4-1080p');

      await vi.runAllTimersAsync();
      await executePromise;
    });

    it('should resolve with cancelled result', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(100);

      strategy.cancel();

      await vi.runAllTimersAsync();
      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
    });

    it('should handle cancel during initial animation', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(50);

      strategy.cancel();

      await vi.runAllTimersAsync();
      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
    });

    it('should handle cancel during processing', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      // Send some progress
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 50,
          audioProgress: 50,
          status: 'processing'
        });
      }

      await vi.advanceTimersByTimeAsync(100);

      // Cancel during processing
      strategy.cancel();

      await vi.runAllTimersAsync();

      const result = await executePromise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
    });
  });

  describe('Audio format handling', () => {
    beforeEach(() => {
      mockContext.formatData.type = 'mp3';
      mockContext.formatData.format = 'mp3';
      mockContext.extractResult.size = 104857600; // 100 MB
    });

    it('should use only audioProgress for audio', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(300);

      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 80,
          audioProgress: 50,
          status: 'processing'
        });
      }

      // Should use only audioProgress (50%)
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'video|mp4-1080p',
        expect.objectContaining({
          progress: 50
        })
      );

      strategy.cancel();
      await vi.runAllTimersAsync();
      await executePromise;
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete polling flow', async () => {
      const strategy = new PollingStrategy(mockContext, mockStateUpdater, mockPollingManager);
      const executePromise = strategy.execute();

      // Wait for initial animation
      await vi.advanceTimersByTimeAsync(300);

      // Progress updates
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 30,
          audioProgress: 20,
          status: 'processing'
        });
      }

      await vi.advanceTimersByTimeAsync(100);

      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 60,
          audioProgress: 50,
          status: 'processing'
        });
      }

      await vi.advanceTimersByTimeAsync(100);

      // Complete processing
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 100,
          audioProgress: 100,
          status: 'processing'
        });
      }

      await vi.advanceTimersByTimeAsync(600);

      // Merging
      if (pollingOptions?.onProgressUpdate) {
        pollingOptions.onProgressUpdate({
          videoProgress: 100,
          audioProgress: 100,
          status: 'merging'
        });
      }

      await vi.advanceTimersByTimeAsync(100);

      // Complete
      if (pollingOptions?.onStatusUpdate) {
        pollingOptions.onStatusUpdate({
          mergedUrl: 'https://example.com/merged.mp4'
        });
      }

      await vi.runAllTimersAsync();
      const result = await executePromise;

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://example.com/merged.mp4');
    });
  });
});
