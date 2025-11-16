/**
 * YouTube Mapper
 * Maps YouTube extract API responses to MediaDto
 */

import type { YouTubeExtractData } from '../../../models/remote/v1/responses/extract.response';
import type { MediaDto } from '../../../models/dto/media.dto';
import { normalizeFormats } from './format.mapper';

/**
 * Map YouTube extract response to MediaDto
 * YouTube uses 2-step conversion process (extract → convert)
 *
 * @param data - YouTube extract response data
 * @returns Normalized MediaDto
 */
export function mapYouTubeExtractResponse(
  data: YouTubeExtractData
): MediaDto {
  // Normalize metadata
  const meta = {
    vid: data.vid,
    title: data.title,
    author: data.author,
    thumbnail: data.thumbnail,
    duration: data.vduration,
    source: 'YouTube' as const,
  };

  // Normalize video formats (conversion links with keys)
  const videoFormats = normalizeFormats(
    data.convert_links.video,
    'video'
  );

  // Normalize audio formats (conversion links with keys)
  const audioFormats = normalizeFormats(
    data.convert_links.audio,
    'audio'
  );

  return {
    meta,
    formats: {
      video: videoFormats,
      audio: audioFormats,
    },
    // YouTube single videos don't have galleries
    gallery: null,
  };
}
