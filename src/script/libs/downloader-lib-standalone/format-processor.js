/**
 * Format Processing Functions for Download Options
 *
 * Centralized functions để xử lý format data từ various API responses
 * và chuẩn hóa thành unified structure cho UI rendering.
 */

/**
 * Maps raw format item từ API response thành normalized format object
 *
 * @param {Object} item - Raw format item từ API response
 * @param {string} category - 'video' hoặc 'audio'
 * @returns {Object} Normalized format object
 */
export function mapFormat(item, category) {
  
  // Enhanced validation
  if (!item || typeof item !== 'object') {
    return null;
  }

  if (!category || (category !== 'video' && category !== 'audio')) {
    return null;
  }

  // Quality fallback chain - comprehensive coverage của all possible fields
  const quality = item.quality ||
                 item.resolution ||
                 item.label ||
                 item.quality_label ||
                 item.qualityName ||
                 'auto';

  // Type fallback chain với smart defaults cho category
  const rawType = item.type ||
                 item.ext ||
                 item.format ||
                 (category === 'audio' ? 'mp3' : 'mp4');
  const type = String(rawType).toUpperCase();

  // Size normalization - handle empty, "0", null cases
  const rawSize = item.size || '';
  const normalizedSize = (!rawSize || rawSize === '0' || rawSize === 0) ? 'MB' : rawSize;

  // Generate unique ID cho format item
  const formatId = generateFormatId(category, type, quality, item);

  // Determine conversion requirement
  const isConverted = !item.key && !!item.url;

  return {
    id: formatId,
    category: category,
    quality: quality,
    type: type,
    size: normalizedSize,
    sizeText: normalizedSize, // Alias cho UI display
    isConverted: isConverted,

    // Original API data preserved
    key: item.key || null,           // YouTube conversion key
    url: item.url || null,           // Direct download URL
    q_text: (item.q_text && String(item.q_text).trim().toLowerCase() !== 'null') ? item.q_text : null,     // TikTok/Facebook display text

    // Additional metadata
    selected: item.selected || null, // YouTube "selected" field
    fps: item.fps || null,
    bitrate: item.bitrate || null,

    // Fake data workflow support (preserve from input)
    isFakeData: item.isFakeData || false, // Preserve fake data flag
    vid: item.vid || null,                // Preserve video ID for extract v2
  };
}

/**
 * Extracts display text cho format item với priority logic
 *
 * @param {Object} item - Mapped format object từ mapFormat()
 * @returns {string} Display text cho UI
 */
export function extractFormat(item) {
  if (!item || typeof item !== 'object') {
    return 'Unknown Format';
  }
  // Priority 1: Use q_text nếu có (TikTok/Facebook style)
  if (item.q_text && item.q_text.trim()) {
    const qText = item.q_text.trim();
    // Truncate nếu quá dài
    return qText.length > 35 ? qText.substring(0, 22) + '...' : qText;
  }

  // Priority 2: Combine type + quality (YouTube style)
  const type = item.type || 'Unknown';
  const quality = item.quality || 'auto';

  const combined = `${type} - ${quality}`;

  // Truncate nếu quá dài
  return combined.length > 25 ? combined.substring(0, 22) + '...' : combined;
}

/**
 * Builds quality badge HTML cho format item
 *
 * @param {Object} format - Mapped format object
 * @param {string} category - 'video' hoặc 'audio'
 * @returns {string|null} HTML string cho badge hoặc null
 */
export function buildQualityBadge(format, category) {
  try {
    // Validation
    if (!format || typeof format !== 'object') {
      return null;
    }

    if (!category || typeof category !== 'string') {
      return null;
    }

    // Audio không có badges
    if (category === 'audio') {
      return null;
    }

    // Video quality badge logic - only for high-quality formats
    if (category === 'video' && format.quality) {
      const quality = String(format.quality).toLowerCase();

      // Full HD detection (1080p only)
      if (quality === '1080p') {
        return '<span class="quality-badge quality-badge--fullhd">Full HD</span>';
      }

      // HD detection (720p only)
      if (quality === '720p') {
        return '<span class="quality-badge quality-badge--hd">HD</span>';
      }

      // No badges for other resolutions (480p, 360p, 240p, 144p)
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Generates unique format ID cho tracking và event handling
 *
 * @param {string} category - 'video' hoặc 'audio'
 * @param {string} type - Format type (MP4, MP3, etc.)
 * @param {string} quality - Quality string
 * @param {Object} item - Original item cho additional uniqueness
 * @returns {string} Unique format ID
 */
function generateFormatId(category, type, quality, item) {
  const parts = [
    category,
    type,
    quality,
    item.fps || item.bitrate || '',
    item.key ? 'convert' : 'direct'
  ].filter(Boolean);

  return parts.join('|');
}

/**
 * Validates format item có đủ data để render không
 * Updated for extract v2 workflow: fake data không cần key/url
 *
 * @param {Object} format - Mapped format object
 * @returns {boolean} True nếu format valid để render
 */
export function isValidFormat(format) {
  if (!format || typeof format !== 'object') {
    return false;
  }

  // Minimum required fields for rendering
  const hasBasicFields = !!(format.id && format.category && format.type);

  // For fake data: only basic fields needed (extract v2 will provide URL)
  if (format.isFakeData) {
    return hasBasicFields;
  }

  // For real data: must have download source (key for conversion or direct URL)
  return hasBasicFields && !!(format.key || format.url);
}

/**
 * Processes array của format items và filter out invalid ones
 *
 * @param {Array} rawFormats - Array của raw format items từ API
 * @param {string} category - 'video' hoặc 'audio'
 * @returns {Array} Array của valid mapped formats
 */
export function processFormatArray(rawFormats, category) {
  try {
    if (!Array.isArray(rawFormats)) {
      return [];
    }

    if (!category) {
      return [];
    }

    const processedFormats = [];
    let invalidCount = 0;

    rawFormats.forEach((item, index) => {
      try {
        const mappedFormat = mapFormat(item, category);
        if (mappedFormat && isValidFormat(mappedFormat)) {
          processedFormats.push(mappedFormat);
        } else {
          invalidCount++;
        }
      } catch (error) {
        invalidCount++;
      }
    });

    return processedFormats;

  } catch (error) {
    return [];
  }
}