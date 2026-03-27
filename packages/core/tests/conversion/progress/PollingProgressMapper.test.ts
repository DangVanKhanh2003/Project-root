/**
 * PollingProgressMapper Tests
 *
 * Comprehensive tests for polling progress mapper.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PollingProgressMapper } from '@/conversion/progress/PollingProgressMapper';

describe('PollingProgressMapper', () => {
  beforeEach(() => {
    // Reset before each test
    PollingProgressMapper.reset('mp4', 200);
  });

  describe('reset()', () => {
    it('should reset to processing phase', () => {
      PollingProgressMapper.startMergingPhase();
      expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');

      PollingProgressMapper.reset();

      expect(PollingProgressMapper.getCurrentPhase()).toBe('processing');
      expect(PollingProgressMapper.lastProgress).toBe(0);
    });

    it('should store format', () => {
      PollingProgressMapper.reset('mp3', 100);

      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 0,
        audioProgress: 50,
        status: 'processing'
      });

      // Audio format should use only audioProgress
      expect(progress).toBe(50);
    });

    it('should accept default parameters', () => {
      PollingProgressMapper.reset();

      expect(PollingProgressMapper.getCurrentPhase()).toBe('processing');
      expect(PollingProgressMapper.lastProgress).toBe(0);
    });
  });

  describe('mapProgress() - Processing Phase', () => {
    it('should return 0 for initial state', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 0,
        audioProgress: 0,
        status: 'processing'
      });

      expect(progress).toBe(0);
    });

    it('should calculate video progress with weighted average (60% video, 40% audio)', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 60,
        audioProgress: 40,
        status: 'processing'
      });

      // 60 * 0.6 + 40 * 0.4 = 36 + 16 = 52
      expect(progress).toBe(52);
    });

    it('should use only audioProgress for audio formats', () => {
      PollingProgressMapper.reset('mp3');

      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 80,
        audioProgress: 50,
        status: 'processing'
      });

      expect(progress).toBe(50);
    });

    it('should handle null progress values as 0', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: null,
        audioProgress: null,
        status: 'processing'
      });

      expect(progress).toBe(0);
    });

    it('should handle partial null values', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 60,
        audioProgress: null,
        status: 'processing'
      });

      // 60 * 0.6 + 0 * 0.4 = 36
      expect(progress).toBe(36);
    });

    it('should update lastProgress', () => {
      PollingProgressMapper.mapProgress({
        videoProgress: 50,
        audioProgress: 50,
        status: 'processing'
      });

      expect(PollingProgressMapper.lastProgress).toBe(50);
    });
  });

  describe('mapProgress() - Transition to Merging', () => {
    it('should transition to merging when video reaches 100%', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 100,
        status: 'processing'
      });

      expect(progress).toBe(100);
      expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');
    });

    it('should NOT transition if only video is 100%', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 80,
        status: 'processing'
      });

      // 100 * 0.6 + 80 * 0.4 = 60 + 32 = 92
      expect(progress).toBe(92);
      expect(PollingProgressMapper.getCurrentPhase()).toBe('processing');
    });

    it('should NOT transition if only audio is 100%', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 80,
        audioProgress: 100,
        status: 'processing'
      });

      // 80 * 0.6 + 100 * 0.4 = 48 + 40 = 88
      expect(progress).toBe(88);
      expect(PollingProgressMapper.getCurrentPhase()).toBe('processing');
    });

    it('should transition for audio format when audioProgress reaches 100%', () => {
      PollingProgressMapper.reset('mp3');

      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 50,
        audioProgress: 100,
        status: 'processing'
      });

      expect(progress).toBe(100);
      expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');
    });

    it('should handle multiple audio formats', () => {
      const formats = ['mp3', 'wav', 'opus', 'ogg', 'm4a'];

      formats.forEach(format => {
        PollingProgressMapper.reset(format);

        const progress = PollingProgressMapper.mapProgress({
          videoProgress: 50,
          audioProgress: 100,
          status: 'processing'
        });

        expect(progress).toBe(100);
        expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');
      });
    });
  });

  describe('mapProgress() - Merging Phase', () => {
    beforeEach(() => {
      // Transition to merging
      PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 100,
        status: 'processing'
      });
    });

    it('should stay at 100% during merging', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 100,
        status: 'merging'
      });

      expect(progress).toBe(100);
      expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');
    });

    it('should stay at 100% even if progress values change', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 95,
        audioProgress: 98,
        status: 'merging'
      });

      expect(progress).toBe(100);
    });
  });

  describe('mapProgress() - Completion', () => {
    it('should return 100% when mergedUrl exists', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 50,
        audioProgress: 50,
        status: 'processing',
        mergedUrl: 'https://example.com/merged.mp4'
      });

      expect(progress).toBe(100);
    });

    it('should return 100% for mergedUrl regardless of phase', () => {
      PollingProgressMapper.startMergingPhase();

      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 100,
        status: 'complete',
        mergedUrl: 'https://example.com/merged.mp4'
      });

      expect(progress).toBe(100);
    });

    it('should return 100% even with low progress if mergedUrl exists', () => {
      const progress = PollingProgressMapper.mapProgress({
        videoProgress: 0,
        audioProgress: 0,
        status: 'complete',
        mergedUrl: 'https://example.com/merged.mp4'
      });

      expect(progress).toBe(100);
    });
  });

  describe('getStatusText()', () => {
    it('should return "Processing..." during processing phase', () => {
      PollingProgressMapper.mapProgress({
        videoProgress: 50,
        audioProgress: 50,
        status: 'processing'
      });

      const statusText = PollingProgressMapper.getStatusText({
        videoProgress: 50,
        audioProgress: 50,
        status: 'processing'
      });

      expect(statusText).toBe('Processing...');
    });

    it('should return "Merging..." during merging phase', () => {
      PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 100,
        status: 'processing'
      });

      const statusText = PollingProgressMapper.getStatusText({
        videoProgress: 100,
        audioProgress: 100,
        status: 'merging'
      });

      expect(statusText).toBe('Merging...');
    });

    it('should return "Ready" when mergedUrl exists', () => {
      const statusText = PollingProgressMapper.getStatusText({
        videoProgress: 100,
        audioProgress: 100,
        status: 'complete',
        mergedUrl: 'https://example.com/merged.mp4'
      });

      expect(statusText).toBe('Ready');
    });

    it('should prioritize mergedUrl over phase', () => {
      PollingProgressMapper.startMergingPhase();

      const statusText = PollingProgressMapper.getStatusText({
        videoProgress: 100,
        audioProgress: 100,
        status: 'complete',
        mergedUrl: 'https://example.com/merged.mp4'
      });

      expect(statusText).toBe('Ready');
    });
  });

  describe('getCurrentPhase()', () => {
    it('should return "processing" initially', () => {
      expect(PollingProgressMapper.getCurrentPhase()).toBe('processing');
    });

    it('should return "merging" after transition', () => {
      PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 100,
        status: 'processing'
      });

      expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');
    });

    it('should return "merging" after manual start', () => {
      PollingProgressMapper.startMergingPhase();

      expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');
    });
  });

  describe('lastProgress', () => {
    it('should return 0 initially', () => {
      expect(PollingProgressMapper.lastProgress).toBe(0);
    });

    it('should return last calculated progress', () => {
      PollingProgressMapper.mapProgress({
        videoProgress: 60,
        audioProgress: 40,
        status: 'processing'
      });

      expect(PollingProgressMapper.lastProgress).toBe(52);
    });

    it('should return 100 after mergedUrl', () => {
      PollingProgressMapper.mapProgress({
        videoProgress: 50,
        audioProgress: 50,
        status: 'complete',
        mergedUrl: 'https://example.com/merged.mp4'
      });

      expect(PollingProgressMapper.lastProgress).toBe(100);
    });
  });

  describe('startMergingPhase()', () => {
    it('should transition to merging phase', () => {
      const progress = PollingProgressMapper.startMergingPhase();

      expect(progress).toBe(100);
      expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');
      expect(PollingProgressMapper.lastProgress).toBe(100);
    });

    it('should override current phase', () => {
      PollingProgressMapper.mapProgress({
        videoProgress: 50,
        audioProgress: 50,
        status: 'processing'
      });

      expect(PollingProgressMapper.getCurrentPhase()).toBe('processing');

      PollingProgressMapper.startMergingPhase();

      expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete video conversion flow', () => {
      // Start
      let progress = PollingProgressMapper.mapProgress({
        videoProgress: 0,
        audioProgress: 0,
        status: 'processing'
      });
      expect(progress).toBe(0);
      expect(PollingProgressMapper.getStatusText({
        videoProgress: 0,
        audioProgress: 0,
        status: 'processing'
      })).toBe('Processing...');

      // Mid-progress
      progress = PollingProgressMapper.mapProgress({
        videoProgress: 60,
        audioProgress: 40,
        status: 'processing'
      });
      expect(progress).toBe(52);

      // Both complete → transition to merging
      progress = PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 100,
        status: 'processing'
      });
      expect(progress).toBe(100);
      expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');
      expect(PollingProgressMapper.getStatusText({
        videoProgress: 100,
        audioProgress: 100,
        status: 'merging'
      })).toBe('Merging...');

      // Merging continues
      progress = PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 100,
        status: 'merging'
      });
      expect(progress).toBe(100);

      // Complete
      progress = PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 100,
        status: 'complete',
        mergedUrl: 'https://example.com/merged.mp4'
      });
      expect(progress).toBe(100);
      expect(PollingProgressMapper.getStatusText({
        videoProgress: 100,
        audioProgress: 100,
        status: 'complete',
        mergedUrl: 'https://example.com/merged.mp4'
      })).toBe('Ready');
    });

    it('should handle complete audio conversion flow', () => {
      PollingProgressMapper.reset('mp3');

      // Start
      let progress = PollingProgressMapper.mapProgress({
        videoProgress: 0,
        audioProgress: 0,
        status: 'processing'
      });
      expect(progress).toBe(0);

      // Mid-progress (ignore videoProgress for audio)
      progress = PollingProgressMapper.mapProgress({
        videoProgress: 80,
        audioProgress: 50,
        status: 'processing'
      });
      expect(progress).toBe(50);

      // Audio complete → transition to merging
      progress = PollingProgressMapper.mapProgress({
        videoProgress: 50,
        audioProgress: 100,
        status: 'processing'
      });
      expect(progress).toBe(100);
      expect(PollingProgressMapper.getCurrentPhase()).toBe('merging');

      // Complete
      progress = PollingProgressMapper.mapProgress({
        videoProgress: 100,
        audioProgress: 100,
        status: 'complete',
        mergedUrl: 'https://example.com/audio.mp3'
      });
      expect(progress).toBe(100);
    });
  });
});
