/**
 * BaseStrategy Tests
 *
 * Comprehensive tests for base strategy class.
 * Target: 15+ tests covering all methods and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseStrategy } from './BaseStrategy';
import type { IStateUpdater } from '../state-interface/IStateUpdater';
import type { StrategyContext, StrategyResult } from './IConversionStrategy';
import { TaskState, RouteType } from '../types';

// Concrete implementation for testing
class TestStrategy extends BaseStrategy {
  public testExecuteCalled = false;
  private shouldFail = false;
  private shouldAbort = false;

  constructor(context: StrategyContext, stateUpdater: IStateUpdater, options?: { shouldFail?: boolean; shouldAbort?: boolean }) {
    super(context, stateUpdater);
    this.shouldFail = options?.shouldFail ?? false;
    this.shouldAbort = options?.shouldAbort ?? false;
  }

  async execute(): Promise<StrategyResult> {
    this.testExecuteCalled = true;

    if (this.shouldAbort && this.checkAborted()) {
      return this.cancelledResult();
    }

    if (this.shouldFail) {
      this.markFailed('Test error');
      return this.failureResult('Test error');
    }

    this.markSuccess('https://example.com/download.mp3');
    return this.successResult('https://example.com/download.mp3');
  }

  getName(): string {
    return 'TestStrategy';
  }

  // Expose protected methods for testing
  public testCheckAborted(): boolean {
    return this.checkAborted();
  }

  public testUpdateTask(update: Record<string, unknown>): void {
    return this.updateTask(update);
  }

  public testMarkSuccess(url: string, extras?: Record<string, unknown>): void {
    return this.markSuccess(url, extras);
  }

  public testMarkFailed(error: string): void {
    return this.markFailed(error);
  }

  public testSuccessResult(url: string, extras?: Partial<StrategyResult>): StrategyResult {
    return this.successResult(url, extras);
  }

  public testFailureResult(error: string): StrategyResult {
    return this.failureResult(error);
  }

  public testCancelledResult(): StrategyResult {
    return this.cancelledResult();
  }
}

describe('BaseStrategy', () => {
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
        progressUrl: '/progress/abc'
      },
      routing: {
        routeType: RouteType.OTHER_STREAM,
        platform: 'other',
        format: 'mp3',
        sizeMB: 10,
        description: 'Direct stream download'
      },
      abortSignal: abortController.signal,
      videoTitle: 'Test Video',
      videoUrl: 'https://youtube.com/watch?v=test123'
    };
  });

  describe('Constructor', () => {
    it('should initialize with context and state updater', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      expect(strategy['ctx']).toBe(mockContext);
      expect(strategy['stateUpdater']).toBe(mockStateUpdater);
      expect(strategy['isAborted']).toBe(false);
    });

    it('should set up abort listener', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      expect(strategy['isAborted']).toBe(false);

      abortController.abort();

      expect(strategy['isAborted']).toBe(true);
    });

    it('should handle context without abort signal', () => {
      const contextWithoutSignal: StrategyContext = {
        ...mockContext,
        abortSignal: undefined as any
      };

      const strategy = new TestStrategy(contextWithoutSignal, mockStateUpdater);

      expect(strategy['isAborted']).toBe(false);
    });
  });

  describe('Abstract methods', () => {
    it('should require execute() implementation', async () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(strategy.testExecuteCalled).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should require getName() implementation', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      expect(strategy.getName()).toBe('TestStrategy');
    });
  });

  describe('cancel()', () => {
    it('should set isAborted to true', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      expect(strategy['isAborted']).toBe(false);

      strategy.cancel();

      expect(strategy['isAborted']).toBe(true);
    });

    it('should allow multiple cancel calls', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      strategy.cancel();
      strategy.cancel();
      strategy.cancel();

      expect(strategy['isAborted']).toBe(true);
    });
  });

  describe('checkAborted()', () => {
    it('should return false when not aborted', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      expect(strategy.testCheckAborted()).toBe(false);
    });

    it('should return true when isAborted flag set', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      strategy.cancel();

      expect(strategy.testCheckAborted()).toBe(true);
    });

    it('should return true when abort signal aborted', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      abortController.abort();

      expect(strategy.testCheckAborted()).toBe(true);
    });

    it('should return true when both flags set', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      strategy.cancel();
      abortController.abort();

      expect(strategy.testCheckAborted()).toBe(true);
    });
  });

  describe('updateTask()', () => {
    it('should delegate to stateUpdater.updateTask', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      const updates = {
        state: TaskState.POLLING,
        progress: 50
      };

      strategy.testUpdateTask(updates);

      expect(mockStateUpdater.updateTask).toHaveBeenCalledTimes(1);
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith('audio|mp3-320kbps', updates);
    });

    it('should pass formatId from context', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      strategy.testUpdateTask({ progress: 75 });

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        mockContext.formatId,
        { progress: 75 }
      );
    });
  });

  describe('markSuccess()', () => {
    it('should update task with success state', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      strategy.testMarkSuccess('https://example.com/download.mp3');

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          state: TaskState.SUCCESS,
          statusText: 'Conversion successful!',
          downloadUrl: 'https://example.com/download.mp3',
          showProgressBar: false
        })
      );
    });

    it('should include completedAt timestamp', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      const beforeTime = Date.now();
      strategy.testMarkSuccess('https://example.com/download.mp3');
      const afterTime = Date.now();

      const callArgs = (mockStateUpdater.updateTask as any).mock.calls[0][1];
      expect(callArgs.completedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.completedAt).toBeLessThanOrEqual(afterTime);
    });

    it('should merge extra fields', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      strategy.testMarkSuccess('https://example.com/download.mp3', {
        filename: 'song.mp3',
        customField: 'custom value'
      });

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          state: TaskState.SUCCESS,
          downloadUrl: 'https://example.com/download.mp3',
          filename: 'song.mp3',
          customField: 'custom value'
        })
      );
    });
  });

  describe('markFailed()', () => {
    it('should update task with failed state', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      strategy.testMarkFailed('Network timeout');

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          state: TaskState.FAILED,
          statusText: 'Error: Network timeout',
          error: 'Network timeout',
          showProgressBar: false
        })
      );
    });

    it('should include completedAt timestamp', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      const beforeTime = Date.now();
      strategy.testMarkFailed('API error');
      const afterTime = Date.now();

      const callArgs = (mockStateUpdater.updateTask as any).mock.calls[0][1];
      expect(callArgs.completedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.completedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('successResult()', () => {
    it('should return success result', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      const result = strategy.testSuccessResult('https://example.com/download.mp3');

      expect(result).toEqual({
        success: true,
        downloadUrl: 'https://example.com/download.mp3'
      });
    });

    it('should merge extra fields', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      const result = strategy.testSuccessResult('https://example.com/download.mp3', {
        filename: 'video.mp4',
        blob: new Blob(['test'])
      });

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://example.com/download.mp3');
      expect(result.filename).toBe('video.mp4');
      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe('failureResult()', () => {
    it('should return failure result', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      const result = strategy.testFailureResult('Connection failed');

      expect(result).toEqual({
        success: false,
        error: 'Connection failed'
      });
    });
  });

  describe('cancelledResult()', () => {
    it('should return cancelled result', () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      const result = strategy.testCancelledResult();

      expect(result).toEqual({
        success: false,
        error: 'Cancelled'
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle successful conversion flow', async () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater);

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('https://example.com/download.mp3');
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          state: TaskState.SUCCESS,
          downloadUrl: 'https://example.com/download.mp3'
        })
      );
    });

    it('should handle failed conversion flow', async () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater, { shouldFail: true });

      const result = await strategy.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(
        'audio|mp3-320kbps',
        expect.objectContaining({
          state: TaskState.FAILED,
          error: 'Test error'
        })
      );
    });

    it('should handle cancelled conversion flow', async () => {
      const strategy = new TestStrategy(mockContext, mockStateUpdater, { shouldAbort: true });

      abortController.abort();

      const result = await strategy.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cancelled');
    });
  });
});
