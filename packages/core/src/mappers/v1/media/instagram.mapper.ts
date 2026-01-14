/**
 * Instagram Mapper
 * Maps Instagram carousel/gallery posts to MediaDto
 *
 * Instagram carousels have a special structure where:
 * - Main `links` are often just for the first item or low-quality version
 * - Real content is in the `gallery.items` array
 */

import type { DirectExtractData } from '../../../models/remote/v1/responses/extract.response';
import type { MediaDto, GalleryItemDto } from '../../../models/dto/media.dto';

/**
 * Map Instagram extract response to MediaDto
 * Specifically handles Instagram gallery/carousel posts
 *
 * @param data - Instagram extract response data
 * @returns Normalized MediaDto with gallery items
 */
export function mapInstagramResponse(
  data: DirectExtractData
): MediaDto {
  // Normalize metadata
  const meta = {
    vid: null,
    title: data.title,
    author: data.author ? data.author.username : '',
    thumbnail: data.thumbnail, // Often the first item's thumbnail
    duration: null, // Instagram carousel posts don't have duration
    source: 'Instagram' as const,
  };

  // Instagram carousel: main links often not useful, real content in gallery
  const galleryItems: GalleryItemDto[] = (data.gallery?.items || []).map((item) => ({
    id: item.id,
    type: item.ftype, // 'Image' or 'Video'
    thumb: item.thumb || item.resources[0]?.src, // Use thumb or first resource as thumbnail
    label: item.label || `${item.ftype} item`,

    // Convert resources to formats array
    formats: item.resources.map((res, index) => ({
      id: `fmt_${index}`,
      qualityLabel: res.fsize, // e.g., "1080x1080"
      quality: res.fsize,
      url: res.src, // Direct download URL
      format: item.ftype === 'Image' ? 'Image' : 'Video',
    })),
  }));

  return {
    meta,
    formats: {
      video: [], // Main links not used for Instagram carousels
      audio: [],
    },
    gallery: galleryItems.length > 0 ? galleryItems : null,
  };
}
