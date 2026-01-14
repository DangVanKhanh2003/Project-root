/**
 * OtherStreamStrategy Tests
 *
 * Tests for other platform stream strategy.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OtherStreamStrategy } from './OtherStreamStrategy';
import type { IStateUpdater } from '../state-interface/IStateUpdater';
import type { StrategyContext } from './IConversionStrategy';
import { TaskState, RouteType } from '../types';

describe('OtherStreamStrategy', () => {
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
      formatId: 'audio|mp3-320kbps',
      formatData: {
        id: 'audio|mp3-320kbps',
        category: 'audio',
        type: 'mp3',
        quality: '320kbps',
        size: 10485760,
        url: null,
        vid: 'abc123',
        key: 'key456',
        encryptedUrl: null,
        isFakeData: false
      },
      extractResult: {
        url: 'https://stream.example.com/audio.mp3',
        filename: 'audio.mp3',
        size: 10485760,
        status: 'stream',
        progressUrl: null
      },
      routing: {
        routeType: RouteType.OTHER_STREAM,
        platform: 'other',
        format: 'mp3',
        sizeMB: 10,
        description: 'Direct stream download'
      },
      abortSignal: abortController.signal,
      videoTitle: 'Test Audio',
      videoUrl: 'https://youtube.com/watch?v=test123'
    };
  });

  describe('getName()', () => {
    it('should return strategy name', () => {
      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      expect(strategy.getName()).toBe('OtherStreamStrategy');
    });
  });

  describe('execute()', () => {
    it('should return success with stream URL', async () => {
      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://stream.example.com/audio.mp3');
      expect(result.filename).toBe('audio.mp3');
    });

    it('should update task state to SUCCESS', async () => {
      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      await strategy.execute();

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          state: TaskState.SUCCESS,
          statusText: 'Conversion successful!',
          downloadUrl: 'https://stream.example.com/audio.mp3',
          filename: 'audio.mp3',
          showProgressBar: false
        })
      );
    });

    it('should include completedAt timestamp', async () => {
      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      const beforeTime = Date.now();
      await strategy.execute();
      const afterTime = Date.now();

      const callArgs = (mockStateUpdater.updateTask as any).mock.calls[0][1];
      expect(callArgs.completedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.completedAt).toBeLessThanOrEqual(afterTime);
    });

    it('should handle filename as null', async () => {
      mockContext.extractResult.filename = null;

      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.filename).toBeUndefined();
    });

    it('should return cancelled result when aborted before execution', async () => {
      abortController.abort();

      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
      expect(mockStateUpdater.updateTask).not.toHaveBeenCalled();
    });

    it('should return cancelled result when cancelled via cancel()', async () => {
      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      strategy.cancel();

      const result = await strategy.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
    });

    it('should handle video files', async () => {
      mockContext.extractResult = {
        url: 'https://stream.example.com/video.mp4',
        filename: 'video.mp4',
        size: 52428800,
        status: 'stream',
        progressUrl: null
      };

      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://stream.example.com/video.mp4');
      expect(result.filename).toBe('video.mp4');
    });

    it('should handle large stream files', async () => {
      mockContext.extractResult = {
        url: 'https://stream.example.com/large.mp4',
        filename: 'large.mp4',
        size: 314572800, // 300 MB
        status: 'stream',
        progressUrl: null
      };

      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://stream.example.com/large.mp4');
    });

    it('should handle small files', async () => {
      mockContext.extractResult = {
        url: 'https://stream.example.com/small.mp3',
        filename: 'small.mp3',
        size: 1048576, // 1 MB
        status: 'stream',
        progressUrl: null
      };

      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://stream.example.com/small.mp3');
    });

    it('should not call updateTask when aborted', async () => {
      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      strategy.cancel();

      await strategy.execute();

      expect(mockStateUpdater.updateTask).not.toHaveBeenCalled();
    });

    it('should call updateTask exactly once when successful', async () => {
      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      await strategy.execute();

      expect(mockStateUpdater.updateTask).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration', () => {
    it('should handle complete stream download flow', async () => {
      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      // Execute strategy
      const result = await strategy.execute();

      // Verify result
      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://stream.example.com/audio.mp3');

      // Verify state update
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          state: TaskState.SUCCESS,
          downloadUrl: 'https://stream.example.com/audio.mp3'
        })
      );
    });

    it('should handle Android platform stream', async () => {
      mockContext.routing.platform = 'android';

      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
    });

    it('should handle Mac platform stream', async () => {
      mockContext.routing.platform = 'mac';

      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
    });

    it('should handle Linux platform stream', async () => {
      mockContext.routing.platform = 'linux';

      const strategy = new OtherStreamStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
    });
  });
});
