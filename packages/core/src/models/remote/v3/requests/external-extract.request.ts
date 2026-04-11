/**
 * External Extract API Request
 * POST /api/v2/download → cc.ytconvert.org
 * Direct download — no polling needed.
 */

export interface ExternalExtractOutput {
  /** 'video' | 'audio' */
  type: 'video' | 'audio';
  /** Only mp3/mp4 supported */
  format: string;
  /** e.g. '720p' for video, '128kbps' for audio */
  quality?: string;
}

export interface ExternalExtractRequest {
  /** YouTube URL */
  url: string;
  /** Output configuration */
  output: ExternalExtractOutput;
}
