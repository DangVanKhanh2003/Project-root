/**
 * API v2 Download Request Models
 * YouTube Stream API
 */

import {
  DownloadModeType,
  FilenameStyleType,
  VideoQualityType,
  VideoCodecType,
  VideoContainerType,
  AudioBitrateType,
  AudioFormatType,
} from '../../constants';

/**
 * Base download request (common fields)
 */
export interface BaseDownloadRequest {
  url: string; // YouTube video URL
  downloadMode: DownloadModeType; // 'video' | 'audio'
  filenameStyle?: FilenameStyleType; // Default: 'basic'
  disableMetadata?: boolean; // Default: false
  brandName?: string; // Custom brand name prefix (max 50 chars)
  autoMerge?: boolean; // Default: false - auto-merge video+audio for iOS
}

/**
 * Video download request
 * POST /
 */
export interface VideoDownloadRequest extends BaseDownloadRequest {
  downloadMode: 'video';

  // Video-specific options
  videoQuality?: VideoQualityType; // Default: '1080'
  youtubeVideoCodec?: VideoCodecType; // Default: 'h264'
  youtubeVideoContainer?: VideoContainerType; // Default: 'auto'
  youtubeDubLang?: string; // Dubbed language code (2-8 chars)
  subtitleLang?: string; // Subtitle language code (2-8 chars)
  youtubeHLS?: boolean; // Default: false (deprecated)
  youtubeBetterAudio?: boolean; // Default: false
}

/**
 * Audio download request
 * POST /
 */
export interface AudioDownloadRequest extends BaseDownloadRequest {
  downloadMode: 'audio';

  // Audio-specific options
  audioBitrate?: AudioBitrateType; // Default: '128'
  audioFormat?: AudioFormatType; // Default: 'mp3'
  youtubeBetterAudio?: boolean; // Default: false
}

/**
 * Union type for download requests
 */
export type DownloadRequest = VideoDownloadRequest | AudioDownloadRequest;

/**
 * Get download progress request
 * GET /api/download/progress/{cacheId}
 *
 * Note: cacheId is from progressUrl field in download response
 */
export interface ProgressRequest {
  cacheId: string; // e.g., "request_youtube_abc123def456"
}
