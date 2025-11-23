/**
 * Format Processing Utilities
 * Helper functions for processing media format data
 */

// Type definitions
export interface ProcessedFormat {
  id: string;
  category: string;
  quality: string;
  qualityLabel?: string;
  format?: string;
  size?: string;
  type?: string;
  sizeText?: string;
  isConverted?: boolean;
  key?: string | null;
  url?: string | null;
  q_text?: string | null;
  fps?: number | null;
  bitrate?: number | null;
  isFakeData?: boolean;
  vid?: string | null;
  extractV2Options?: {
    downloadMode?: string;
    videoQuality?: string;
    youtubeVideoContainer?: string;
    audioQuality?: string;
    youtubeAudioContainer?: string;
  } | null;
  [key: string]: any;
}

/**
 * Generates unique format ID for tracking and event handling
 *
 * WHY: Unified format ID structure across all platforms for conversion tracking
 * CONTRACT: (category, type, quality, item) → string - deterministic ID generation
 * PRE: Valid category ('video'|'audio'), type and quality strings
 * POST: Returns format ID in pattern: category|type|quality|extras|mode
 * EDGE: Missing fps/bitrate → skipped; no key/url → defaults to 'direct'
 * USAGE: generateFormatId('video', 'MP4', '720p', {key: 'abc'}) → 'video|MP4|720p|convert'
 */
function generateFormatId(category: string, type: string, quality: string, item: any): string {
  const parts = [
    category,          // 'video' | 'audio'
    type,              // 'MP4', 'MP3', etc.
    quality,           // '720p', '128kbps', etc.
    item.fps || item.bitrate || '',
    item.key ? 'convert' : 'direct'
  ].filter(Boolean);

  return parts.join('|');
}

/**
 * Map format item to processed format
 *
 * WHY: Normalize raw API formats into consistent structure for UI rendering
 * CONTRACT: (item, category) → ProcessedFormat | null
 * PRE: Valid item object and category string ('video'|'audio')
 * POST: Returns normalized format with generated ID or null if invalid
 * EDGE: Missing quality → 'auto'; missing type → defaults by category; invalid category → null
 * USAGE: mapFormat({quality: '720p', key: 'abc'}, 'video') → {id: 'video|MP4|720p|convert', ...}
 */
export function mapFormat(item: any, category: string): ProcessedFormat | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  // Validate category
  if (!category || (category !== 'video' && category !== 'audio')) {
    return null;
  }

  // Quality fallback chain - comprehensive coverage of all possible fields
  const quality = item.quality ||
                 item.resolution ||
                 item.label ||
                 item.quality_label ||
                 item.qualityName ||
                 'auto';

  // Type fallback chain with smart defaults for category
  const rawType = item.type ||
                 item.ext ||
                 item.format ||
                 (category === 'audio' ? 'mp3' : 'mp4');
  const type = String(rawType).toUpperCase();

  // Size normalization - handle empty, "0", null cases
  const rawSize = item.size || '';
  const normalizedSize = (!rawSize || rawSize === '0' || rawSize === 0) ? 'MB' : rawSize;

  // Generate unique ID for format item
  const formatId = generateFormatId(category, type, quality, item);

  // Determine conversion requirement
  const isConverted = !item.key && !!item.url;

  // Remove 'id' from item before spreading to prevent API's id from overriding our generated formatId
  const { id: _unusedId, ...restItem } = item;

  return {
    id: formatId,                    // ✅ Generated ID, not from API
    category: category,
    quality: quality,
    type: type,
    size: normalizedSize,
    sizeText: normalizedSize,        // Alias for UI display
    isConverted: isConverted,

    // Original API data preserved
    key: item.key || null,           // YouTube conversion key
    url: item.url || null,           // Direct download URL
    q_text: (item.q_text && String(item.q_text).trim().toLowerCase() !== 'null') ? item.q_text : null,     // TikTok/Facebook display text
    qualityLabel: item.q_text || item.qualityLabel,

    // Additional metadata
    fps: item.fps || null,
    bitrate: item.bitrate || null,

    // Fake data workflow support (preserve from input)
    isFakeData: item.isFakeData || false, // Preserve fake data flag
    vid: item.vid || null,                // Preserve video ID for extract v2
    extractV2Options: item.extractV2Options || null, // Preserve extract v2 options for YouTube

    // Spread remaining properties (but not 'id')
    ...restItem
  };
}

/**
 * Extract format string from item
 * @param item - Format item
 * @returns Format string
 */
export function extractFormat(item: any): string {
  if (!item || typeof item !== 'object') {
    return 'Unknown Format';
  }

  // Priority 1: q_text
  if (item.q_text && item.q_text.trim()) {
    return item.q_text.trim();
  }

  // Priority 2: quality
  if (item.quality) {
    return String(item.quality);
  }

  // Priority 3: q
  if (item.q) {
    return String(item.q);
  }

  return 'Unknown Format';
}

/**
 * Build quality badge HTML
 * @param format - Format object
 * @param category - Category (video/audio)
 * @returns Badge HTML or null
 */
export function buildQualityBadge(format: any, category: string): string | null {
  if (!format || typeof format !== 'object') {
    return null;
  }

  const quality = extractFormat(format);
  const cssClass = `quality-badge quality-badge--${category}`;

  return `<span class="${cssClass}">${quality}</span>`;
}

/**
 * Process array of raw formats
 * @param rawFormats - Raw format array
 * @param category - Format category
 * @returns Processed format array
 */
export function processFormatArray(rawFormats: any[], category: string): ProcessedFormat[] {
  if (!Array.isArray(rawFormats)) {
    return [];
  }

  return rawFormats
    .map(item => mapFormat(item, category))
    .filter((item): item is ProcessedFormat => item !== null);
}
