/**
 * Conversion Types Tests
 *
 * Comprehensive tests for all conversion-related types, enums, and utilities.
 * Target: 20+ tests covering all functions and edge cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TaskState,
  RouteType,
  FileFormat,
  isAudioFormat,
  parseFileFormat,
  getSizeMB,
  determineRoute,
  calculateDisplayProgress,
  createApiProgressData,
  createExtractResult,
  type ExtractResult,
  type FormatData,
  type ApiProgressData
} from './index';

// Mock platform detection
vi.mock('../../utils/platform-detection', () => ({
  isIOS: vi.fn(() => false),
  isWindows: vi.fn(() => false),
  isAndroid: vi.fn(() => false),
  isMac: vi.fn(() => false),
  isMobile: vi.fn(() => false),
  isDesktop: vi.fn(() => true),
  getPlatform: vi.fn(() => 'unknown' as const)
}));

import * as platformDetection from '../../utils/platform-detection';

describe('TaskState Enum', () => {
  it('should have lowercase values', () => {
    expect(TaskState.IDLE).toBe('idle');
    expect(TaskState.EXTRACTING).toBe('extracting');
    expect(TaskState.PROCESSING).toBe('processing');
    expect(TaskState.POLLING).toBe('polling');
    expect(TaskState.DOWNLOADING).toBe('downloading');
    expect(TaskState.SUCCESS).toBe('success');
    expect(TaskState.FAILED).toBe('failed');
    expect(TaskState.CANCELED).toBe('canceled');
  });

  it('should have all expected states', () => {
    const states = Object.values(TaskState);
    expect(states).toHaveLength(8);
    expect(states).toContain('idle');
    expect(states).toContain('success');
    expect(states).toContain('failed');
  });
});

describe('RouteType Enum', () => {
  it('should have all routing strategies', () => {
    expect(RouteType.STATIC_DIRECT).toBe('static_direct');
    expect(RouteType.IOS_RAM).toBe('ios_ram');
    expect(RouteType.IOS_POLLING).toBe('ios_polling');
    expect(RouteType.WINDOWS_MP4_POLLING).toBe('windows_mp4_polling');
    expect(RouteType.OTHER_STREAM).toBe('other_stream');
  });
});

describe('FileFormat Enum', () => {
  it('should have all supported formats', () => {
    expect(FileFormat.MP4).toBe('mp4');
    expect(FileFormat.WEBM).toBe('webm');
    expect(FileFormat.MP3).toBe('mp3');
    expect(FileFormat.WAV).toBe('wav');
    expect(FileFormat.OPUS).toBe('opus');
    expect(FileFormat.OGG).toBe('ogg');
    expect(FileFormat.M4A).toBe('m4a');
  });
});

describe('isAudioFormat', () => {
  it('should return true for audio formats', () => {
    expect(isAudioFormat('mp3')).toBe(true);
    expect(isAudioFormat('wav')).toBe(true);
    expect(isAudioFormat('opus')).toBe(true);
    expect(isAudioFormat('ogg')).toBe(true);
    expect(isAudioFormat('m4a')).toBe(true);
    expect(isAudioFormat('audio')).toBe(true);
  });

  it('should return true for uppercase audio formats', () => {
    expect(isAudioFormat('MP3')).toBe(true);
    expect(isAudioFormat('WAV')).toBe(true);
    expect(isAudioFormat('AUDIO')).toBe(true);
  });

  it('should return false for video formats', () => {
    expect(isAudioFormat('mp4')).toBe(false);
    expect(isAudioFormat('webm')).toBe(false);
    expect(isAudioFormat('video')).toBe(false);
  });

  it('should return false for unknown formats', () => {
    expect(isAudioFormat('avi')).toBe(false);
    expect(isAudioFormat('mkv')).toBe(false);
    expect(isAudioFormat('')).toBe(false);
  });
});

describe('parseFileFormat', () => {
  it('should parse valid formats', () => {
    expect(parseFileFormat('mp4')).toBe(FileFormat.MP4);
    expect(parseFileFormat('mp3')).toBe(FileFormat.MP3);
    expect(parseFileFormat('webm')).toBe(FileFormat.WEBM);
    expect(parseFileFormat('wav')).toBe(FileFormat.WAV);
    expect(parseFileFormat('opus')).toBe(FileFormat.OPUS);
    expect(parseFileFormat('ogg')).toBe(FileFormat.OGG);
    expect(parseFileFormat('m4a')).toBe(FileFormat.M4A);
  });

  it('should handle uppercase input', () => {
    expect(parseFileFormat('MP4')).toBe(FileFormat.MP4);
    expect(parseFileFormat('MP3')).toBe(FileFormat.MP3);
  });

  it('should handle whitespace', () => {
    expect(parseFileFormat(' mp4 ')).toBe(FileFormat.MP4);
    expect(parseFileFormat('  mp3  ')).toBe(FileFormat.MP3);
  });

  it('should return null for invalid formats', () => {
    expect(parseFileFormat('avi')).toBeNull();
    expect(parseFileFormat('mkv')).toBeNull();
    expect(parseFileFormat('')).toBeNull();
    expect(parseFileFormat('unknown')).toBeNull();
  });
});

describe('getSizeMB', () => {
  it('should convert bytes to MB correctly', () => {
    const result: ExtractResult = {
      url: 'test.mp3',
      filename: 'test.mp3',
      size: 10485760, // 10 MB
      status: 'static',
      progressUrl: null
    };
    expect(getSizeMB(result)).toBe(10);
  });

  it('should round to nearest MB', () => {
    const result: ExtractResult = {
      url: 'test.mp3',
      filename: 'test.mp3',
      size: 5767168, // 5.5 MB
      status: 'static',
      progressUrl: null
    };
    expect(getSizeMB(result)).toBe(6); // Rounded up
  });

  it('should return 0 for null size', () => {
    const result: ExtractResult = {
      url: 'test.mp3',
      filename: 'test.mp3',
      size: null,
      status: 'stream',
      progressUrl: '/progress/123'
    };
    expect(getSizeMB(result)).toBe(0);
  });

  it('should handle large files', () => {
    const result: ExtractResult = {
      url: 'test.mp4',
      filename: 'test.mp4',
      size: 524288000, // 500 MB
      status: 'stream',
      progressUrl: null
    };
    expect(getSizeMB(result)).toBe(500);
  });
});

describe('determineRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should route static content to STATIC_DIRECT', () => {
    const extractResult: ExtractResult = {
      url: 'https://cdn.example.com/video.mp4',
      filename: 'video.mp4',
      size: 10485760, // 10 MB
      status: 'static',
      progressUrl: null
    };

    const formatData: FormatData = {
      id: 'video|mp4-1080p',
      category: 'video',
      type: 'mp4',
      quality: '1080p',
      size: 10485760,
      url: 'https://cdn.example.com/video.mp4',
      vid: null,
      key: null,
      encryptedUrl: null,
      isFakeData: false
    };

    const decision = determineRoute(extractResult, formatData);

    expect(decision.routeType).toBe(RouteType.STATIC_DIRECT);
    expect(decision.platform).toBe('any');
    expect(decision.format).toBe('mp4');
    expect(decision.sizeMB).toBe(10);
    expect(decision.description).toBe('Static file direct download');
  });

  it('should route iOS audio ≤150MB to IOS_RAM', () => {
    vi.mocked(platformDetection.isIOS).mockReturnValue(true);

    const extractResult: ExtractResult = {
      url: 'https://stream.example.com/audio.mp3',
      filename: 'audio.mp3',
      size: 104857600, // 100 MB
      status: 'stream',
      progressUrl: '/progress/abc'
    };

    const formatData: FormatData = {
      id: 'audio|mp3-320kbps',
      category: 'audio',
      type: 'mp3',
      quality: '320kbps',
      size: 104857600,
      url: null,
      vid: 'abc123',
      key: 'key456',
      encryptedUrl: null,
      isFakeData: false
    };

    const decision = determineRoute(extractResult, formatData);

    expect(decision.routeType).toBe(RouteType.IOS_RAM);
    expect(decision.platform).toBe('iOS');
    expect(decision.format).toBe('mp3');
    expect(decision.sizeMB).toBe(100);
    expect(decision.description).toContain('iOS audio stream');
    expect(decision.description).toContain('RAM download');
  });

  it('should route iOS audio >150MB to IOS_POLLING', () => {
    vi.mocked(platformDetection.isIOS).mockReturnValue(true);

    const extractResult: ExtractResult = {
      url: 'https://stream.example.com/audio.mp3',
      filename: 'audio.mp3',
      size: 209715200, // 200 MB
      status: 'stream',
      progressUrl: '/progress/xyz'
    };

    const formatData: FormatData = {
      id: 'audio|mp3-320kbps',
      category: 'audio',
      type: 'mp3',
      quality: '320kbps',
      size: 209715200,
      url: null,
      vid: 'xyz789',
      key: 'key999',
      encryptedUrl: null,
      isFakeData: false
    };

    const decision = determineRoute(extractResult, formatData);

    expect(decision.routeType).toBe(RouteType.IOS_POLLING);
    expect(decision.platform).toBe('iOS');
    expect(decision.format).toBe('mp3');
    expect(decision.sizeMB).toBe(200);
    expect(decision.description).toContain('server polling');
  });

  it('should route iOS video to IOS_POLLING', () => {
    vi.mocked(platformDetection.isIOS).mockReturnValue(true);

    const extractResult: ExtractResult = {
      url: 'https://stream.example.com/video.mp4',
      filename: 'video.mp4',
      size: 52428800, // 50 MB
      status: 'stream',
      progressUrl: '/progress/vid'
    };

    const formatData: FormatData = {
      id: 'video|mp4-1080p',
      category: 'video',
      type: 'mp4',
      quality: '1080p',
      size: 52428800,
      url: null,
      vid: 'vid123',
      key: 'key123',
      encryptedUrl: null,
      isFakeData: false
    };

    const decision = determineRoute(extractResult, formatData);

    expect(decision.routeType).toBe(RouteType.IOS_POLLING);
    expect(decision.platform).toBe('iOS');
    expect(decision.format).toBe('mp4');
  });

  it('should route Windows MP4 to WINDOWS_MP4_POLLING', () => {
    vi.mocked(platformDetection.isWindows).mockReturnValue(true);

    const extractResult: ExtractResult = {
      url: 'https://stream.example.com/video.mp4',
      filename: 'video.mp4',
      size: 104857600, // 100 MB
      status: 'stream',
      progressUrl: '/progress/win'
    };

    const formatData: FormatData = {
      id: 'video|mp4-1080p',
      category: 'video',
      type: 'mp4',
      quality: '1080p',
      size: 104857600,
      url: null,
      vid: 'win123',
      key: 'winkey',
      encryptedUrl: null,
      isFakeData: false
    };

    const decision = determineRoute(extractResult, formatData);

    expect(decision.routeType).toBe(RouteType.WINDOWS_MP4_POLLING);
    expect(decision.platform).toBe('Windows');
    expect(decision.format).toBe('mp4');
    expect(decision.description).toContain('Windows MP4 stream');
  });

  it('should route large files >500MB to forced polling', () => {
    // Not iOS or Windows
    vi.mocked(platformDetection.isIOS).mockReturnValue(false);
    vi.mocked(platformDetection.isWindows).mockReturnValue(false);

    const extractResult: ExtractResult = {
      url: 'https://stream.example.com/large.mp4',
      filename: 'large.mp4',
      size: 629145600, // 600 MB
      status: 'stream',
      progressUrl: '/progress/large'
    };

    const formatData: FormatData = {
      id: 'video|mp4-4k',
      category: 'video',
      type: 'mp4',
      quality: '4k',
      size: 629145600,
      url: null,
      vid: 'large123',
      key: 'largekey',
      encryptedUrl: null,
      isFakeData: false
    };

    const decision = determineRoute(extractResult, formatData);

    expect(decision.routeType).toBe(RouteType.WINDOWS_MP4_POLLING);
    expect(decision.platform).toBe('other');
    expect(decision.sizeMB).toBe(600);
    expect(decision.description).toContain('forced server polling');
    expect(decision.description).toContain('600MB > 500MB');
  });

  it('should route other platforms to OTHER_STREAM', () => {
    vi.mocked(platformDetection.isIOS).mockReturnValue(false);
    vi.mocked(platformDetection.isWindows).mockReturnValue(false);

    const extractResult: ExtractResult = {
      url: 'https://stream.example.com/audio.mp3',
      filename: 'audio.mp3',
      size: 10485760, // 10 MB
      status: 'stream',
      progressUrl: null
    };

    const formatData: FormatData = {
      id: 'audio|mp3-128kbps',
      category: 'audio',
      type: 'mp3',
      quality: '128kbps',
      size: 10485760,
      url: null,
      vid: 'other123',
      key: 'otherkey',
      encryptedUrl: null,
      isFakeData: false
    };

    const decision = determineRoute(extractResult, formatData);

    expect(decision.routeType).toBe(RouteType.OTHER_STREAM);
    expect(decision.platform).toBe('other');
    expect(decision.format).toBe('mp3');
    expect(decision.description).toBe('Direct stream download');
  });

  it('should use format override from formatData.format', () => {
    const extractResult: ExtractResult = {
      url: 'test.mp3',
      filename: 'test.mp3',
      size: 1048576,
      status: 'static',
      progressUrl: null
    };

    const formatData: FormatData = {
      id: 'audio|mp3-320kbps',
      category: 'audio',
      type: 'mp3',
      quality: '320kbps',
      size: 1048576,
      url: 'test.mp3',
      vid: null,
      key: null,
      encryptedUrl: null,
      isFakeData: false,
      format: 'wav' // Override
    };

    const decision = determineRoute(extractResult, formatData);

    expect(decision.format).toBe('wav');
  });
});

describe('createApiProgressData', () => {
  it('should create progress data with all fields', () => {
    const data = createApiProgressData({
      videoProgress: 50,
      audioProgress: 75,
      status: 'processing',
      mergedUrl: 'https://example.com/merged.mp4'
    });

    expect(data.videoProgress).toBe(50);
    expect(data.audioProgress).toBe(75);
    expect(data.status).toBe('processing');
    expect(data.mergedUrl).toBe('https://example.com/merged.mp4');
  });

  it('should use default values for missing fields', () => {
    const data = createApiProgressData({});

    expect(data.videoProgress).toBe(0);
    expect(data.audioProgress).toBe(0);
    expect(data.status).toBe('');
    expect(data.mergedUrl).toBeNull();
  });

  it('should handle partial data', () => {
    const data = createApiProgressData({
      audioProgress: 30,
      status: 'merging'
    });

    expect(data.videoProgress).toBe(0);
    expect(data.audioProgress).toBe(30);
    expect(data.status).toBe('merging');
    expect(data.mergedUrl).toBeNull();
  });
});

describe('calculateDisplayProgress', () => {
  it('should return 100% when mergedUrl is present', () => {
    const apiData: ApiProgressData = {
      videoProgress: 90,
      audioProgress: 85,
      status: 'complete',
      mergedUrl: 'https://example.com/final.mp4'
    };

    const result = calculateDisplayProgress(apiData, 'mp4');

    expect(result.percent).toBe(100);
    expect(result.statusText).toBe('Ready');
  });

  it('should calculate audio progress correctly', () => {
    const apiData: ApiProgressData = {
      videoProgress: 0,
      audioProgress: 60,
      status: 'processing',
      mergedUrl: null
    };

    const result = calculateDisplayProgress(apiData, 'mp3');

    // 60% API progress → map to 10-95% range
    // mappedPercent = 10 + (60/100) * 85 = 10 + 51 = 61
    expect(result.percent).toBe(61);
    expect(result.statusText).toBe('Processing...');
  });

  it('should calculate video progress with weighted average', () => {
    const apiData: ApiProgressData = {
      videoProgress: 80,
      audioProgress: 60,
      status: 'processing',
      mergedUrl: null
    };

    const result = calculateDisplayProgress(apiData, 'mp4');

    // Video: 80 * 0.6 + 60 * 0.4 = 48 + 24 = 72
    // mappedPercent = 10 + (72/100) * 85 = 10 + 61.2 = 71.2
    expect(result.percent).toBeCloseTo(71.2, 1);
  });

  it('should show merging status text', () => {
    const apiData: ApiProgressData = {
      videoProgress: 100,
      audioProgress: 100,
      status: 'merging',
      mergedUrl: null
    };

    const resultVideo = calculateDisplayProgress(apiData, 'mp4');
    expect(resultVideo.statusText).toBe('Merging...');

    const resultAudio = calculateDisplayProgress(apiData, 'mp3');
    expect(resultAudio.statusText).toBe('Encoding audio...');
  });

  it('should never go backwards', () => {
    const apiData: ApiProgressData = {
      videoProgress: 30,
      audioProgress: 20,
      status: 'processing',
      mergedUrl: null
    };

    // First call with lastPercent = 80
    const result = calculateDisplayProgress(apiData, 'mp3', 80);

    // Should stay at 80, not drop to lower value
    expect(result.percent).toBe(80);
  });

  it('should map to 10-95% range', () => {
    const apiDataStart: ApiProgressData = {
      videoProgress: 0,
      audioProgress: 0,
      status: 'processing',
      mergedUrl: null
    };

    const resultStart = calculateDisplayProgress(apiDataStart, 'mp3');
    expect(resultStart.percent).toBe(10); // 10 + (0/100) * 85 = 10

    const apiDataEnd: ApiProgressData = {
      videoProgress: 100,
      audioProgress: 100,
      status: 'processing',
      mergedUrl: null
    };

    const resultEnd = calculateDisplayProgress(apiDataEnd, 'mp3');
    expect(resultEnd.percent).toBe(95); // 10 + (100/100) * 85 = 95
  });
});

describe('createExtractResult', () => {
  it('should create extract result from API response', () => {
    const apiResponse = {
      url: 'https://cdn.example.com/video.mp4',
      filename: 'video.mp4',
      size: 10485760,
      status: 'static',
      progressUrl: null
    };

    const result = createExtractResult(apiResponse);

    expect(result.url).toBe('https://cdn.example.com/video.mp4');
    expect(result.filename).toBe('video.mp4');
    expect(result.size).toBe(10485760);
    expect(result.status).toBe('static');
    expect(result.progressUrl).toBeNull();
  });

  it('should default missing fields to null', () => {
    const apiResponse = {
      url: 'https://stream.example.com/audio.mp3',
      status: 'stream'
    };

    const result = createExtractResult(apiResponse);

    expect(result.url).toBe('https://stream.example.com/audio.mp3');
    expect(result.filename).toBeNull();
    expect(result.size).toBeNull();
    expect(result.status).toBe('stream');
    expect(result.progressUrl).toBeNull();
  });

  it('should normalize status to stream for non-static', () => {
    const apiResponse = {
      url: 'test.mp3',
      status: 'processing'
    };

    const result = createExtractResult(apiResponse);

    expect(result.status).toBe('stream');
  });

  it('should include progressUrl for stream status', () => {
    const apiResponse = {
      url: 'https://stream.example.com/video.mp4',
      filename: 'video.mp4',
      size: 52428800,
      status: 'stream',
      progressUrl: '/api/progress/abc123'
    };

    const result = createExtractResult(apiResponse);

    expect(result.status).toBe('stream');
    expect(result.progressUrl).toBe('/api/progress/abc123');
  });
});
