/**
 * Media DTOs
 * Normalized media structures after mapper + verification
 */

/**
 * Normalized media detail (after normalizeVideoDetail)
 */
export interface MediaDto {
  meta: MediaMetaDto;
  formats: MediaFormatsDto;
  gallery: GalleryItemDto[] | null;
}

/**
 * Media metadata
 */
export interface MediaMetaDto {
  vid: string | null; // YouTube video ID (null for non-YouTube)
  title: string;
  author: string;
  thumbnail: string;
  duration: string | null;
  source: string; // "YouTube", "TikTok", "Facebook", "Instagram", etc.
}

/**
 * Media formats
 */
export interface MediaFormatsDto {
  video: FormatDto[];
  audio: FormatDto[];
}

/**
 * Single format item
 */
export interface FormatDto {
  // YouTube conversion format
  key?: string | null; // Conversion key

  // Direct download format
  url?: string | null; // Direct download URL

  // Common fields
  quality: string;
  format: string;
  size: string;
  isConverted: boolean; // true if direct download, false if needs conversion
  q_text: string | null;
}

/**
 * Gallery item (Instagram carousels)
 */
export interface GalleryItemDto {
  id: string;
  type: string; // 'Image' or 'Video'
  thumb: string;
  label: string;
  formats: GalleryFormatDto[];
}

/**
 * Gallery format
 */
export interface GalleryFormatDto {
  id: string;
  qualityLabel: string; // e.g., "1080x972"
  quality: string;
  url: string;
  format: string;
}
