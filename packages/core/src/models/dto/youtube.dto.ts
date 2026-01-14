/**
 * YouTube DTOs
 * Normalized YouTube responses
 */

/**
 * YouTube Metadata Response DTO
 * Returned from getMetadata() service method (oEmbed API)
 */
export interface YouTubeMetadataDto {
  /** Video title */
  title: string;

  /** Channel name */
  authorName: string;

  /** Channel URL */
  authorUrl: string;

  /** Thumbnail URL */
  thumbnailUrl: string;

  /** Thumbnail dimensions */
  thumbnail: {
    width: number;
    height: number;
  };

  /** Video dimensions */
  video: {
    width: number;
    height: number;
  };
}
