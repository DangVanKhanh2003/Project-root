/**
 * IOSRamStrategy Tests
 *
 * Tests for iOS RAM download strategy.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IOSRamStrategy } from './IOSRamStrategy';
import type { IStateUpdater } from '../state-interface/IStateUpdater';
import type { StrategyContext } from './IConversionStrategy';
import { TaskState, RouteType } from '../types';

// Mock downloadStreamToRAM
vi.mock('../../utils/download-stream', () => ({
  downloadStreamToRAM: vi.fn()
}));

import { downloadStreamToRAM } from '../../utils/download-stream';

describe('IOSRamStrategy', () => {
  let mockStateUpdater: IStateUpdater;
  let mockContext: StrategyContext;
  let abortController: AbortController;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    abortController = new AbortController();

    mockStateUpdater = {
      updateTask: vi.fn(),
      getTask: vi.fn()
    };

    mockContext = {
      formatId: 'audio|mp3-320kbps',
      formatData: {
        id: 'audio|mp3-320kbps',
        category: 'audio',
        type: 'mp3',
        quality: '320kbps',
        size: 104857600, // 100 MB
        url: null,
        vid: 'abc123',
        key: 'key456',
        encryptedUrl: null,
        isFakeData: false
      },
      extractResult: {
        url: 'https://stream.example.com/audio.mp3',
        filename: 'audio.mp3',
        size: 104857600, // 100 MB
        status: 'stream',
        progressUrl: null
      },
      routing: {
        routeType: RouteType.IOS_RAM,
        platform: 'iOS',
        format: 'mp3',
        sizeMB: 100,
        description: 'iOS audio stream (100MB) - RAM download'
      },
      abortSignal: abortController.signal,
      videoTitle: 'Test Audio',
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
      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      expect(strategy.getName()).toBe('IOSRamStrategy');
    });
  });

  describe('execute()', () => {
    it('should wait 1s before starting download', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      // Should not have called download yet
      expect(downloadStreamToRAM).not.toHaveBeenCalled();

      // Advance 500ms - still waiting
      await vi.advanceTimersByTimeAsync(500);
      expect(downloadStreamToRAM).not.toHaveBeenCalled();

      // Advance to 1000ms - should start download
      await vi.advanceTimersByTimeAsync(500);
      expect(downloadStreamToRAM).toHaveBeenCalled();

      // Complete RAF delays
      await vi.runAllTimersAsync();

      await executePromise;
    });

    it('should update to DOWNLOADING state after delay', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(1000);

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          state: TaskState.DOWNLOADING,
          statusText: expect.stringContaining('Converting')
        })
      );

      await vi.runAllTimersAsync();
      await executePromise;
    });

    it('should show initial status with size info', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(1000);

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          statusText: 'Converting... 0 MB / 100 MB'
        })
      );

      await vi.runAllTimersAsync();
      await executePromise;
    });

    it('should download stream to RAM', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      expect(downloadStreamToRAM).toHaveBeenCalledWith(
        'https://stream.example.com/audio.mp3',
        expect.objectContaining({
          signal: abortController.signal
        })
      );

      await executePromise;
    });

    it('should handle progress updates', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      let progressCallback: any;

      vi.mocked(downloadStreamToRAM).mockImplementation(async (url, options) => {
        progressCallback = options?.onProgress;
        return mockBlob;
      });

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      // Simulate progress updates
      if (progressCallback) {
        progressCallback({ loaded: 52428800, total: 104857600 }); // 50%
      }

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          statusText: 'Converting... 50 MB / 100 MB',
          progress: 50
        })
      );

      await executePromise;
    });

    it('should force progress to 100% before success', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      // Should have called with progress: 100
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          progress: 100
        })
      );

      await executePromise;
    });

    it('should wait for RAF + delay before showing success', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const rafSpy = vi.spyOn(global, 'requestAnimationFrame');

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      // Should have called RAF twice
      expect(rafSpy).toHaveBeenCalled();

      await executePromise;
    });

    it('should return success with blob', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      const result = await executePromise;

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://stream.example.com/audio.mp3');
      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe('audio.mp3');
    });

    it('should mark success with ramBlob', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      await executePromise;

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          state: TaskState.SUCCESS,
          ramBlob: mockBlob,
          filename: 'audio.mp3'
        })
      );
    });

    it('should handle abort during 1s delay', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      // Abort during delay
      await vi.advanceTimersByTimeAsync(500);
      abortController.abort();

      await vi.runAllTimersAsync();

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
      expect(downloadStreamToRAM).not.toHaveBeenCalled();
    });

    it('should handle abort after download', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });

      vi.mocked(downloadStreamToRAM).mockImplementation(async () => {
        await vi.advanceTimersByTimeAsync(100);
        abortController.abort();
        return mockBlob;
      });

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
    });

    it('should handle abort during RAF wait', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(1100); // Past initial delay
      abortController.abort();

      await vi.runAllTimersAsync();

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
    });

    it('should handle download errors', async () => {
      vi.mocked(downloadStreamToRAM).mockRejectedValue(new Error('Network timeout'));

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });

    it('should mark failed on download error', async () => {
      vi.mocked(downloadStreamToRAM).mockRejectedValue(new Error('Connection failed'));

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      await executePromise;

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          state: TaskState.FAILED,
          error: 'Connection failed'
        })
      );
    });

    it('should handle AbortError', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      vi.mocked(downloadStreamToRAM).mockRejectedValue(abortError);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      const result = await executePromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
    });

    it('should handle no size info', async () => {
      mockContext.extractResult.size = null;

      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.advanceTimersByTimeAsync(1000);

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          statusText: 'Converting...'
        })
      );

      await vi.runAllTimersAsync();
      await executePromise;
    });

    it('should handle no filename', async () => {
      mockContext.extractResult.filename = null;

      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      vi.mocked(downloadStreamToRAM).mockResolvedValue(mockBlob);

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      const result = await executePromise;

      expect(result.filename).toBeUndefined();
    });

    it('should handle already aborted', async () => {
      abortController.abort();

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const result = await strategy.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
      expect(downloadStreamToRAM).not.toHaveBeenCalled();
    });

    it('should call cancel()', () => {
      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      strategy.cancel();
      // Should not throw
    });
  });

  describe('Progress handling', () => {
    it('should calculate progress percentage correctly', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      let progressCallback: any;

      vi.mocked(downloadStreamToRAM).mockImplementation(async (url, options) => {
        progressCallback = options?.onProgress;
        return mockBlob;
      });

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      // 25% progress
      if (progressCallback) {
        progressCallback({ loaded: 26214400, total: 104857600 });
      }

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          progress: 25
        })
      );

      await executePromise;
    });

    it('should format MB values correctly', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      let progressCallback: any;

      vi.mocked(downloadStreamToRAM).mockImplementation(async (url, options) => {
        progressCallback = options?.onProgress;
        return mockBlob;
      });

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      if (progressCallback) {
        progressCallback({ loaded: 78643200, total: 104857600 }); // 75 MB / 100 MB
      }

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          statusText: 'Converting... 75 MB / 100 MB'
        })
      );

      await executePromise;
    });

    it('should skip progress updates when aborted', async () => {
      const mockBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      let progressCallback: any;

      vi.mocked(downloadStreamToRAM).mockImplementation(async (url, options) => {
        progressCallback = options?.onProgress;
        return mockBlob;
      });

      const strategy = new IOSRamStrategy(mockContext, mockStateUpdater);
      const executePromise = strategy.execute();

      await vi.runAllTimersAsync();

      // Abort
      abortController.abort();

      const callCountBefore = (mockStateUpdater.updateTask as any).mock.calls.length;

      // Try to update progress
      if (progressCallback) {
        progressCallback({ loaded: 52428800, total: 104857600 });
      }

      const callCountAfter = (mockStateUpdater.updateTask as any).mock.calls.length;

      // Should not have added new call
      expect(callCountAfter).toBe(callCountBefore);

      await executePromise;
    });
  });
});
