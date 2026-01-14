/**
 * YouTube oEmbed API Response Models
 * Public API - no authentication required
 */

/**
 * oEmbed response from YouTube
 * Spec: https://oembed.com/
 */
export interface OEmbedResponse {
  /** Video title */
  title: string;

  /** Channel name */
  author_name: string;

  /** Channel URL */
  author_url: string;

  /** Type - always 'video' for YouTube */
  type: 'video';

  /** Video height */
  height: number;

  /** Video width */
  width: number;

  /** oEmbed version */
  version: string;

  /** YouTube provider name */
  provider_name: string;

  /** YouTube provider URL */
  provider_url: string;

  /** Thumbnail height */
  thumbnail_height: number;

  /** Thumbnail width */
  thumbnail_width: number;

  /** Thumbnail URL */
  thumbnail_url: string;

  /** HTML embed code */
  html: string;
}
