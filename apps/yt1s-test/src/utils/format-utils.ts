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
  [key: string]: any;
}

/**
 * Map format item to processed format
 * @param item - Raw format item
 * @param category - Format category (video/audio)
 * @returns Processed format or null
 */
export function mapFormat(item: any, category: string): ProcessedFormat | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  return {
    id: item.id || item.k || `${category}-${Date.now()}`,
    category,
    quality: item.quality || item.q || 'unknown',
    qualityLabel: item.q_text || item.qualityLabel,
    format: item.format || item.f,
    size: item.size || item.s,
    ...item
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
