/**
 * Direct Platform Mapper
 * Maps direct download platforms (TikTok, Facebook, Instagram, X) to MediaDto
 */

import type { DirectExtractData } from '../../../models/remote/v1/responses/extract.response';
import type { MediaDto, GalleryItemDto } from '../../../models/dto/media.dto';
import {
  normalizeFormats,
  normalizeFormatsFromObject,
} from './format.mapper';

/**
 * Capitalize first letter of string
 * @param str - Input string
 * @returns Capitalized string
 */
function capitalizeFirst(str: string | undefined): string {
  if (!str) return 'Direct';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Map direct platform extract response to MediaDto
 * Handles TikTok, Facebook, Instagram (non-gallery), X/Twitter
 *
 * @param data - Direct platform extract response data
 * @returns Normalized MediaDto
 */
export function mapDirectExtractResponse(
  data: DirectExtractData
): MediaDto {
  // Normalize metadata
  const meta = {
    vid: null, // Direct downloads don't have YouTube video ID
    title: data.title,
    author: data.author ? (data.author.username || data.author.name) : 'MB',
    thumbnail: data.thumbnail,
    duration: data.duration || null,
    source: capitalizeFirst(data.extractor) || 'Direct',
  };

  // Handle different links structure formats
  let videoFormats: ReturnType<typeof normalizeFormats> = [];
  let audioFormats: ReturnType<typeof normalizeFormats> = [];

  if (data.links) {
    // Convert links.video to array (handle both array and object formats)
    const videoLinks = data.links.video;
    if (Array.isArray(videoLinks)) {
      videoFormats = normalizeFormats(videoLinks, 'video');
    } else if (videoLinks && typeof videoLinks === 'object') {
      videoFormats = normalizeFormatsFromObject(videoLinks, 'video');
    }

    // Convert links.audio to array (handle both array and object formats)
    const audioLinks = data.links.audio;
    if (Array.isArray(audioLinks)) {
      audioFormats = normalizeFormats(audioLinks, 'audio');
    } else if (audioLinks && typeof audioLinks === 'object') {
      audioFormats = normalizeFormatsFromObject(audioLinks, 'audio');
    }
  }

  // Handle optional gallery property (for Instagram carousels)
  let galleryItems: GalleryItemDto[] | null = null;

  if (data.gallery && data.gallery.items) {
    galleryItems = data.gallery.items.map((item) => {
      return {
        id: item.id,
        type: item.ftype, // Keep exact backend value: 'Image' or 'Video'
        thumb: item.thumb, // Use thumb field for display thumbnail
        label: item.label || `${item.ftype} item`, // Display label for gallery

        // Convert resources to formats array for gallery renderer compatibility
        formats: item.resources.map((res, index) => ({
          id: `fmt_${index}`, // Unique format ID for selection
          qualityLabel: res.fsize, // e.g., "1080x972" - for dropdown display
          quality: res.fsize, // Backup quality field
          url: res.src, // Direct download URL from API
          format: item.ftype === 'Image' ? 'Image' : 'Video',
        })),
      };
    });
  }

  return {
    meta,
    formats: {
      video: videoFormats,
      audio: audioFormats,
    },
    gallery: galleryItems,
  };
}
