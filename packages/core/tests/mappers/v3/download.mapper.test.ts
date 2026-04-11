/**
 * V3 Download Mapper Tests
 * Tests for mapToV3DownloadRequest and detectOsType
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapToV3DownloadRequest, detectOsType } from '@/mappers/v3/download.mapper';
import type { ExtractV2Options } from '@/mappers/v3/download.mapper';

describe('download.mapper', () => {

  // ==========================================
  // detectOsType
  // ==========================================
  describe('detectOsType', () => {
    const originalNavigator = globalThis.navigator;

    afterEach(() => {
      // Restore original navigator
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it('returns "windows" when navigator is undefined', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('windows');
    });

    it('detects iOS from iPhone user agent', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('ios');
    });

    it('detects iOS from iPad user agent', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)' },
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('ios');
    });

    it('detects iOS from iPod user agent', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 16_0 like Mac OS X)' },
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('ios');
    });

    it('detects Android from user agent', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S908B)' },
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('android');
    });

    it('detects macOS from user agent', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('macos');
    });

    it('detects Windows from user agent', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('windows');
    });

    it('detects Linux from user agent', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' },
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('linux');
    });

    it('detects iOS from userAgentData platform', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'some generic agent',
          userAgentData: { platform: 'iOS' },
        },
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('ios');
    });

    it('detects macOS from userAgentData platform', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'some generic agent',
          userAgentData: { platform: 'macOS' },
        },
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('macos');
    });

    it('defaults to "windows" for unknown user agent', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'UnknownBot/1.0' },
        writable: true,
        configurable: true,
      });
      expect(detectOsType()).toBe('windows');
    });
  });

  // ==========================================
  // mapToV3DownloadRequest - Video
  // ==========================================
  describe('mapToV3DownloadRequest - video', () => {
    const url = 'https://www.youtube.com/watch?v=test123';

    it('maps basic video download request', () => {
      const options: ExtractV2Options = {
        downloadMode: 'video',
        videoQuality: '1080',
        youtubeVideoContainer: 'mp4',
      };

      const result = mapToV3DownloadRequest(url, options);

      expect(result.url).toBe(url);
      expect(result.output.type).toBe('video');
      expect(result.output.format).toBe('mp4');
      expect(result.output.quality).toBe('1080p');
      expect(result.os).toBeDefined();
    });

    it('maps video quality with "p" suffix correctly', () => {
      const options: ExtractV2Options = {
        downloadMode: 'video',
        videoQuality: '720p',
        youtubeVideoContainer: 'mp4',
      };

      const result = mapToV3DownloadRequest(url, options);
      expect(result.output.quality).toBe('720p');
    });

    it('maps all video quality levels', () => {
      const qualities = ['2160', '1440', '1080', '720', '480', '360', '144'];
      const expected = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '144p'];

      qualities.forEach((q, i) => {
        const result = mapToV3DownloadRequest(url, {
          downloadMode: 'video',
          videoQuality: q,
        });
        expect(result.output.quality).toBe(expected[i]);
      });
    });

    it('maps undefined quality to undefined', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
      });
      expect(result.output.quality).toBeUndefined();
    });

    it('maps unknown quality to undefined', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        videoQuality: '999',
      });
      expect(result.output.quality).toBeUndefined();
    });

    it('maps video container formats (mp4, webm, mkv)', () => {
      const containers = ['mp4', 'webm', 'mkv'];
      containers.forEach(c => {
        const result = mapToV3DownloadRequest(url, {
          downloadMode: 'video',
          youtubeVideoContainer: c,
        });
        expect(result.output.format).toBe(c);
      });
    });

    it('defaults to mp4 when no container specified', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
      });
      expect(result.output.format).toBe('mp4');
    });

    it('defaults to mp4 for unknown container', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        youtubeVideoContainer: 'avi',
      });
      expect(result.output.format).toBe('mp4');
    });

    it('always includes audio config for video with default 128k', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
      });
      expect(result.audio).toBeDefined();
      expect(result.audio!.bitrate).toBe('128k');
    });

    it('includes custom audio bitrate for video', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        audioBitrate: '320',
      });
      expect(result.audio!.bitrate).toBe('320k');
    });

    it('includes trackId in audio config when not "original"', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        trackId: 'en',
      });
      expect(result.audio!.trackId).toBe('en');
    });

    it('excludes trackId when value is "original"', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        trackId: 'original',
      });
      expect(result.audio!.trackId).toBeUndefined();
    });

    it('excludes trackId when empty string', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        trackId: '',
      });
      expect(result.audio!.trackId).toBeUndefined();
    });
  });

  // ==========================================
  // mapToV3DownloadRequest - Audio
  // ==========================================
  describe('mapToV3DownloadRequest - audio', () => {
    const url = 'https://www.youtube.com/watch?v=test123';

    it('maps basic audio download request', () => {
      const options: ExtractV2Options = {
        downloadMode: 'audio',
        audioFormat: 'mp3',
        audioBitrate: '128',
      };

      const result = mapToV3DownloadRequest(url, options);

      expect(result.output.type).toBe('audio');
      expect(result.output.format).toBe('mp3');
      expect(result.audio!.bitrate).toBe('128k');
    });

    it('maps all audio formats', () => {
      const formats = ['mp3', 'm4a', 'wav', 'opus', 'ogg', 'flac'];
      formats.forEach(f => {
        const result = mapToV3DownloadRequest(url, {
          downloadMode: 'audio',
          audioFormat: f,
        });
        expect(result.output.format).toBe(f);
      });
    });

    it('defaults to mp3 when no audio format specified', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'audio',
      });
      expect(result.output.format).toBe('mp3');
    });

    it('defaults to mp3 for unknown audio format', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'audio',
        audioFormat: 'aac',
      });
      expect(result.output.format).toBe('mp3');
    });

    it('maps audio bitrate values', () => {
      const bitrates = [
        { input: '64', expected: '64k' },
        { input: '128', expected: '128k' },
        { input: '192', expected: '192k' },
        { input: '256', expected: '192k' }, // Maps to closest available
        { input: '320', expected: '320k' },
      ];

      bitrates.forEach(({ input, expected }) => {
        const result = mapToV3DownloadRequest(url, {
          downloadMode: 'audio',
          audioBitrate: input,
        });
        expect(result.audio!.bitrate).toBe(expected);
      });
    });

    it('defaults to 128k for unknown bitrate', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'audio',
        audioBitrate: '999',
      });
      expect(result.audio!.bitrate).toBe('128k');
    });

    it('does not include audio config when no bitrate or trackId', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'audio',
        audioFormat: 'mp3',
      });
      expect(result.audio).toBeUndefined();
    });

    it('includes audio config with trackId for audio download', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'audio',
        trackId: 'ja',
      });
      expect(result.audio!.trackId).toBe('ja');
    });

    it('handles case-insensitive audio format', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'audio',
        audioFormat: 'MP3',
      });
      expect(result.output.format).toBe('mp3');
    });
  });

  // ==========================================
  // mapToV3DownloadRequest - Trim
  // ==========================================
  describe('mapToV3DownloadRequest - trim', () => {
    const url = 'https://www.youtube.com/watch?v=test123';

    it('includes trim when trimStart is set', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        trimStart: 10,
      });
      expect(result.trim).toBeDefined();
      expect(result.trim!.start).toBe(10);
      expect(result.trim!.end).toBeUndefined();
    });

    it('includes trim when trimEnd is set', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        trimEnd: 60,
      });
      expect(result.trim).toBeDefined();
      expect(result.trim!.end).toBe(60);
      expect(result.trim!.start).toBeUndefined();
    });

    it('includes both start and end in trim', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        trimStart: 10,
        trimEnd: 60,
      });
      expect(result.trim).toEqual({ start: 10, end: 60 });
    });

    it('does not include trim when neither start nor end set', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
      });
      expect(result.trim).toBeUndefined();
    });

    it('handles trimStart = 0 correctly (valid trim)', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        trimStart: 0,
      });
      expect(result.trim).toBeDefined();
      expect(result.trim!.start).toBe(0);
    });

    it('includes trim for audio downloads too', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'audio',
        trimStart: 5,
        trimEnd: 30,
      });
      expect(result.trim).toEqual({ start: 5, end: 30 });
    });
  });

  // ==========================================
  // mapToV3DownloadRequest - Optional fields
  // ==========================================
  describe('mapToV3DownloadRequest - optional fields', () => {
    const url = 'https://www.youtube.com/watch?v=test123';

    it('includes filenameStyle when set', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
        filenameStyle: 'pretty',
      });
      expect(result.filenameStyle).toBe('pretty');
    });

    it('does not include filenameStyle when not set', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'video',
      });
      expect(result.filenameStyle).toBeUndefined();
    });

    it('includes enableMetadata when explicitly true', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'audio',
        enableMetadata: true,
      });
      expect(result.enableMetadata).toBe(true);
    });

    it('includes enableMetadata when explicitly false', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'audio',
        enableMetadata: false,
      });
      expect(result.enableMetadata).toBe(false);
    });

    it('does not include enableMetadata when not set', () => {
      const result = mapToV3DownloadRequest(url, {
        downloadMode: 'audio',
      });
      expect(result.enableMetadata).toBeUndefined();
    });
  });

  // ==========================================
  // mapToV3DownloadRequest - Default mode
  // ==========================================
  describe('mapToV3DownloadRequest - default mode', () => {
    const url = 'https://www.youtube.com/watch?v=test123';

    it('treats undefined downloadMode as audio', () => {
      const result = mapToV3DownloadRequest(url, {});
      expect(result.output.type).toBe('audio');
      expect(result.output.format).toBe('mp3');
    });
  });
});
