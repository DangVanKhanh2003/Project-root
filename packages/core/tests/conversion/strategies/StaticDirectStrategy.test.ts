/**
 * StaticDirectStrategy Tests
 *
 * Tests for static direct download strategy.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaticDirectStrategy } from '@/conversion/strategies/StaticDirectStrategy';
import type { IStateUpdater } from '@/conversion/state-interface/IStateUpdater';
import type { StrategyContext } from '@/conversion/strategies/IConversionStrategy';
import { TaskState, RouteType } from '@/conversion/types';

describe('StaticDirectStrategy', () => {
  let mockStateUpdater: IStateUpdater;
  let mockContext: StrategyContext;
  let abortController: AbortController;

  beforeEach(() => {
    abortController = new AbortController();

    mockStateUpdater = {
      updateTask: vi.fn(),
      getTask: vi.fn()
    };

    mockContext = {
      formatId: 'video|mp4-1080p',
      formatData: {
        id: 'video|mp4-1080p',
        category: 'video',
        type: 'mp4',
        quality: '1080p',
        size: 52428800,
        url: 'https://cdn.example.com/video.mp4',
        vid: null,
        key: null,
        encryptedUrl: null,
        isFakeData: false
      },
      extractResult: {
        url: 'https://cdn.example.com/video.mp4',
        filename: 'video.mp4',
        size: 52428800,
        status: 'static',
        progressUrl: null
      },
      routing: {
        routeType: RouteType.STATIC_DIRECT,
        platform: 'any',
        format: 'mp4',
        sizeMB: 50,
        description: 'Static file direct download'
      },
      abortSignal: abortController.signal,
      videoTitle: 'Test Video',
      videoUrl: 'https://youtube.com/watch?v=test123'
    };
  });

  describe('getName()', () => {
    it('should return strategy name', () => {
      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      expect(strategy.getName()).toBe('StaticDirectStrategy');
    });
  });

  describe('execute()', () => {
    it('should return success with download URL', async () => {
      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://cdn.example.com/video.mp4');
      expect(result.filename).toBe('video.mp4');
    });

    it('should update task state to SUCCESS', async () => {
      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      await strategy.execute();

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'video|mp4-1080p',
        expect.objectContaining({
          state: TaskState.SUCCESS,
          statusText: 'Conversion successful!',
          downloadUrl: 'https://cdn.example.com/video.mp4',
          filename: 'video.mp4',
          showProgressBar: false
        })
      );
    });

    it('should include completedAt timestamp', async () => {
      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      const beforeTime = Date.now();
      await strategy.execute();
      const afterTime = Date.now();

      const callArgs = (mockStateUpdater.updateTask as any).mock.calls[0][1];
      expect(callArgs.completedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.completedAt).toBeLessThanOrEqual(afterTime);
    });

    it('should handle filename as null', async () => {
      mockContext.extractResult.filename = null;

      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.filename).toBeUndefined();
    });

    it('should return cancelled result when aborted before execution', async () => {
      abortController.abort();

      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
      expect(mockStateUpdater.updateTask).not.toHaveBeenCalled();
    });

    it('should return cancelled result when cancelled via cancel()', async () => {
      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      strategy.cancel();

      const result = await strategy.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
    });

    it('should handle audio files', async () => {
      mockContext.extractResult = {
        url: 'https://cdn.example.com/audio.mp3',
        filename: 'audio.mp3',
        size: 10485760,
        status: 'static',
        progressUrl: null
      };

      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://cdn.example.com/audio.mp3');
      expect(result.filename).toBe('audio.mp3');
    });

    it('should handle large files', async () => {
      mockContext.extractResult = {
        url: 'https://cdn.example.com/large.mp4',
        filename: 'large.mp4',
        size: 524288000, // 500 MB
        status: 'static',
        progressUrl: null
      };

      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://cdn.example.com/large.mp4');
    });

    it('should not call updateTask when aborted', async () => {
      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      strategy.cancel();

      await strategy.execute();

      expect(mockStateUpdater.updateTask).not.toHaveBeenCalled();
    });

    it('should call updateTask exactly once when successful', async () => {
      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      await strategy.execute();

      expect(mockStateUpdater.updateTask).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration', () => {
    it('should handle complete static download flow', async () => {
      const strategy = new StaticDirectStrategy(mockContext, mockStateUpdater);

      // Execute strategy
      const result = await strategy.execute();

      // Verify result
      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://cdn.example.com/video.mp4');

      // Verify state update
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'video|mp4-1080p',
        expect.objectContaining({
          state: TaskState.SUCCESS,
          downloadUrl: 'https://cdn.example.com/video.mp4'
        })
      );
    });
  });
});
