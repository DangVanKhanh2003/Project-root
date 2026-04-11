/**
 * IStateUpdater Interface Tests
 *
 * Tests for state updater interface and mock implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IStateUpdater, StateUpdate, TaskData } from '@/conversion/state-interface/IStateUpdater';

describe('IStateUpdater Interface', () => {
  let mockStateUpdater: IStateUpdater;

  beforeEach(() => {
    // Create mock implementation of IStateUpdater
    mockStateUpdater = {
      updateTask: vi.fn(),
      getTask: vi.fn()
    };
  });

  describe('updateTask', () => {
    it('should accept formatId and updates', () => {
      const formatId = 'audio|mp3-320kbps';
      const updates: StateUpdate = {
        state: 'polling',
        progress: 50,
        statusText: 'Converting... 50%'
      };

      mockStateUpdater.updateTask(formatId, updates);

      expect(mockStateUpdater.updateTask).toHaveBeenCalledTimes(1);
      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(formatId, updates);
    });

    it('should accept partial updates', () => {
      const formatId = 'video|mp4-1080p';
      const updates: StateUpdate = {
        progress: 75
      };

      mockStateUpdater.updateTask(formatId, updates);

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(formatId, updates);
    });

    it('should accept all standard fields', () => {
      const formatId = 'test-id';
      const updates: StateUpdate = {
        state: 'success',
        statusText: 'Ready',
        progress: 100,
        downloadUrl: 'https://example.com/download.mp3',
        error: null,
        completedAt: Date.now(),
        showProgressBar: false,
        filename: 'song.mp3'
      };

      mockStateUpdater.updateTask(formatId, updates);

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(formatId, updates);
    });

    it('should accept custom fields via index signature', () => {
      const formatId = 'test-id';
      const updates: StateUpdate = {
        state: 'polling',
        customField1: 'custom value',
        customField2: 123,
        nested: { data: 'test' }
      };

      mockStateUpdater.updateTask(formatId, updates);

      expect(mockStateUpdater.updateTask).toHaveBeenCalledWith(formatId, updates);
    });
  });

  describe('getTask', () => {
    it('should return task data when found', () => {
      const formatId = 'audio|mp3-320kbps';
      const mockTask: TaskData = {
        id: formatId,
        state: 'polling',
        abortController: new AbortController()
      };

      (mockStateUpdater.getTask as any).mockReturnValue(mockTask);

      const result = mockStateUpdater.getTask(formatId);

      expect(mockStateUpdater.getTask).toHaveBeenCalledWith(formatId);
      expect(result).toBe(mockTask);
      expect(result?.id).toBe(formatId);
      expect(result?.abortController).toBeInstanceOf(AbortController);
    });

    it('should return null when task not found', () => {
      const formatId = 'non-existent-id';

      (mockStateUpdater.getTask as any).mockReturnValue(null);

      const result = mockStateUpdater.getTask(formatId);

      expect(mockStateUpdater.getTask).toHaveBeenCalledWith(formatId);
      expect(result).toBeNull();
    });

    it('should support abort signal check', () => {
      const formatId = 'test-id';
      const abortController = new AbortController();
      const mockTask: TaskData = {
        id: formatId,
        state: 'polling',
        abortController
      };

      (mockStateUpdater.getTask as any).mockReturnValue(mockTask);

      const task = mockStateUpdater.getTask(formatId);

      expect(task?.abortController.signal.aborted).toBe(false);

      abortController.abort();

      expect(task?.abortController.signal.aborted).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should support typical conversion flow', () => {
      const formatId = 'audio|mp3-320kbps';

      // Start extracting
      mockStateUpdater.updateTask(formatId, {
        state: 'extracting',
        statusText: 'Extracting...',
        showProgressBar: false
      });

      // Start polling
      mockStateUpdater.updateTask(formatId, {
        state: 'polling',
        statusText: 'Converting...',
        progress: 0,
        showProgressBar: true
      });

      // Update progress
      mockStateUpdater.updateTask(formatId, {
        progress: 50,
        statusText: 'Converting... 50%'
      });

      // Complete
      mockStateUpdater.updateTask(formatId, {
        state: 'success',
        statusText: 'Ready',
        progress: 100,
        downloadUrl: 'https://example.com/download.mp3',
        completedAt: Date.now(),
        showProgressBar: false
      });

      expect(mockStateUpdater.updateTask).toHaveBeenCalledTimes(4);
    });

    it('should support error scenario', () => {
      const formatId = 'video|mp4-1080p';

      // Start
      mockStateUpdater.updateTask(formatId, {
        state: 'extracting',
        statusText: 'Extracting...'
      });

      // Fail
      mockStateUpdater.updateTask(formatId, {
        state: 'failed',
        statusText: 'Error: Network timeout',
        error: 'Network timeout',
        completedAt: Date.now(),
        showProgressBar: false
      });

      expect(mockStateUpdater.updateTask).toHaveBeenCalledTimes(2);
      expect(mockStateUpdater.updateTask).toHaveBeenLastCalledWith(
        formatId,
        expect.objectContaining({
          state: 'failed',
          error: 'Network timeout'
        })
      );
    });
  });
});
