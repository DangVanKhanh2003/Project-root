/**
 * YouTube oEmbed Mapper
 * Maps YouTube oEmbed API responses to YouTubeMetadataDto
 */

import type { OEmbedResponse } from '../../models/remote/public-api/oembed.response';
import type { YouTubeMetadataDto } from '../../models/dto/youtube.dto';

/**
 * Map oEmbed response to YouTubeMetadataDto
 *
 * @param data - oEmbed response from YouTube
 * @returns Normalized YouTubeMetadataDto
 */
export function mapOEmbedResponse(data: OEmbedResponse): YouTubeMetadataDto {
  return {
    title: data.title,
    authorName: data.author_name,
    authorUrl: data.author_url,
    thumbnailUrl: data.thumbnail_url,
    thumbnail: {
      width: data.thumbnail_width,
      height: data.thumbnail_height,
    },
    video: {
      width: data.width,
      height: data.height,
    },
  };
}
