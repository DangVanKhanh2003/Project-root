/**
 * Format Mapper - Helper Functions
 * Pure functions for normalizing format objects from API responses
 */

import type { FormatDto } from '../../../models/dto/media.dto';

/**
 * Raw format object from API (can be YouTube or Direct platform)
 */
interface RawFormat {
  // YouTube conversion format
  key?: string | null;

  // Direct download format
  url?: string | null;

  // Common properties
  quality?: string;
  format?: string;
  size?: string;
  q_text?: string | null;
}

/**
 * Normalize a single format item from any source into consistent structure
 *
 * @param format - Raw format object from API
 * @param category - 'video' or 'audio'
 * @returns Normalized format object (FormatDto)
 */
export function normalizeFormat(
  format: RawFormat | null | undefined,
  category: 'video' | 'audio'
): FormatDto | null {
  if (!format) {
    return null;
  }

  return {
    // For YouTube-style conversion (2-step process)
    key: format.key || null,

    // For Direct-style downloads (1-step process)
    url: format.url || null,

    // Common properties
    quality: format.quality || format.q_text || 'Default',
    format: format.format || (category === 'audio' ? 'mp3' : 'mp4'),
    size: format.size || 'MB',

    // Determine if format is already converted (has direct URL)
    isConverted: !format.key && !!format.url,

    // Quality text (null if 'null' string or empty)
    q_text:
      format.q_text && String(format.q_text).trim().toLowerCase() !== 'null'
        ? format.q_text
        : null,
  };
}

/**
 * Normalize array of formats
 * Filters out null results from normalization
 *
 * @param formats - Array of raw format objects
 * @param category - 'video' or 'audio'
 * @returns Array of normalized formats
 */
export function normalizeFormats(
  formats: RawFormat[] | null | undefined,
  category: 'video' | 'audio'
): FormatDto[] {
  if (!formats || !Array.isArray(formats)) {
    return [];
  }

  return formats
    .map((format) => normalizeFormat(format, category))
    .filter((format): format is FormatDto => format !== null);
}

/**
 * Normalize formats from object (key-value pairs)
 * Some APIs return formats as objects instead of arrays
 *
 * @param formatsObj - Object with format key-value pairs
 * @param category - 'video' or 'audio'
 * @returns Array of normalized formats
 */
export function normalizeFormatsFromObject(
  formatsObj: Record<string, RawFormat> | null | undefined,
  category: 'video' | 'audio'
): FormatDto[] {
  if (!formatsObj || typeof formatsObj !== 'object') {
    return [];
  }

  return Object.values(formatsObj)
    .map((format) => normalizeFormat(format, category))
    .filter((format): format is FormatDto => format !== null);
}
