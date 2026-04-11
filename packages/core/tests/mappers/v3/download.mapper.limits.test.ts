/**
 * V3 Download Mapper — Premium Feature Limit Tests
 *
 * Test mapping cho quality levels bị giới hạn bởi premium features:
 * - 4K (2160p) → FEATURE_KEYS.HIGH_QUALITY_4K
 * - 2K (1440p) → FEATURE_KEYS.HIGH_QUALITY_2K
 * - 320kbps   → FEATURE_KEYS.HIGH_QUALITY_320K
 * - Trim/Cut  → FEATURE_KEYS.CUT_VIDEO_YOUTUBE
 *
 * Test rằng mapper tạo đúng request cho từng premium tier,
 * và fallback khi limit reached.
 */

import { describe, it, expect } from 'vitest';
import { mapToV3DownloadRequest } from '@/mappers/v3/download.mapper';
import type { ExtractV2Options } from '@/mappers/v3/download.mapper';

const URL = 'https://www.youtube.com/watch?v=test123';

describe('Download Mapper — Premium Quality Tiers', () => {

  // ==========================================
  // 4K (2160p) — FEATURE_KEYS.HIGH_QUALITY_4K
  // ==========================================
  describe('4K (2160p) — download_4k', () => {
    it('maps 2160p MP4 correctly', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '2160',
        youtubeVideoContainer: 'mp4',
      });
      expect(r.output.quality).toBe('2160p');
      expect(r.output.format).toBe('mp4');
      expect(r.output.type).toBe('video');
    });

    it('maps 2160p WEBM correctly', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '2160',
        youtubeVideoContainer: 'webm',
      });
      expect(r.output.quality).toBe('2160p');
      expect(r.output.format).toBe('webm');
    });

    it('maps 2160p MKV correctly', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '2160',
        youtubeVideoContainer: 'mkv',
      });
      expect(r.output.quality).toBe('2160p');
      expect(r.output.format).toBe('mkv');
    });

    it('4K with all audio bitrates', () => {
      const bitrates = ['64', '128', '192', '320'];
      for (const br of bitrates) {
        const r = mapToV3DownloadRequest(URL, {
          downloadMode: 'video',
          videoQuality: '2160',
          audioBitrate: br,
        });
        expect(r.output.quality).toBe('2160p');
        expect(r.audio?.bitrate).toBeTruthy();
      }
    });

    it('4K with trim (cut video)', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '2160',
        trimStart: 0,
        trimEnd: 120,
      });
      expect(r.output.quality).toBe('2160p');
      expect(r.trim).toEqual({ start: 0, end: 120 });
    });
  });

  // ==========================================
  // 2K (1440p) — FEATURE_KEYS.HIGH_QUALITY_2K
  // ==========================================
  describe('2K (1440p) — download_2k', () => {
    it('maps 1440p MP4 correctly', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '1440',
        youtubeVideoContainer: 'mp4',
      });
      expect(r.output.quality).toBe('1440p');
      expect(r.output.format).toBe('mp4');
    });

    it('maps 1440p with "p" suffix', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '1440p',
      });
      expect(r.output.quality).toBe('1440p');
    });

    it('1440p WEBM + audio track', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '1440',
        youtubeVideoContainer: 'webm',
        trackId: 'ja',
      });
      expect(r.output.quality).toBe('1440p');
      expect(r.output.format).toBe('webm');
      expect(r.audio?.trackId).toBe('ja');
    });
  });

  // ==========================================
  // 320kbps — FEATURE_KEYS.HIGH_QUALITY_320K
  // ==========================================
  describe('320kbps — download_320kbps', () => {
    it('maps MP3 320kbps correctly', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'audio',
        audioFormat: 'mp3',
        audioBitrate: '320',
      });
      expect(r.output.type).toBe('audio');
      expect(r.output.format).toBe('mp3');
      expect(r.audio?.bitrate).toBe('320k');
    });

    it('320kbps with all audio formats', () => {
      const formats = ['mp3', 'm4a', 'wav', 'opus', 'ogg', 'flac'];
      for (const fmt of formats) {
        const r = mapToV3DownloadRequest(URL, {
          downloadMode: 'audio',
          audioFormat: fmt,
          audioBitrate: '320',
        });
        expect(r.output.format).toBe(fmt);
        expect(r.audio?.bitrate).toBe('320k');
      }
    });

    it('320kbps with trim', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'audio',
        audioFormat: 'mp3',
        audioBitrate: '320',
        trimStart: 30,
        trimEnd: 90,
      });
      expect(r.audio?.bitrate).toBe('320k');
      expect(r.trim).toEqual({ start: 30, end: 90 });
    });

    it('320kbps with audio track selection', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'audio',
        audioFormat: 'mp3',
        audioBitrate: '320',
        trackId: 'es',
      });
      expect(r.audio?.bitrate).toBe('320k');
      expect(r.audio?.trackId).toBe('es');
    });
  });

  // ==========================================
  // Trim/Cut — FEATURE_KEYS.CUT_VIDEO_YOUTUBE
  // ==========================================
  describe('Trim/Cut — cut_video_youtube', () => {
    it('video trim start + end', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '720',
        trimStart: 10,
        trimEnd: 60,
      });
      expect(r.trim).toEqual({ start: 10, end: 60 });
    });

    it('audio trim', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'audio',
        audioFormat: 'mp3',
        trimStart: 0,
        trimEnd: 30,
      });
      expect(r.trim).toEqual({ start: 0, end: 30 });
    });

    it('trim only start (clip from point)', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        trimStart: 120,
      });
      expect(r.trim).toEqual({ start: 120 });
    });

    it('trim only end (clip to point)', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        trimEnd: 300,
      });
      expect(r.trim).toEqual({ end: 300 });
    });

    it('no trim when both undefined', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        trimStart: undefined,
        trimEnd: undefined,
      });
      expect(r.trim).toBeUndefined();
    });
  });

  // ==========================================
  // Fallback scenarios (when limit reached → downgrade quality)
  // ==========================================
  describe('Fallback quality (when premium limit reached)', () => {
    it('fallback from 4K to 720p', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '720', // downgraded from 2160
      });
      expect(r.output.quality).toBe('720p');
    });

    it('fallback from 2K to 1080p', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '1080', // downgraded from 1440
      });
      expect(r.output.quality).toBe('1080p');
    });

    it('fallback from 320kbps to 128kbps', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'audio',
        audioFormat: 'mp3',
        audioBitrate: '128', // downgraded from 320
      });
      expect(r.audio?.bitrate).toBe('128k');
    });
  });

  // ==========================================
  // Combined premium features
  // ==========================================
  describe('Combined premium: 4K + 320kbps + trim', () => {
    it('4K video with 320kbps audio and trim', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '2160',
        youtubeVideoContainer: 'mp4',
        audioBitrate: '320',
        trimStart: 10,
        trimEnd: 120,
        filenameStyle: 'pretty',
        enableMetadata: true,
      });

      expect(r.output.quality).toBe('2160p');
      expect(r.output.format).toBe('mp4');
      expect(r.audio?.bitrate).toBe('320k');
      expect(r.trim).toEqual({ start: 10, end: 120 });
      expect(r.filenameStyle).toBe('pretty');
      expect(r.enableMetadata).toBe(true);
    });

    it('2K WEBM with track selection and trim', () => {
      const r = mapToV3DownloadRequest(URL, {
        downloadMode: 'video',
        videoQuality: '1440',
        youtubeVideoContainer: 'webm',
        audioBitrate: '192',
        trackId: 'ko',
        trimStart: 0,
        trimEnd: 60,
      });

      expect(r.output.quality).toBe('1440p');
      expect(r.output.format).toBe('webm');
      expect(r.audio?.bitrate).toBe('192k');
      expect(r.audio?.trackId).toBe('ko');
      expect(r.trim).toEqual({ start: 0, end: 60 });
    });
  });
});
