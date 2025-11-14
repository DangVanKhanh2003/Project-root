import * as utils from './utils.js';

// --- Private Helper Functions for API v2 --- //

/**
 * Normalizes a single format item from any source into a consistent structure.
 * @param {object} format - The raw format object from the API.
 * @param {string} category - 'video' or 'audio'.
 * @returns {object} A normalized format object.
 */
function normalizeFormat(format, category) {
  if (!format) return null;

  return {
    // For YouTube-style conversion
    key: format.key || null,

    // For Direct-style downloads
    url: format.url || null,

    // Common properties
    quality: format.quality || format.q_text || 'Default',
    format: format.format || (category === 'audio' ? 'mp3' : 'mp4'),
    size: format.size || 'MB',
    isConverted: !format.key && !!format.url, // True if it's a direct download link
    q_text: (format.q_text && String(format.q_text).trim().toLowerCase() !== 'null') ? format.q_text : null,
  };
}

/**
 * Normalizes the response for YouTube (2-step conversion).
 * @param {object} data - The data object from the /extract response.
 * @returns {object} A normalized media detail object.
 */
function normalizeYouTube(data) {
  const meta = {
    vid: data.vid,
    title: data.title,
    author: data.author,
    thumbnail: data.thumbnail,
    duration: data.vduration,
    source: 'YouTube',
  };

  const videoFormats = (data.convert_links.video || []).map(f => normalizeFormat(f, 'video')).filter(Boolean);
  const audioFormats = (data.convert_links.audio || []).map(f => normalizeFormat(f, 'audio')).filter(Boolean);

  return {
    meta,
    formats: { video: videoFormats, audio: audioFormats },
    gallery: null, // YouTube single videos don't have galleries
  };
}

/**
 * Normalizes the response for Direct Download sources (TikTok, Facebook, Instagram).
 * @param {object} data - The data object from the /extract response.
 * @returns {object} A normalized media detail object.
 */
function normalizeDirect(data) {


  const meta = {
    vid: null, // Direct downloads don't have YouTube video ID
    title: data.title,
    author: data.author ? (data.author.username || data.author.name) : 'MB',
    thumbnail: data.thumbnail,
    duration: data.duration || null,
    source: utils.capitalizeFirst(data.extractor) || 'Direct',
  };

  // Handle different links structure formats
  let videoFormats = [];
  let audioFormats = [];

  if (data.links) {
    // Convert links.video to array if it's not already
    const videoLinks = data.links.video;
    if (Array.isArray(videoLinks)) {
      videoFormats = videoLinks.map(f => normalizeFormat(f, 'video')).filter(Boolean);
    } else if (videoLinks && typeof videoLinks === 'object') {
      // Convert object to array if it's an object
      videoFormats = Object.values(videoLinks).map(f => normalizeFormat(f, 'video')).filter(Boolean);
    }

    // Convert links.audio to array if it's not already
    const audioLinks = data.links.audio;
    if (Array.isArray(audioLinks)) {
      audioFormats = audioLinks.map(f => normalizeFormat(f, 'audio')).filter(Boolean);
    } else if (audioLinks && typeof audioLinks === 'object') {
      // Convert object to array if it's an object
      audioFormats = Object.values(audioLinks).map(f => normalizeFormat(f, 'audio')).filter(Boolean);
    }
  }

 
  // Handle optional gallery property (for Instagram)
  let galleryItems = null;
  

  if (data.gallery && data.gallery.items) {
    galleryItems = data.gallery.items.map((item, index) => {
     
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
          format: item.ftype === 'Image' ? 'jpg' : 'mp4',
        })),
      };
    });
  }

  const result = {
    meta,
    formats: { video: videoFormats, audio: audioFormats },
    gallery: galleryItems,
  };

  return result;
}

/**
 * Normalizes the response for Instagram (gallery support).
 * @param {object} data - The data object from the /extract response.
 * @returns {object} A normalized media detail object.
 */
function normalizeInstagram(data) {
  const meta = {
    vid: null,
    title: data.title,
    author: data.author ? data.author.username : 'MB',
    thumbnail: data.thumbnail, // Often the first item's thumbnail
    duration: null,
    source: 'Instagram',
  };

  // Instagram's main `links` are often just for the first item or a low-quality version.
  // The real content is in the gallery.
  const galleryItems = (data.gallery.items || []).map(item => ({
    id: item.id,
    type: item.ftype, // 'Image' or 'Video'
    thumbnail: item.resources[0]?.src, // Use first resource as thumbnail
    // The `resources` array contains different sizes/qualities
    resources: item.resources.map(res => ({
      quality: res.fsize, // e.g., "1080x972"
      url: res.src,
      format: item.ftype === 'Image' ? 'jpg' : 'mp4',
      q_text: (res.q_text && String(res.q_text).trim().toLowerCase() !== 'null') ? res.q_text : null,
    })),
  }));

  return {
    meta,
    formats: { video: [], audio: [] }, // Main formats are empty, content is in gallery
    gallery: galleryItems,
  };
}


// --- Exported Normalizer Functions --- //

/**
 * Normalizes search results from /search-title API.
 * @param {object} data - The data object from the response.
 */
export function normalizeSearchResults(data = {}) {
  // Handle wrapped response: {success: true, data: {videos: [], total: X}}
  const actualData = data.data || data;

  const videos = (actualData.videos || []).map(item => ({
    id: item.v,
    title: item.t,
  }));

  return {
    total: actualData.total || videos.length,
    videos: videos,
  };
}

/**
 * Normalizes playlist data from /playlist API.
 * @param {object} data - The data object from the response.
 */
export function normalizePlaylist(data = {}) {
    const items = (data.items || []).map(item => ({
        id: item.v,
        title: item.t,
    }));

    return {
        title: data.meta ? data.meta.title : 'Playlist',
        items: items,
    };
}

/**
 * Normalizes the response from /extract, dispatching to the correct handler.
 * This is the main normalizer for media detail.
 * @param {object} data - The data object from the /extract response.
 */
export function normalizeVideoDetail(data) {

  if (!data) {
    return null;
  }

  // Dispatch to the correct normalizer based on unique properties
  if (data.convert_links) {
    return normalizeYouTube(data);
  }
  if (data.links) {
    // Handle direct downloads (TikTok, Facebook, Instagram)
    // Instagram may have optional gallery property
    return normalizeDirect(data);
  }
  if (data.gallery) {
    // Legacy Instagram support (deprecated - should use links structure)
    return normalizeInstagram(data);
  }

  // Fallback or unknown type
 
  return null;
}

/**
 * Normalizes responses from /convert and /check-task APIs.
 * @param {object} response - The raw response object.
 */
export function normalizeTaskResponse(response) {
  if (!response) return { status: 'FAILED', message: 'Empty response' };

  // Handle nested data object
  const data = response.data || response;

  const status = (data.c_status || 'PENDING').toUpperCase();
  const isConverted = status === 'CONVERTED';

  return {
    status: status,
    vid: data.vid || null,
    // bId is only present when polling is needed.
    bId: !isConverted ? (data.b_id || data.dlink || null) : null,
    // downloadUrl is present when conversion is complete.
    downloadUrl: isConverted ? (data.dlink || data.d_url || null) : (data.d_url || null),
    message: data.mess || '',
    title: data.title || null,
    quality: data.fquality || null,
  };
}

/**
 * Normalizes the response from /decrypt API.
 * @param {object} response - The raw response object.
 * @returns {object} Normalized decode result.
 */
export function normalizeDecodeResponse(response) {

  if (!response) {
    return {
      success: false,
      error: 'Empty response from decrypt API',
      reason: 'empty_response',
    };
  }

  // Handle wrapped response: {success: true, data: {status: 'ok', original_url: '...'}}
  const actualData = response.data || response;


  // Success case
  if (actualData.status === 'ok' && actualData.original_url) {
    return {
      success: true,
      url: actualData.original_url,
    };
  }

  // Error case
  return {
    success: false,
    error: actualData.message || 'Failed to decode URL',
    reason: actualData.reason || 'unknown_error',
  };
}

/**
 * WHY: Parse title and quality from filename string
 * CONTRACT: filename:string → {title:string, quality:string|null, format:string}
 * PRE: filename is non-empty string
 * POST: Returns parsed components; không modify input; quality null nếu không detect được
 * EDGE: No quality in filename → quality = null; no extension → format = 'unknown'
 * USAGE: parseFilename("Video Title (1080p).mp4") → {title: "Video Title", quality: "1080p", format: "mp4"}
 */
function parseFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return { title: 'Unknown', quality: null, format: 'unknown' };
  }

  // Extract format/extension (e.g., ".mp4", ".mp3")
  const extensionMatch = filename.match(/\.([a-z0-9]+)$/i);
  const format = extensionMatch ? extensionMatch[1] : 'unknown';

  // Remove extension
  let nameWithoutExt = filename.replace(/\.[a-z0-9]+$/i, '');

  // Extract quality (e.g., "(1080p)", "(720p)", "(320kbps)")
  const qualityMatch = nameWithoutExt.match(/\(([^)]+)\)$/);
  const quality = qualityMatch ? qualityMatch[1] : null;

  // Remove quality from title
  const title = qualityMatch
    ? nameWithoutExt.replace(/\s*\([^)]+\)$/, '').trim()
    : nameWithoutExt.trim();

  return {
    title: title || 'Unknown',
    quality,
    format,
  };
}

/**
 * WHY: Normalize YouTube Stream API response for direct download (no format list needed)
 * CONTRACT: response:{status, url, filename, progressUrl?, size?}, options:{downloadMode, ...} → {status, url, filename, title, quality, format, downloadMode, progressUrl?, size?} | null
 * PRE: response is object với status field; options has downloadMode
 * POST: Returns simple direct download object with optional progressUrl and size; null nếu error response
 * EDGE: status = "error" → return null; missing url → return null; invalid filename → use defaults; progressUrl optional (for autoMerge); size optional (integer bytes for 150MB threshold check)
 * USAGE: normalizeStreamResponse({status: "stream", url: "...", filename: "Title (1080p).mp4", progressUrl: "https://...", size: 234135552}, {downloadMode: "video"})
 */
export function normalizeStreamResponse(response, options = {}) {
  // Handle error responses
  if (!response || response.status === 'error') {
    return null;
  }

  // Validate required fields
  if (!response.url || !response.filename) {
    return null;
  }

  // Parse filename to extract metadata
  const { title, quality, format } = parseFilename(response.filename);

  // Return simple direct download object
  return {
    status: response.status,        // "stream" or "static"
    url: response.url,              // Direct download URL
    filename: response.filename,    // Full filename from API
    title: title,                   // Parsed title
    quality: quality,               // Parsed quality (e.g., "1080p", "320kbps")
    format: format,                 // File format (e.g., "mp4", "mp3")
    downloadMode: options.downloadMode, // "video" or "audio"
    progressUrl: response.progressUrl || null, // Progress polling URL (for autoMerge)
    size: response.size || null,    // File size in bytes (for 150MB iOS threshold check)
  };
}

/**
 * WHY: Normalize YouTube oEmbed response to consistent internal format
 * CONTRACT: data:{title, author_name, thumbnail_url, ...} → {meta, formats, gallery}
 * PRE: data is valid oEmbed response object
 * POST: Returns normalized metadata; không modify input; formats empty vì oEmbed không có download links
 * EDGE: Missing fields → use fallback values; null input → return null
 * USAGE: normalizeYouTubeOembed(oembedResponse);
 */
export function normalizeYouTubeOembed(data) {
  if (!data) return null;

  return {
    meta: {
      vid: null, // oEmbed doesn't provide video ID
      title: data.title || 'Unknown Title',
      author: data.author_name || 'Unknown Author',
      thumbnail: data.thumbnail_url || null,
      duration: null, // oEmbed doesn't provide duration
      source: 'YouTube',
    },
    formats: { video: [], audio: [] }, // oEmbed only metadata, no download links
    gallery: null,
  };
}

/**
 * WHY: Extract video ID from search_v2 full YouTube URLs
 * CONTRACT: fullUrl:string → string|null (video ID or channel ID)
 * PRE: fullUrl is string from search_v2 API
 * POST: Returns extracted ID; null if extraction fails; no side effects
 * EDGE: Invalid URL → null; Channel URL → channel ID; Watch URL → video ID
 * USAGE: extractVideoIdFromSearchV2Url("https://www.youtube.com/watch?v=dP6e17UlF8U") → "dP6e17UlF8U"
 */
function extractVideoIdFromSearchV2Url(fullUrl) {
  if (!fullUrl) return null;

  try {
    const url = new URL(fullUrl);

    // YouTube watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.pathname === '/watch') {
      return url.searchParams.get('v');
    }

    // YouTube short URLs: https://youtu.be/VIDEO_ID
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1); // Remove leading '/'
    }

    // Channel URLs: extract channel ID for future use
    if (url.pathname.startsWith('/channel/')) {
      return url.pathname.split('/')[2];
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * WHY: Format duration seconds to human readable format (e.g., "3:45")
 * CONTRACT: seconds:number → string|null (formatted duration)
 * PRE: seconds is number from search_v2 API
 * POST: Returns formatted string; null if invalid input; no side effects
 * EDGE: null/undefined → null; negative → null; hours → "1:23:45" format
 * USAGE: formatDuration(187) → "3:07"; formatDuration(3661) → "1:01:01"
 */
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return null;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * WHY: Format view count to human readable format (e.g., "2.3M views")
 * CONTRACT: viewCount:number → string|null (formatted view count)
 * PRE: viewCount is number from search_v2 API
 * POST: Returns formatted string; null if invalid input; no side effects
 * EDGE: null/undefined → null; negative → null; < 1000 → "X views"
 * USAGE: formatViews(2284625) → "2.3M views"; formatViews(1500) → "1.5K views"
 */
function formatViews(viewCount) {
  if (!viewCount || viewCount < 0) return null;

  if (viewCount >= 1000000) {
    return `${(viewCount / 1000000).toFixed(1)}M views`;
  } else if (viewCount >= 1000) {
    return `${(viewCount / 1000).toFixed(1)}K views`;
  } else {
    return `${viewCount} views`;
  }
}

/**
 * WHY: Format upload date to relative time format (e.g., "2 weeks ago")
 * CONTRACT: isoDateString:string → string|null (relative date)
 * PRE: isoDateString is ISO format from search_v2 API
 * POST: Returns relative time string; null if invalid input; no side effects
 * EDGE: null/undefined → null; invalid date → null; today → "Today"
 * USAGE: formatRelativeDate("2025-09-08T22:00Z") → "2 months ago"
 */
function formatRelativeDate(isoDateString) {
  if (!isoDateString) return null;

  try {
    const uploadDate = new Date(isoDateString);
    const now = new Date();
    const diffMs = now - uploadDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch (error) {
    return null;
  }
}

/**
 * WHY: Normalize search_v2 API response with rich metadata to consistent internal format
 * CONTRACT: data:object → {items, streams, channels, videos, total, pagination}
 * PRE: data is raw search_v2 API response object
 * POST: Returns normalized object with backward compatibility; no side effects
 * EDGE: Empty data → empty arrays; Missing fields → null values; Invalid items filtered out
 * USAGE: normalizeSearchV2Results({items: [...], nextPageToken: "abc", hasNextPage: true})
 */
export function normalizeSearchV2Results(data = {}) {
  const items = (data.items || []).map(item => {
    const videoId = extractVideoIdFromSearchV2Url(item.id);

    return {
      // Backward compatibility fields
      id: videoId,
      title: item.title,

      // Enhanced v2 fields
      type: item.type,
      fullUrl: item.id,
      thumbnailUrl: item.thumbnailUrl,

      // Rich metadata
      metadata: {
        uploaderName: item.uploaderName,
        duration: item.duration,
        viewCount: item.viewCount,
        uploadDate: item.uploadDate,
      },

      // UI-ready formatted data
      displayDuration: formatDuration(item.duration),
      displayViews: formatViews(item.viewCount),
      displayDate: formatRelativeDate(item.uploadDate),
    };
  });

  return {
    // Backward compatibility
    total: items.length,
    videos: items.filter(item => item.type === 'stream'),

    // Enhanced v2 capabilities
    items: items,
    streams: items.filter(item => item.type === 'stream'),
    channels: items.filter(item => item.type === 'channel'),

    // Pagination support
    pagination: {
      nextPageToken: data.nextPageToken || null,
      hasNextPage: data.hasNextPage || false,
    },
  };
}
