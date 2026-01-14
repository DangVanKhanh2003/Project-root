/**
 * Service Options Types
 * Common options for service methods
 */

/**
 * Request cancellation signal
 */
export interface RequestOptions {
  /**
   * AbortSignal for request cancellation
   */
  signal?: AbortSignal;
}

/**
 * YouTube Stream download options
 */
export interface YouTubeStreamOptions extends RequestOptions {
  /**
   * Download mode: video or audio
   */
  downloadMode: 'video' | 'audio';

  /**
   * Video quality (for video mode)
   * @example '1080', '720', '480'
   */
  videoQuality?: string;

  /**
   * Video container format (for video mode)
   * @example 'mp4', 'webm'
   */
  youtubeVideoContainer?: string;

  /**
   * Audio format (for audio mode)
   * @example 'mp3', 'm4a', 'webm'
   */
  audioFormat?: string;

  /**
   * Audio bitrate (for audio mode)
   * @example '128', '192', '320'
   */
  audioBitrate?: string;
}

/**
 * Search v2 pagination options
 */
export interface SearchV2Options {
  /**
   * Page token for pagination
   */
  pageToken?: string;

  /**
   * Number of results to return
   * @example 12
   */
  limit?: number;
}
