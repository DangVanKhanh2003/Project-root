/**
 * API V3 Download Request Models
 * YouTube Download API - https://api.ytconvert.org
 */

/**
 * Output configuration for download
 */
export interface OutputConfig {
  /** Output type: video or audio */
  type: 'video' | 'audio';

  /** Output format */
  format: 'mp4' | 'webm' | 'mkv' | 'mp3' | 'm4a' | 'wav' | 'opus' | 'ogg' | 'flac';

  /** Video quality (only for video type) */
  quality?: '2160p' | '1440p' | '1080p' | '720p' | '480p' | '360p' | '144p';
}

/**
 * Audio configuration for download
 */
export interface AudioConfig {
  /** Audio track ID for multi-language videos */
  trackId?: string;

  /** Audio bitrate */
  bitrate?: '64k' | '128k' | '192k' | '320k';
}

/**
 * Trim configuration for cutting video
 */
export interface TrimConfig {
  /** Start time in seconds */
  start?: number;

  /** End time in seconds */
  end?: number;
}

/**
 * Operating system type
 */
export type OsType = 'ios' | 'android' | 'macos' | 'windows' | 'linux';

/**
 * Download request for POST /api/download
 */
export interface V3DownloadRequest {
  /** YouTube URL (required) */
  url: string;

  /** Operating system */
  os?: OsType;

  /** Output configuration (required) */
  output: OutputConfig;

  /** Audio configuration */
  audio?: AudioConfig;

  /** Trim configuration */
  trim?: TrimConfig;
}
