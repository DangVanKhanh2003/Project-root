/**
 * V3 Download Mapper
 * Maps app format (extractV2Options) to V3 API request format
 */

import type { V3DownloadRequest, OutputConfig, AudioConfig, OsType } from '../../models/remote/v3';

/**
 * App layer format (from extractV2Options)
 */
export interface ExtractV2Options {
  downloadMode?: 'video' | 'audio';
  videoQuality?: string;
  youtubeVideoContainer?: string;
  audioBitrate?: string;
  audioFormat?: string;
  trackId?: string;
}

/**
 * Detect OS type from user agent
 */
export function detectOsType(): OsType {
  if (typeof navigator === 'undefined') {
    return 'windows';
  }

  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || '';

  // iOS detection
  if (/iphone|ipad|ipod/.test(ua) || (platform === 'ios')) {
    return 'ios';
  }

  // Android detection
  if (/android/.test(ua)) {
    return 'android';
  }

  // macOS detection
  if (/macintosh|mac os x/.test(ua) || platform === 'macos') {
    return 'macos';
  }

  // Windows detection
  if (/windows|win32|win64/.test(ua) || platform === 'windows') {
    return 'windows';
  }

  // Linux detection
  if (/linux/.test(ua) || platform === 'linux') {
    return 'linux';
  }

  return 'windows';
}

/**
 * Map video quality from app format to V3 format
 * App: "720", "1080" → V3: "720p", "1080p"
 */
function mapVideoQuality(quality?: string): OutputConfig['quality'] | undefined {
  if (!quality) return undefined;

  // Normalize: remove 'p' suffix to handle both "144" and "144p"
  const key = quality.replace(/p$/i, '');

  const qualityMap: Record<string, OutputConfig['quality']> = {
    '2160': '2160p',
    '1440': '1440p',
    '1080': '1080p',
    '720': '720p',
    '480': '480p',
    '360': '360p',
    '144': '144p',
  };

  return qualityMap[key] || undefined;
}

/**
 * Map audio bitrate from app format to V3 format
 * App: "128", "320" → V3: "128k", "320k"
 */
function mapAudioBitrate(bitrate?: string): AudioConfig['bitrate'] | undefined {
  if (!bitrate) return undefined;

  const bitrateMap: Record<string, AudioConfig['bitrate']> = {
    '64': '64k',
    '128': '128k',
    '192': '192k',
    '256': '192k', // Map 256 to closest available
    '320': '320k',
  };

  return bitrateMap[bitrate] || '128k';
}

/**
 * Map audio format from app format to V3 format
 */
function mapAudioFormat(format?: string): OutputConfig['format'] {
  if (!format) return 'mp3';

  const formatMap: Record<string, OutputConfig['format']> = {
    'mp3': 'mp3',
    'm4a': 'm4a',
    'wav': 'wav',
    'opus': 'opus',
    'ogg': 'ogg',
    'flac': 'flac',
  };

  return formatMap[format.toLowerCase()] || 'mp3';
}

/**
 * Map video container from app format to V3 format
 */
function mapVideoFormat(container?: string): OutputConfig['format'] {
  if (!container) return 'mp4';

  const formatMap: Record<string, OutputConfig['format']> = {
    'mp4': 'mp4',
    'webm': 'webm',
    'mkv': 'mkv',
  };

  return formatMap[container.toLowerCase()] || 'mp4';
}

/**
 * Map extractV2Options to V3 DownloadRequest
 */
export function mapToV3DownloadRequest(
  url: string,
  options: ExtractV2Options
): V3DownloadRequest {
  const isVideo = options.downloadMode === 'video';
  const os = detectOsType();

  if (isVideo) {
    // Video download
    const request: V3DownloadRequest = {
      url,
      os,
      output: {
        type: 'video',
        format: mapVideoFormat(options.youtubeVideoContainer),
        quality: mapVideoQuality(options.videoQuality),
      },
    };

    // Always include audio config for video (default 128k)
    const normalizedTrackId = options.trackId && options.trackId !== 'original' ? options.trackId : undefined;
    request.audio = {
      bitrate: mapAudioBitrate(options.audioBitrate || '128'),
      ...(normalizedTrackId ? { trackId: normalizedTrackId } : {}),
    };

    return request;
  } else {
    // Audio download
    const request: V3DownloadRequest = {
      url,
      os,
      output: {
        type: 'audio',
        format: mapAudioFormat(options.audioFormat),
      },
    };

    // Add audio bitrate
    const normalizedTrackId = options.trackId && options.trackId !== 'original' ? options.trackId : undefined;
    if (options.audioBitrate || normalizedTrackId) {
      request.audio = {
        ...(options.audioBitrate ? { bitrate: mapAudioBitrate(options.audioBitrate) } : {}),
        ...(normalizedTrackId ? { trackId: normalizedTrackId } : {}),
      };
    }

    return request;
  }
}
