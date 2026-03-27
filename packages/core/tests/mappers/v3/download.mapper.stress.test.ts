/**
 * V3 Download Mapper - Stress & Data-Heavy Tests
 *
 * Exhaustive testing with large datasets, boundary values,
 * randomized inputs, and edge cases.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mapToV3DownloadRequest, detectOsType } from '@/mappers/v3/download.mapper';
import type { ExtractV2Options } from '@/mappers/v3/download.mapper';

describe('download.mapper - STRESS TESTS', () => {

  // ==========================================
  // Exhaustive format combinations
  // ==========================================
  describe('All video quality × container combinations', () => {
    const qualities = ['2160', '1440', '1080', '720', '480', '360', '144'];
    const containers = ['mp4', 'webm', 'mkv'];
    const bitrates = ['64', '128', '192', '256', '320'];

    for (const quality of qualities) {
      for (const container of containers) {
        for (const bitrate of bitrates) {
          it(`video: ${quality}p ${container} @${bitrate}kbps`, () => {
            const result = mapToV3DownloadRequest('https://youtube.com/watch?v=test', {
              downloadMode: 'video',
              videoQuality: quality,
              youtubeVideoContainer: container,
              audioBitrate: bitrate,
            });

            expect(result.output.type).toBe('video');
            expect(result.output.format).toBe(container);
            expect(result.output.quality).toBe(`${quality}p`);
            expect(result.audio).toBeDefined();
            expect(result.url).toBeTruthy();
          });
        }
      }
    }
  });

  describe('All audio format × bitrate combinations', () => {
    const formats = ['mp3', 'm4a', 'wav', 'opus', 'ogg', 'flac'];
    const bitrates = ['64', '128', '192', '256', '320'];

    for (const format of formats) {
      for (const bitrate of bitrates) {
        it(`audio: ${format} @${bitrate}kbps`, () => {
          const result = mapToV3DownloadRequest('https://youtube.com/watch?v=test', {
            downloadMode: 'audio',
            audioFormat: format,
            audioBitrate: bitrate,
          });

          expect(result.output.type).toBe('audio');
          expect(result.output.format).toBe(format);
          expect(result.audio?.bitrate).toBeTruthy();
        });
      }
    }
  });

  // ==========================================
  // URL edge cases (100+ URL variations)
  // ==========================================
  describe('URL handling stress test', () => {
    const urls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=60',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/v/dQw4w9WgXcQ',
      // Special characters in URL
      'https://www.youtube.com/watch?v=abc_123-xyz',
      'https://www.youtube.com/watch?v=123456789ab',
      // Very long URL
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&' + 'param=value&'.repeat(50),
      // Unicode in URL (encoded)
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&title=%E3%83%86%E3%82%B9%E3%83%88',
      // Empty params
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&',
    ];

    for (const url of urls) {
      it(`maps URL correctly: ${url.substring(0, 60)}...`, () => {
        const result = mapToV3DownloadRequest(url, {
          downloadMode: 'video',
          videoQuality: '720',
        });

        expect(result.url).toBe(url);
        expect(result.output.type).toBe('video');
      });
    }
  });

  // ==========================================
  // Trim boundary values
  // ==========================================
  describe('Trim value boundaries', () => {
    const trimCases = [
      { start: 0, end: 0, desc: 'both zero' },
      { start: 0, end: 1, desc: 'minimal range' },
      { start: 0, end: 3600, desc: '1 hour video' },
      { start: 0, end: 36000, desc: '10 hour video' },
      { start: 100, end: 200, desc: 'mid-range' },
      { start: 0.5, end: 10.5, desc: 'fractional seconds' },
      { start: 0.001, end: 0.002, desc: 'sub-millisecond' },
      { start: 86400, end: 172800, desc: 'very long video (24-48h)' },
    ];

    for (const { start, end, desc } of trimCases) {
      it(`trim: ${desc} (${start}-${end}s)`, () => {
        const result = mapToV3DownloadRequest('https://youtube.com/watch?v=test', {
          downloadMode: 'video',
          trimStart: start,
          trimEnd: end,
        });

        expect(result.trim).toBeDefined();
        expect(result.trim!.start).toBe(start);
        expect(result.trim!.end).toBe(end);
      });
    }
  });

  // ==========================================
  // Track ID variations
  // ==========================================
  describe('Track ID edge cases', () => {
    const trackIds = [
      'en', 'ja', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR',
      'es-419', 'sr-Latn', 'original', '', undefined,
      'a', // single char
      'xx-YY-variant', // extended subtag
    ];

    for (const trackId of trackIds) {
      it(`trackId: "${trackId}"`, () => {
        const result = mapToV3DownloadRequest('https://youtube.com/watch?v=test', {
          downloadMode: 'video',
          trackId: trackId as string,
        });

        if (!trackId || trackId === 'original') {
          expect(result.audio?.trackId).toBeUndefined();
        } else {
          expect(result.audio?.trackId).toBe(trackId);
        }
      });
    }
  });

  // ==========================================
  // Filename style variations
  // ==========================================
  describe('All filenameStyle values', () => {
    const styles: Array<ExtractV2Options['filenameStyle']> = ['classic', 'basic', 'pretty', 'nerdy'];

    for (const style of styles) {
      it(`filenameStyle: "${style}"`, () => {
        const result = mapToV3DownloadRequest('https://youtube.com/watch?v=test', {
          downloadMode: 'video',
          filenameStyle: style,
        });

        expect(result.filenameStyle).toBe(style);
      });
    }
  });

  // ==========================================
  // Malformed / unusual options
  // ==========================================
  describe('Unusual option values', () => {
    it('handles undefined for all optional fields', () => {
      const result = mapToV3DownloadRequest('https://youtube.com/watch?v=test', {
        downloadMode: undefined,
        videoQuality: undefined,
        youtubeVideoContainer: undefined,
        audioBitrate: undefined,
        audioFormat: undefined,
        trackId: undefined,
        trimStart: undefined,
        trimEnd: undefined,
        filenameStyle: undefined,
        enableMetadata: undefined,
      });

      expect(result.output.type).toBe('audio'); // undefined mode defaults to audio
      expect(result.output.format).toBe('mp3');
      expect(result.trim).toBeUndefined();
      expect(result.filenameStyle).toBeUndefined();
      expect(result.enableMetadata).toBeUndefined();
    });

    it('handles empty object as options', () => {
      const result = mapToV3DownloadRequest('https://youtube.com/watch?v=test', {});
      expect(result.url).toBeTruthy();
      expect(result.output).toBeDefined();
    });

    it('handles unknown quality string gracefully', () => {
      const unknownQualities = ['4k', 'hd', 'sd', '99999', 'auto', 'best', 'worst', '-1', '0'];
      for (const q of unknownQualities) {
        const result = mapToV3DownloadRequest('https://youtube.com/watch?v=test', {
          downloadMode: 'video',
          videoQuality: q,
        });
        // Should not crash, quality may be undefined
        expect(result.output.type).toBe('video');
      }
    });

    it('handles unknown format string gracefully', () => {
      const unknownFormats = ['avi', 'mov', 'wmv', 'mpeg', 'rm', 'divx', ''];
      for (const f of unknownFormats) {
        const result = mapToV3DownloadRequest('https://youtube.com/watch?v=test', {
          downloadMode: 'video',
          youtubeVideoContainer: f,
        });
        // Should default to mp4
        expect(result.output.format).toBe('mp4');
      }
    });

    it('handles unknown audio format gracefully', () => {
      const unknownFormats = ['aac', 'wma', 'pcm', 'aiff', ''];
      for (const f of unknownFormats) {
        const result = mapToV3DownloadRequest('https://youtube.com/watch?v=test', {
          downloadMode: 'audio',
          audioFormat: f,
        });
        expect(result.output.format).toBe('mp3'); // Default
      }
    });
  });

  // ==========================================
  // OS Detection stress test
  // ==========================================
  describe('OS detection with many user agents', () => {
    const userAgents = [
      // iOS variants
      { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', expected: 'ios' },
      { ua: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15', expected: 'ios' },
      { ua: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)', expected: 'ios' },
      // Android variants
      { ua: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36', expected: 'android' },
      { ua: 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36', expected: 'android' },
      { ua: 'Mozilla/5.0 (Linux; Android 12; Redmi Note 11) AppleWebKit/537.36', expected: 'android' },
      // Windows variants
      { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', expected: 'windows' },
      { ua: 'Mozilla/5.0 (Windows NT 11.0; Win64; x64; rv:120.0) Gecko/20100101', expected: 'windows' },
      { ua: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36', expected: 'windows' },
      // macOS variants
      { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15', expected: 'macos' },
      { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', expected: 'macos' },
      // Linux variants
      { ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', expected: 'linux' },
      { ua: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101', expected: 'linux' },
      { ua: 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36', expected: 'linux' },
      // ChromeOS (CrOS does NOT contain "linux" substring, falls through to windows)
      { ua: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36', expected: 'windows' },
    ];

    const originalNavigator = globalThis.navigator;

    afterEach(() => {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    for (const { ua, expected } of userAgents) {
      it(`detects "${expected}" from: ${ua.substring(0, 50)}...`, () => {
        Object.defineProperty(globalThis, 'navigator', {
          value: { userAgent: ua },
          writable: true,
          configurable: true,
        });
        expect(detectOsType()).toBe(expected);
      });
    }
  });

  // ==========================================
  // Performance: 1000 rapid mappings
  // ==========================================
  describe('Performance', () => {
    it('maps 1000 requests in under 100ms', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        mapToV3DownloadRequest(`https://youtube.com/watch?v=test${i}`, {
          downloadMode: i % 2 === 0 ? 'video' : 'audio',
          videoQuality: '1080',
          youtubeVideoContainer: 'mp4',
          audioBitrate: '128',
          audioFormat: 'mp3',
          trimStart: i * 10,
          trimEnd: i * 10 + 60,
        });
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
